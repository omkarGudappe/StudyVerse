const mongoose = require('mongoose');

const UserChat = new mongoose.Schema({
    User1: { type: mongoose.Schema.Types.ObjectId , ref: "User", required: true },
    OtherUser: [
        {
            User2: { type: mongoose.Schema.Types.ObjectId, ref: "User" , required: true },
            ChatId: { type: String, required: true },
            LastSeen: { type: Date },
            recentMessageTime: { type: Date, default: Date.now },
            recentMessage: { type: String, default: "" },
            unreadCount: { type: Number, default: 0 },
        }
    ],
})

module.exports = mongoose.model("UsersChat", UserChat);