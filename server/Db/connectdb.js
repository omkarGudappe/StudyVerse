const mongoose = require('mongoose');

const connectDB = async () => {
    try{
        await mongoose.connect(process.env.MONGODB_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
    }catch(err) {
        console.error("Database connection error:", err);
    }
}

mongoose.connection.on("connected", () => {
    console.log("MongoDB connected successfully.");
})

mongoose.connection.on("error" , (err) => {
    console.error("MongoDB connection error:", err);
});

mongoose.connection.on("reconnect" , () => {
    console.log("MongoDB ReConnected");
})

module.exports = connectDB;
