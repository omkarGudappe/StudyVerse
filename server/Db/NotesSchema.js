const mongoose = require('mongoose');

const NotesSchema = new mongoose.Schema({
    title: {type: String , require: true, },
    NoteId: {type: String , unique:true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", require: true },
    content: { type: Object },
}, { timestamps: true });

module.exports = mongoose.model("Note", NotesSchema);