const mongoose = require("mongoose");

const GroupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  members: [
    {
      member: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      isAdmin: { type: Boolean, default: false },
    }
  ],
  firestorePath: { type: String, required: true , unique: true },
  recentMessageTime: { type: Date, default: Date.now },
  recentMessage: { type: String, default: "" },
  unreadCount: { type: Number, default: 0 },
  avatar: { type: String, default: "" },
}, { timestamps: true });

GroupSchema.index({ "members.member": 1 });
GroupSchema.index({ createdBy: 1 });
GroupSchema.index({ recentMessageTime: -1 });

module.exports = mongoose.model("Group", GroupSchema);