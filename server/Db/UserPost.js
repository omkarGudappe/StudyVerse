const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    heading: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    contentType: {
        type: String,
        enum: ["post", "lesson", "note"],
        default: "post"
    },
    files: {
            url: { type: String , required: true },
            publicId: { type: String, required: true },
             type: { 
                type: String, 
                enum: ["image", "video", "raw"], 
                required: true 
            }
        },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            comment: { type: String, required: true },
            createdAt: { type: Date, default: Date.now }
        }
    ],
    share: [
        {
            sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            sharedAt: { type: Date, default: Date.now }
        }
    ],
    visibility: { type: String, enum: ["public", "peers"], default: "public" },
    createdAt: { type: Date, default: Date.now }
}, {timestamps: true});

PostSchema.index({
  heading: "text",
  description: "text"
});

PostSchema.index({ contentType: 1, heading: "text", description: "text" });
PostSchema.index({ contentType: 1, createdAt: -1 });
PostSchema.index({ contentType: 1, visibility: 1, author: 1 });
PostSchema.index({ contentType: 1, visibility: 1, author: 1, createdAt: -1 });
PostSchema.index({ author: 1, contentType: 1, createdAt: -1 });
PostSchema.index({ _id: 1, "comments.createdAt": -1 });
PostSchema.index({ "comments.user": 1 });

module.exports = mongoose.model("Posts" , PostSchema);