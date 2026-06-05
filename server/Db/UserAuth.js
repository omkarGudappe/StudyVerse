const mongoose = require("mongoose");

const AuthSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
    },
    password: {
        type: String,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId, ref: "User"
    },

    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Auth = mongoose.model("Auth", AuthSchema);

module.exports = Auth;
