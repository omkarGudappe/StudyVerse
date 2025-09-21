const mongoose = require("mongoose");

const GroupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  firestorePath: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model("Group", GroupSchema);