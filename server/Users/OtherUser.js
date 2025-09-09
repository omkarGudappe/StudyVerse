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

Router.post('/update', async (req, res) => {
    // const { firstName, lastName, description, heading, gender, dob, education } = req.body;
    const { firstName } = req.body;

    if(firstName) {
        return res.json({exist: `Got a UserId ${firstName}`});
    }


    // try {
    //     let updateData = {
    //         firstName,
    //         lastName,
    //         dob,
    //         gender,
    //         education,
    //         "UserProfile.description": description,
    //         "UserProfile.heading": heading,
    //     };

    //     if (req.file) {
    //         const uploadResult = await cloudinary.uploader.upload(req.file.path, {
    //             folder: "studyverse/profiles",
    //         });

    //         updateData["UserProfile.avatar"] = {
    //             url: uploadResult.secure_url,
    //             publicId: uploadResult.public_id,
    //         };
    //     }

    //     const updatedProfile = await User.findOneAndUpdate(
    //         { firebaseUid: userId },
    //         updateData,
    //         { new: true }
    //     );

    //     if (!updatedProfile) {
    //         return res.status(404).json({ message: "User not found", code: "USER_NOT_FOUND" });
    //     }

    //     res.json({ 
    //         ok: true, 
    //         message: "Profile updated successfully", 
    //         user: updatedProfile 
    //     });

    // } catch (err) {
    //     console.error("Error updating profile:", err);
    //     res.status(500).json({ 
    //         ok: false,
    //         message: "Internal server error", 
    //         code: "INTERNAL_SERVER_ERROR" 
    //     });
    // }
});

module.exports = Router