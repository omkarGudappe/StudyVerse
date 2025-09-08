const User = require('../Db/User');

module.exports = function(io) {
  io.on("connection", (socket) => {

    socket.on("SendRequest", async ({Id , fromID}) => {
      try{
        console.log("Hello");
        if(!Id || !fromID){
          return console.log("Missing Requirment");
        }
        await User.findByIdAndUpdate(
          Id,
          { $addToSet: { connectionRequests: fromID } },
          {new: true},
        )

        
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
        console.log("hello" , Id  )
    })

  });
};