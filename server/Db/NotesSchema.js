const mongoose = require('mongoose');

// const NotesSchema = new mongoose.Schema({
//     title: {type: String , require: true, },
//     NoteId: {type: String , unique:true },
//     author: { type: mongoose.Schema.Types.ObjectId, ref: "User", require: true },
//     content: { type: Object },
// }, { timestamps: true });

const NoteDetailSchema = new mongoose.Schema({
    title: {type: String , require: true, },
    NoteId: {type: String , unique:true },
    content: { type: Object },
}, { timestamps: true } )

const NotesSchema = new mongoose.Schema({
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", require: true },
    Notes: [NoteDetailSchema],
});

module.exports = mongoose.model("Note", NotesSchema);