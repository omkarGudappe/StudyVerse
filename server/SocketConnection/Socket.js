const User = require("../Db/User");
const Chat = require("../Db/Chat");
const Post = require("../Db/UserPost");
const userSocketMap = require('./socketMap');
const GroupChat = require("../Db/GroupChat");

// const userSocketMap = new Map();

const FetchConnectionRequiestDb = async (userId) => {
  try {
    const GetNotificationLength = await User.findById({ _id: userId });
    if (!GetNotificationLength) {
      return console.log("User Not Found");
    }
    const NotificationLength = GetNotificationLength.notification.length;
    const ConnectionRequestLength =
      GetNotificationLength.connectionRequests.length;
    const Length = NotificationLength + ConnectionRequestLength;
    return Length;
  } catch (err) {
    console.log("getting error 1", err.message);
  }
};

const FetchNotification = async (userId) => {
  try {
    const GetNotification = await User.findById({ _id: userId })
      .select("notification.user notification.Type notification.whichPost")
      .populate("notification.user", "firstName lastName UserProfile.avatar")
      .populate("notification.whichPost", "files.url");

    if (!GetNotification) {
      return "User Not Found";
    }

    return GetNotification;
  } catch (err) {
    console.log(err.message);
  }
};

module.exports = function (io) {
  io.on("connection", (socket) => {
    socket.on("registerUser", async ({ userId }) => {
      if (userId) {
        userSocketMap.set(userId, socket.id);
        console.log(`User ${userId} connected with socket ${socket.id}`);
        const Length = await FetchConnectionRequiestDb(userId);

        const acceptorSocketId = userSocketMap.get(userId);
        console.log("getNotify");
        io.to(acceptorSocketId).emit("Length", { Length: Length });
      }
    });

     socket.on('joinUploadRoom', (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined upload room`);
    });

    socket.on("disconnect", () => {
      for (let [userId, socketId] of userSocketMap.entries()) {
        if (socketId === socket.id) {
          userSocketMap.delete(userId);
          console.log(`User ${userId} disconnected`);
          break;
        }
      }
    });

    socket.on("Send-Cancel-Request", async ({ Id, fromID, title }) => {
      try {
        if (!Id || !fromID) {
          return console.log("Missing Requirment");
        }
        if (title === "request") {
          const GetCheckAutoRequestAcceptIsEnableOrNot = await User.findById(
            Id
          ).select("setting");

          if (!GetCheckAutoRequestAcceptIsEnableOrNot) {
            return console.log("User not found");
          }

          const { setting } = GetCheckAutoRequestAcceptIsEnableOrNot;

          if (setting.acceptAllPeersRequest) {
            await User.findByIdAndUpdate(fromID, {
              $addToSet: { MyConnections: Id },
            });

            await User.findByIdAndUpdate(
              Id,
              { $addToSet: { connections: fromID } },
              { new: true }
            );
          } else {
            await User.findByIdAndUpdate(
              Id,
              { $addToSet: { connectionRequests: fromID } },
              { new: true }
            );
          }
        } else if (title === "UnPeer") {
          await User.findByIdAndUpdate(
            Id,
            { $pull: { connections: fromID } },
            { new: true }
          );
          await User.findByIdAndUpdate(
            fromID,
            { $pull: { MyConnections: Id } },
            { new: true }
          );
        } else {
          await User.findByIdAndUpdate(
            Id,
            { $pull: { connectionRequests: fromID } },
            { new: true }
          );
        }
        const Length = await FetchConnectionRequiestDb(Id);

        const acceptorSocketId = userSocketMap.get(Id);
        const SenderSocketId = userSocketMap.get(fromID);
        console.log("getNotify");
        io.to(acceptorSocketId).emit("Length", { Length: Length });
        io.to(SenderSocketId).emit("connection-updated", {
          userId: Id,
          fromId: fromID,
          type: title,
        });
      } catch (err) {
        console.error("Somthing Error: ", err.message);
      }
    });

    socket.on("acceptRequest", async ({ Id, fromID, notificationId }) => {
      try {
        if (!Id || !fromID) {
          return console.log("Missing Requirment");
        }

        await User.findByIdAndUpdate(fromID, {
          $addToSet: { MyConnections: Id },
        });

        await User.findByIdAndUpdate(
          Id,
          {
            $addToSet: { connections: fromID },
            $pull: { connectionRequests: fromID },
          },
          { new: true }
        );

        const Length = await FetchConnectionRequiestDb(Id);

        const acceptorSocketId = userSocketMap.get(Id);
        const requesterSocketId = userSocketMap.get(fromID);

        console.log("getNotify");
        io.to(acceptorSocketId).emit("Length", { Length: Length });
        io.to(acceptorSocketId).emit("requestAccepted", {
          success: true,
          message: "Connection request accepted.",
          FromID: fromID,
          notificationId: notificationId,
        });
        // io.emit("connection-updated", {
        //   userId: Id,
        //   fromId: fromID,
        //   type: "accepted",
        // });
        if (acceptorSocketId) {
          io.to(acceptorSocketId).emit("connection-updated", {
            userId: Id,
            fromId: fromID,
            type: "accepted",
          });
        }

        if (requesterSocketId) {
          io.to(requesterSocketId).emit("connection-updated", {
            userId: Id,
            fromId: fromID,
            type: "accepted",
          });
        }
      } catch (err) {
        console.error("Error accepting request:", err.message);
      }
    });

    socket.on("declineRequest", async ({ Id, fromID }) => {
      if (!Id || !fromID) {
        return console.log("Data is Missing :", Id, "and", fromID);
      }
      await User.findByIdAndUpdate(Id, {
        $pull: { connectionRequests: fromID },
      });
      const Length = await FetchConnectionRequiestDb(Id);
      const acceptorSocketId = userSocketMap.get(Id);
      io.to(acceptorSocketId).emit("Length", { Length: Length });
      const requesterSocketId = userSocketMap.get(fromID);

      if (acceptorSocketId) {
          io.to(acceptorSocketId).emit("connection-updated", { 
              userId: Id,
              fromId: fromID,
              type: 'declined'
          });
      }

      if (requesterSocketId) {
          io.to(requesterSocketId).emit("connection-updated", { 
              userId: Id,
              fromId: fromID,
              type: 'declined'
          });
      }
    });

    socket.on("UsersChat", async ({ user1, user2, chatId }) => {
      if (!user1 || !user2 || !chatId) {
        console.log("Missing");
        return io
          .to(socket.id)
          .emit("error", { ok: false, message: "Missing requirement" });
      }
      try {
        await Chat.updateOne(
          { User1: user1, "OtherUser.User2": { $ne: user2 } },
          {
            $push: {
              OtherUser: {
                User2: user2,
                ChatId: chatId,
              },
            },
          },
          { upsert: true }
        );

        await Chat.updateOne(
          { User1: user2, "OtherUser.User2": { $ne: user1 } },
          {
            $push: {
              OtherUser: {
                User2: user1,
                ChatId: chatId,
              },
            },
          },
          { upsert: true }
        );

        io.to(socket.id).emit("Users-chat", {
          ok: true,
          message: "Chat saved successfully",
        });
      } catch (err) {
        console.log("❌ Something went wrong:", err.message);
        io.to(socket.id).emit("error", {
          ok: false,
          message: "Internal server error",
        });
      }
    });

  //  socket.on("SendContactUsers", async ({ ID }) => {
  //   if (!ID) {
  //     console.log("Id not found from the socket sendcontact user");
  //     return io.to(socket.id).emit("IdNotFound", { message: "Id Missing" });
  //   }
  //   console.log("Finding User");
  //   try {
  //     const Users = await Chat.findOne({ User1: ID }).populate({
  //       path: "OtherUser.User2",
  //       select: "firstName lastName UserProfile.avatar username education firebaseUid",
  //     });

  //     const userGroups = await GroupChat.find({ members: ID })
  //       .populate("members", "firstName lastName username UserProfile.avatar.url")
  //       .populate("createdBy", "firstName lastName username");

  //       console.log("Get Users Groups ", userGroups);

  //     if (!Users) {
  //       return io
  //         .to(socket.id)
  //         .emit("UserNotFound", { message: "User is not exist" });
  //     }

  //     socket.emit("ContactUsers", { 
  //       User: Users.OtherUser,
  //       Groups: userGroups || [] 
  //     });
  //   } catch (err) {
  //     console.log("Error in SendContactUsers:", err.message);
  //     socket.emit("ContactUsersError", { message: "Failed to fetch contacts and groups" });
  //   }
  // });

socket.on("SendContactUsers", async ({ ID }) => {
  if (!ID) {
    return io.to(socket.id).emit("IdNotFound", { message: "Id Missing" });
  }

  try {
    const userChat = await Chat.findOne({ User1: ID })
      .populate({
        path: "OtherUser.User2",
        select: "firstName lastName username UserProfile.avatar.url education firebaseUid",
        options: { lean: true }
      })
      .lean();

    let sortedContacts = [];
    if (userChat && userChat.OtherUser) {
      sortedContacts = userChat.OtherUser
        .filter(contact => contact.User2)
        .sort((a, b) => {
          const timeA = a.recentMessageTime ? new Date(a.recentMessageTime).getTime() : 0;
          const timeB = b.recentMessageTime ? new Date(b.recentMessageTime).getTime() : 0;
          return timeB - timeA; // Descending order (most recent first)
        })
        .slice(0, 100);
    }

    // Update this part to sort groups by recentMessageTime
    const userGroups = await GroupChat.find({ "members.member": ID })
      .select("name members createdBy recentMessage recentMessageTime avatar")
      .lean();

    const sortedGroups = userGroups
      .filter(group => group)
      .sort((a, b) => {
        const timeA = a.recentMessageTime ? new Date(a.recentMessageTime).getTime() : 0;
        const timeB = b.recentMessageTime ? new Date(b.recentMessageTime).getTime() : 0;
        return timeB - timeA;
      })
      .slice(0, 50);

    socket.emit("ContactUsers", {
      User: sortedContacts,
      Groups: sortedGroups || []
    });

  } catch (err) {
    console.error("Error in SendContactUsers:", err);
    socket.emit("ContactUsersError", { message: "Failed to fetch contacts" });
  }
});

// Add this to your socket.io connection handler
socket.on("new-group-message", async ({ groupId, message, sender }) => {
  try {
    const group = await GroupChat.findByIdAndUpdate(
      groupId,
      {
        recentMessage: message.substring(0, 100),
        recentMessageTime: new Date()
      },
      { new: true }
    ).populate("members", "firstName lastName username");

    if (group) {
      group.members.forEach(member => {
        const memberSocketId = userSocketMap.get(member._id.toString());
        if (memberSocketId) {
          io.to(memberSocketId).emit("ContactsUpdated", { refresh: true });
        }
      });
    }
  } catch (error) {
    console.error("Error updating group recent message:", error);
  }
});

    socket.on("UpdateContactRecentMessage", async ({ userId, contactId, message, timestamp }) => {
      try {
        await Chat.findOneAndUpdate(
          { 
            User1: userId,
            "OtherUser.User2": contactId 
          },
          { 
            $set: { 
              "OtherUser.$.recentMessage": message.substring(0, 100),
              "OtherUser.$.recentMessageTime": timestamp || new Date()
            } 
          }
        );

        await Chat.findOneAndUpdate(
          { 
            User1: contactId,
            "OtherUser.User2": userId 
          },
          { 
            $set: {
              "OtherUser.$.recentMessage": message.substring(0, 100),
              "OtherUser.$.recentMessageTime": timestamp || new Date(),
              "OtherUser.$.unreadCount": 1 
            } 
          }
        );

        const userSocketId = userSocketMap.get(userId);
        const contactSocketId = userSocketMap.get(contactId);
        
        if (userSocketId) {
          io.to(userSocketId).emit("ContactsUpdated", { refresh: true });
        }
        if (contactSocketId) {
          io.to(contactSocketId).emit("ContactsUpdated", { refresh: true });
        }

      } catch (error) {
        console.error("Error updating contact recent message:", error);
      }
    });

    socket.on("NewPostUploded", ({ upload }) => {
      console.log("Check Upload", upload);
      if (upload) {
        console.log("from the FetchAgin Socket Backend");
        io.emit("FetchAgain", { Fetch: true });
      }
    });

    socket.on("Handle-user-like", async ({ postId, userId, type, toId }) => {
      if (!postId || !userId) {
        return console.log("Missing requirment", postId, "and", userId);
      }
      try {
        const post = await Post.findById(postId);
        if (!post) return;

        const isLiked = post.likes.includes(userId);
        console.log(isLiked);

        const newNotification = {
          user: userId,
          Type: type,
          whichPost: postId,
        };

        if (isLiked) {
          await Post.findByIdAndUpdate(
            postId,
            { $pull: { likes: userId } },
            { new: true }
          );

          await User.findByIdAndUpdate(
            toId,
            {
              $pull: {
                notification: newNotification,
              },
            },
            { new: true }
          );
        } else {
          await Post.findByIdAndUpdate(
            postId,
            { $addToSet: { likes: userId } },
            { new: true }
          );

          if (userId !== toId) {
            await User.findByIdAndUpdate(
              toId,
              { $push: { notification: newNotification } },
              { new: true }
            );
          }

          const getNotify = await FetchNotification(toId);
          const GetId = userSocketMap.get(toId);
          const GetUserId = userSocketMap.get(userId);
          io.to(GetId).emit("getNotify", { getNotify });
        }

        const GetNotificaionUserSetting = await User.findById(toId);

        if (GetNotificaionUserSetting.setting.showLikeNotifications) {
          const Length = await FetchConnectionRequiestDb(toId);
          const acceptorSocketId = userSocketMap.get(toId);
          io.to(acceptorSocketId).emit("Length", { Length: Length });
        }

        const updatedPost = await Post.findById(postId).populate(
          "likes",
          "username"
        );

        io.emit("post-like-updated", {
          postId,
          likes: updatedPost.likes,
          liked: !isLiked,
        });
      } catch (err) {
        console.log("Like error:", err.message);
      }
    });

    socket.on("handle-delete-notification", async ({ Id, userId }) => {
      if (!Id || !userId) {
        return console.log("Missing requirement", Id, "and", userId);
      }

      try {
        await User.findByIdAndUpdate(
          { _id: userId },
          { $pull: { notification: { _id: Id } } },
          { new: true }
        );

        const Length = await FetchConnectionRequiestDb(userId);

        const acceptorSocketId = userSocketMap.get(userId);
        io.to(acceptorSocketId).emit("Length", { Length: Length });
        io.to(acceptorSocketId).emit("Removed", { status: "removed", Id: Id });
        
      } catch (err) {
        console.log(err.message);
      }
    });

    socket.on("post-shared-notification", async ({ postId, recipientId, senderId }) => {
      try {
        console.log("For chekcform the socket", postId, "and", recipientId, "and ",senderId )
        const post = await Post.findById(postId)
          .populate('author', 'firstName lastName UserProfile.avatar username');
        
        if (!post) return;
        console.log("2 For chekcform the socket", postId, "and", recipientId, "and ",senderId )
        const recipientSocketId = userSocketMap.get(recipientId);
        console.log(recipientSocketId , "for a check ", )
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('post-shared', {
            postId,
            postData: {
              _id: post._id,
              heading: post.heading,
              description: post.description,
              files: post.files,
              author: {
                _id: post.author._id,
                firstName: post.author.firstName,
                lastName: post.author.lastName,
                username: post.author.username,
                UserProfile: post.author.UserProfile
              }
            },
            senderId
          });
        }
        console.log("1 For chekcform the socket", postId, "and", recipientId, "and ",senderId )
      } catch (error) {
        console.log('Error sending post share notification:', error);
      }
    });

    socket.on("NewPostUploded", ({ upload }) => {
      console.log("Check Upload", upload);
      if (upload) {
        console.log("from the FetchAgin Socket Backend");
        socket.broadcast.emit("FetchAgain", { Fetch: true });
      }
    });

    socket.on('OnlineStatus' , ({ CurrentUserId, OtherUserId }) => {
      try{
        if(!CurrentUserId || !OtherUserId) return;
        console.log("Check data is correct for online status", CurrentUserId, "and", OtherUserId);
        const OnlineStatus =  userSocketMap.get(OtherUserId);
        const CurrentUserSocketId = userSocketMap.get(CurrentUserId);
        if(OnlineStatus){
          console.log('True Online Status')
          io.to(CurrentUserSocketId).emit('UserOnlineStatus', ({Online: true}))
        }else{
          console.log('none')
        }
      }catch(err){
        console.log("Error from the Online status", err.message);
      }
    })
  });
};
