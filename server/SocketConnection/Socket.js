const User = require('../Db/User');
const Chat = require('../Db/Chat');
const Post = require('../Db/UserPost');

const userSocketMap = new Map();

const FetchConnectionRequiestDb = async(userId) => {
    try{
      const GetNotificationLength = await User.findById({ _id: userId })
      if(!GetNotificationLength){
        return console.log("User Not Found");
      }
      const NotificationLength = GetNotificationLength.notification.length;
      const ConnectionRequestLength = GetNotificationLength.connectionRequests.length;
      const Length = NotificationLength + ConnectionRequestLength;
      return Length;

    }catch(err){
    console.log("getting error 1" , err.message);
  }
}

const FetchNotification = async (userId) => {
  try{
    const GetNotification = await User.findById({ _id: userId })
    .select("notification.user notification.Type notification.whichPost")
    .populate("notification.user" , "firstName lastName UserProfile.avatar")
    .populate("notification.whichPost", "files.url")

    if(!GetNotification){
      return "User Not Found";
    }

    return GetNotification;
  }catch(err) {
    console.log(err.message);
  }
}

module.exports = function(io) {
  io.on("connection", (socket) => {

    socket.on("registerUser", async ({userId}) => {
      if (userId) {
        userSocketMap.set(userId, socket.id);
        console.log(`User ${userId} connected with socket ${socket.id}`);
         const Length = await FetchConnectionRequiestDb(userId);

        const acceptorSocketId = userSocketMap.get(userId);
          console.log("getNotify");
          io.to(acceptorSocketId).emit("Length", { Length:Length })  
      }
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

    socket.on("SendRequest", async ({Id , fromID}) => {
      try{
        console.log("Hello" , Id);
        if(!Id || !fromID){
          return console.log("Missing Requirment");
        }
        await User.findByIdAndUpdate(
          Id,
          { $addToSet: { connectionRequests: fromID } },
          {new: true},
        )
        const Length = await FetchConnectionRequiestDb(Id);

        const acceptorSocketId = userSocketMap.get(Id);
          console.log("getNotify");
          io.to(acceptorSocketId).emit("Length", { Length:Length })  
      }catch(err){
        console.error("Somthing Error: ", err.message);
      }
    });

    socket.on("acceptRequest" , async({Id, fromID}) => {
      try{
        if(!Id || !fromID){
          console.log("Accept Request From Frontend" , Id , " and ", fromID);
          return console.log("Missing Requirment");
        }

         await User.findByIdAndUpdate(
          fromID,
          { $addToSet: { MyConnections: Id },}
        )

         await User.findByIdAndUpdate(
          Id,
          { $addToSet: { connections: fromID },
            $pull: { connectionRequests: fromID }
          },
          { new: true }
        )
        
        const Length = await FetchConnectionRequiestDb(Id);

        const acceptorSocketId = userSocketMap.get(Id);
          console.log("getNotify");
          io.to(acceptorSocketId).emit("Length", { Length:Length })  
        io.to(socket.id).emit("requestAccepted", { success: true, message: "Connection request accepted.", FromID: fromID });
      }catch(err) {
        console.error("Error accepting request:", err.message);
      }
    })

    socket.on("declineRequest", async ({Id, fromID}) => {
      if(!Id || !fromID){
        return console.log("Data is Missing :", Id , 'and', fromID);
      }
      await User.findByIdAndUpdate(
        Id,
        { $pull: { connectionRequests: fromID} }
      )
        const Length = await FetchConnectionRequiestDb(Id);
        const acceptorSocketId = userSocketMap.get(Id);
        io.to(acceptorSocketId).emit("Length", { Length:Length })  
    })

    socket.on("UsersChat", async ({user1, user2, chatId}) => {
      if (!user1 || !user2 || !chatId) {
        console.log("Missing");
        return io.to(socket.id).emit("error", { ok: false, message: "Missing requirement" });
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

        io.to(socket.id).emit("Users-chat", { ok: true, message: "Chat saved successfully",  });
      } catch (err) {
        console.log("❌ Something went wrong:", err.message);
        io.to(socket.id).emit("error", { ok: false, message: "Internal server error" });
      }
    });

    socket.on("SendContactUsers" , async ({ ID }) => {
      if(!ID){
       return io.to(socket.id).emit("IdNotFound", {message: "Id Missing"})
      }
      try{
        const Users = await Chat.findOne({ User1: ID }).populate({
          path: "OtherUser.User2", 
          select: "firstName lastName UserProfile.avatar username"
        })
        if(!Users){
          return io.to(socket.id).emit("UserNotFound" , {message: "User is not exist"})
        }
        socket.emit("ContactUsers" , { User: Users.OtherUser});
      }catch(err){
        console.log(err.message);
      }
    })

    socket.on("NewPostUploded", ({ upload }) => {
      console.log("Check Upload",upload)
      if(upload){
        console.log("from the FetchAgin Socket Backend")
        io.emit("FetchAgain", { Fetch: true });
      }
    })

    socket.on("Handle-user-like", async ({postId, userId , type, toId}) => {
      if(!postId || !userId){
        return console.log("Missing requirment", postId ,"and", userId);
      }
      try{
        const post = await Post.findById(postId);
        if (!post) return;
        
        const isLiked = post.likes.includes(userId);
        console.log(isLiked);
        
        const newNotification = {
            user: userId,
            Type: type,
            whichPost: postId,
        }

        if (isLiked) {
          await Post.findByIdAndUpdate(
            postId,
            { $pull: { likes: userId } },
            { new: true }
          );

          
           await User.findByIdAndUpdate(
            toId,
            { 
              $pull : { 
                notification: newNotification 
              }
            },
            {new: true}
          )
          
        } else {
          await Post.findByIdAndUpdate(
            postId,
            { $addToSet: { likes: userId } },
            { new: true }
          );

        if(userId !== toId){
            await User.findByIdAndUpdate(
            toId,
            { $push : { notification: newNotification }},
            {new: true}
          )
        }
          
          const getNotify = await FetchNotification(toId)
          const GetId = userSocketMap.get(toId);
          const GetUserId = userSocketMap.get(userId);
          console.log("now Ids" , userId , "to Id" , toId);
          console.log(GetId , "and", GetUserId);
          io.to(GetId).emit("getNotify", {getNotify});
        }

          const Length = await FetchConnectionRequiestDb(toId);

          const acceptorSocketId = userSocketMap.get(toId);
          console.log("Cheking KEy data" , userSocketMap);
            console.log("getNotify");
            io.to(acceptorSocketId).emit("Length", { Length:Length })  
        
        const updatedPost = await Post.findById(postId).populate('likes', 'username');
        
        io.emit("post-like-updated", {
          postId, 
          likes: updatedPost.likes,
          liked: !isLiked 
        });
        
      } catch(err) {
        console.log("Like error:", err.message);
      }
    });

    socket.on("handle-delete-notification" , async ({Id , userId}) => {
      if(!Id || !userId) {
        return console.log("Missing requirement", Id ,"and", userId);
      }

      try{
        await User.findByIdAndUpdate(
          {_id: userId},
          { $pull : { notification: { _id: Id } }},
          { new: true },
        )

          const Length = await FetchConnectionRequiestDb(userId);

          const acceptorSocketId = userSocketMap.get(userId);
          console.log("Cheking KEy data" , userSocketMap);
          console.log("getNotify");
          io.to(acceptorSocketId).emit("Length", { Length:Length })  
      }catch(err){
        console.log(err.message);
      }
    })

    socket.on("NewPostUploded", ({ upload }) => {
      console.log("Check Upload", upload);
      if(upload){
        console.log("from the FetchAgin Socket Backend");
        socket.broadcast.emit("FetchAgain", { Fetch: true });
      }
    });

  });
};