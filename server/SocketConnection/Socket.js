const User = require('../Db/User');
const Chat = require('../Db/Chat');

const userSocketMap = new Map();

module.exports = function(io) {
  io.on("connection", (socket) => {

    socket.on("registerUser", async (userId) => {
      if (userId) {
        userSocketMap.set(userId, socket.id);
        console.log(`User ${userId} connected with socket ${socket.id}`);

        try{
          const GetNotificationLength = await User.findById({ userId })
          if(!GetNotificationLength){
            return console.log("User Not Found");
          }
          const Length = GetNotificationLength.connectionRequests.length;

          const acceptorSocketId = userSocketMap.get(userId);
          if(Length > 0){
            console.log("getNotify");
            io.to(acceptorSocketId).emit("Length", { Length:Length })  
          }else{
            console.log("No notification")
            io.to(acceptorSocketId).emit("Length" , { Length: 0 });
          }
        }catch(err){
          console.log("getting error" , err.message);
        }
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
        try{
          const GetNotificationLength = await User.findOne({ _id: Id })
          if(!GetNotificationLength){
            return console.log("User Not Found");
          }
          const Length = GetNotificationLength.connectionRequests.length;

          const acceptorSocketId = userSocketMap.get(Id);
          if(Length > 0){
            console.log("getNotify");
            io.to(acceptorSocketId).emit("Length", { Length:Length })
          }else{
            console.log("No notification")
            io.to(acceptorSocketId).emit("Length" , { Length: 0 });
          }
        }catch(err){
          console.log("getting error" , err.message);
        }
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
        
        try{
          const GetNotificationLength = await User.findById({ Id })
          if(!GetNotificationLength){
            return console.log("User Not Found");
          }
          const Length = GetNotificationLength.connectionRequests.length;

          const acceptorSocketId = userSocketMap.get(Id);
          if(Length > 0){
            console.log("getNotify");
            io.to(acceptorSocketId).emit("Length", { Length:Length })
          }else{
            console.log("No notification")
            io.to(acceptorSocketId).emit("Length" , { Length: 0 });
          }
        }catch(err){
          console.log("getting error" , err.message);
        }

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
       try{
        console.log(Id);
          const GetNotificationLength = await User.findById({ Id })
          if(!GetNotificationLength){
            return console.log("User Not Found");
          }
          const Length = GetNotificationLength.connectionRequests.length;

          const acceptorSocketId = userSocketMap.get(Id);
          if(Length > 0){
            console.log("getNotify");
            io.to(acceptorSocketId).emit("Length", { Length:Length })
          }else{
            console.log("No notification")
            io.to(acceptorSocketId).emit("Length" , { Length: 0 });
          }
        }catch(err){
          console.log("getting error" , err.message);
        }
    })

    socket.on("UsersChat", async ({user1, user2, chatId}) => {
      if (!user1 || !user2 || !chatId) {
        console.log("Missing");
        return io.to(socket.id).emit("error", { ok: false, message: "Missing requirement" });
      }
      console.log("hello")
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
      console.log("working")
      try{
        const Users = await Chat.findOne({ User1: ID }).populate({
          path: "OtherUser.User2", 
          select: "firstName lastName UserProfile.avatar username"
        })
        if(!Users){
          return io.to(socket.id).emit("UserNotFound" , {message: "User is not exist"})
        }
        console.log("chaeking")
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

  });
};