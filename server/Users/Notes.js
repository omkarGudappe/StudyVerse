const express = require('express');
const Router = express.Router();
const User = require('../Db/User');
const Notes = require('../Db/NotesSchema');

Router.get('/:userName' , async (req, res) => {
    try{
        const { userName } = req.params;
        if(!userName) {
            return res.status(400).json({ok: false, message: "Missing Requirment" });
        }

        await User.findOne({ username: userName}).then((user) => {
            if(user){
                return res.status(200).json({ok: true, user})
            }else {
                return res.status(404).json({ok: false, message: "User Not Found"})
            }
        })

    }catch(err){
        console.error("Somthing Wrong" , err);
        res.status(500).json({ok: false, message: err.message});
    }
})

Router.delete('/delete/:noteId', async (req, res) => {
    const { noteId } = req.params;
    const uid = req.query.userId;

    if(!noteId) {
        return res.status(404).json({message: "Somthing went wrong , Please try again"});
    }

    try{
      const Track =  await Notes.findOneAndUpdate(
        {author: uid},
        { $pull: {Notes: {NoteId: noteId}}},
        {new: true}
      );

      if(!Track) {
        return res.status(404).json({message: "User Not found"});
      }

      res.json({ok: true, message: "Note is deleted"});
    }catch(err){
        res.status(500).json({message: "Surver is busy"});
        console.log(err.message);
    }
})

Router.put('/update/:Id' , async(req, res) => {
    const { Id } = req.params;
    const { content, userId } = req.body;

    if(!Id) {
        return res.status(404).json({ message: " Missing requirment" })
    }

    try{
       await Notes.findOneAndUpdate(
        { author: userId, "Notes._id": Id },
        { $set: { "Notes.$.content": content } },
        { new: true }
       );

       return res.json({ok: true})

    }catch(err) {
        res.status(500).json({message: err.message});
    }
})

Router.post('/usernotes' , async (req , res) =>{
    const { title , NoteId , uid, content } = req.body;

    if(!title || !NoteId || !uid){
        return res.status(404).json({ message:`Missing requirements ${title} , ${NoteId} , ${uid}`});
    }
    
    try{
        const FindUser = await User.findOne({_id: uid});

        if(!FindUser) {
            return res.status(404).json({message:"User Not Found"});
        }

        const NewNoteCreate = {
            title,
            NoteId,
            content: content,
        };
        const FirstFindUserNotes = await Notes.findOneAndUpdate(
            {author: uid},
            {$push: {Notes: NewNoteCreate}}
        )

        if(FirstFindUserNotes){
            return res.json({ok: true, message: "User Found And Updated"});
        }else{
            const NewNote = await Notes.create({
                author: FindUser._id,
                Notes: {
                    title,
                    NoteId,
                    content: content,
                }
            })

            if(NewNote) {
                return res.json({ok: true, message: "New Notes is created"});
            }
        }
    }catch(err){
        console.log(err.message);
        return res.status(500).json({ message: err.message });
    }
})

Router.get('/usernotes/:ID', async (req, res) => {
    const { ID } = req.params;

    try{
       const notes = await Notes.find({ author: ID })
       .select('Notes');

        if(!notes){
            return res.status(404).json({message: "User Not Found"});
        }

        return res.json({ok: true, message: "Notes Found" , notes});

    }catch(err){
        res.status(500).json({message: err.message});
        console.log(err.message);
    }
})

module.exports = Router