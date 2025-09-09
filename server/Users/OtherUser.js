const express = require('express');
const Router = express.Router();
const User = require('../Db/User');

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

module.exports = Router