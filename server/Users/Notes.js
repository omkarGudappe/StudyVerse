const express = require('express');
const Router = express.Router();
const User = require('../Db/User');
const Notes = require('../Db/NotesSchema');

Router.get('/:userName' , async (req, res) => {
    try{
        const { userName } = req.params;
        console.log("Backend" , userName);
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

Router.post('/usernotes' , async (req , res) =>{
    const { title , NoteId , uid } = req.body;

    if(!title || !NoteId || !uid){
        return res.status(404).json({ message:`Missing requirements ${title} , ${NoteId} , ${uid}`});
    }
    
    try{
        const FindUser = await User.findOne({ uid });

        if(!FindUser) {
            return res.status(404).json({message:"User Not Found"});
        }

        const NewNote = await Notes.create({
            title,
            NoteId,
            author: FindUser._id,
            content: "",
        })

        if(NewNote) {
            return res.json({ok: true, message: "New Notes is created"});
        }
    }catch(err){
        return res.status(500).json({ message: err.message });
    }

})

module.exports = Router