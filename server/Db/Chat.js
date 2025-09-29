const mongoose = require('mongoose');

const UserChat = new mongoose.Schema({
    User1: { type: mongoose.Schema.Types.ObjectId , ref: "User", required: true },
    OtherUser: [
        {
            User2: { type: mongoose.Schema.Types.ObjectId, ref: "User" , required: true },
            ChatId: { type: String, required: true },
            LastSeen: { type: Date },
        }
    ],
})

module.exports = mongoose.model("UsersChat", UserChat);