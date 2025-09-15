const express = require('express');
const multer = require('multer');
const cloudinary = require('../CloudinaryStorage/cloudinary');
const User = require('../Db/User');
const Posts = require('../Db/UserPost');

const Router = express.Router();
const storage = multer.diskStorage({});
const upload = multer({ storage });


Router.post('/userdetail' , upload.none(), async (req , res) => {
    const { firstname , lastname , dob , gender , education , Uid , FUid } = req.body;

    // Validate the received data
    if (!firstname || !lastname || !dob || !gender || !education || !Uid || !FUid) {
        return res.json({ ok:false, message: "All fields are required" });
    }

    await User.findOne({ firebaseUid: FUid }).then((existingUser) => {
        if (existingUser) {
            return res.json({ ok:false, message: "User already exists" });
        }
    });

    try {
        const user = new User({
            firstName: firstname,
            lastName: lastname,
            dob,
            gender,
            education,
            Uid,
            firebaseUid: FUid,
            UserProfile: {
                heading: "Hey there! I am using StudyVerse.",
                description: "",
                avatar: { url: "", publicId: "" }
            }
        });

        await user.save();

        res.json({ ok: true, message: "User created successfully", user });
    } catch (error) {
        console.error("Error creating user:", error);
        res.json({ ok: false, message: error.message || "Internal server error" });
    }
})

Router.post('/profile', upload.single('image'), async (req, res) => {
    const { bio, FUid, username } = req.body;

    if (!bio || !FUid || !username) {
        return res.status(400).json({ message: "Bio, User ID and Username are required", code: "MISSING_FIELDS" });
    }

    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded", code: "NO_FILE_UPLOADED" });
    }

    try {
        const usernameTaken = await User.findOne({ username, firebaseUid: { $ne: FUid } });
        if (usernameTaken) {
            return res.status(400).json({ message: "Username is already taken", code: "USERNAME_TAKEN" });
        }

        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: "studyverse/profiles",
        });

        const updatedUser = await User.findOneAndUpdate(
            { firebaseUid: FUid },
            {
                username,
                "UserProfile.description": bio,
                "UserProfile.avatar": {
                    url: result.secure_url,
                    publicId: result.public_id,
                }
            },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found", code: "USER_NOT_FOUND" });
        }

        res.json({ message: "Profile updated successfully", code: "PROFILE_UPDATED", user: updatedUser });
    } catch (err) {
        console.error("Error updating profile:", err);
        res.status(500).json({ message: "Internal server error", code: "INTERNAL_SERVER_ERROR" });
    }
});

Router.get('/friend/username/:userName' , async (req, res) => {
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

Router.get('/profile/:FUid' , async (req , res) => {
    const { FUid } = req.params;

    try{
        const userProfile = await User.findOne({ firebaseUid: FUid });
        if(userProfile){
            return res.json({ message: "User profile fetched successfully", userProfile });
        }else{
            return res.json({ message: "User Not Found" });
        }
    }catch(err){
        console.error("Error fetching user profile:", err);
        res.status(500).json({ message: "Internal server error" });
    }
})


Router.post('/posts/:Fid', upload.single('image'), async (req, res) => {
    try{
        const { Fid } = req.params;
        const { heading, description } = req.body;

        if(!heading || !description || !Fid){
            return res.status(400).json({ message: "All fields required"});
        }

        const MongoId = await User.findOne({ firebaseUid: Fid });

        if(!MongoId){
            return res.status(404).json({ message:"User not Found from the user" });
        }

        const uploadFile = await cloudinary.uploader.upload(req.file.path, {
            folder: "studyverse/posts",
            resource_type: req.file.mimetype === "application/pdf" ? "raw" : "auto",
        });

        const newPost = await Posts.create({
            author: MongoId._id,
            heading,
            description,
            files: {
                url: uploadFile.secure_url,
                publicId: uploadFile.public_id,
                type: uploadFile.resource_type,
            },
        })

        if(newPost) {
            return res.json({ message: "Content Posted Successfully" , newPost });
        }

    }catch(err){
        res.status(500).json({ message: "Because of Some reason content is not posted. Please Try again" });
        console.log("Error: ", err);
    }
})

Router.get('/search', async (req, res) => {
    const { query } = req.query;

    try {
        const users = await User.find({
            $or: [
                { username: { $regex: query, $options: "i" } },
                { "UserProfile.description": { $regex: query, $options: "i" } }
            ]
        });

        res.json({ message: "Search results", users });
    } catch (err) {
        console.error("Error searching users:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});

Router.put('/profile/update/:FUid', upload.single('image'), async (req, res) => {
    const { FUid } = req.params;
    const { firstName, lastName, description, heading, gender, dob, education } = req.body;

    if (!FUid) {
        return res.status(400).json({ message: "User ID is required", code: "MISSING_USER_ID" });
    }

    try {
        let updateData = {
            firstName,
            lastName,
            dob,
            gender,
            education,
            "UserProfile.description": description,
            "UserProfile.heading": heading,
        };

        // If a file is uploaded, add avatar data to update
        if (req.file) {
            const uploadResult = await cloudinary.uploader.upload(req.file.path, {
                folder: "studyverse/profiles",
            });

            updateData["UserProfile.avatar"] = {
                url: uploadResult.secure_url,
                publicId: uploadResult.public_id,
            };
        }

        const updatedProfile = await User.findOneAndUpdate(
            { firebaseUid: FUid },
            updateData,
            { new: true }
        );

        if (!updatedProfile) {
            return res.status(404).json({ message: "User not found", code: "USER_NOT_FOUND" });
        }

        res.json({ 
            ok: true, 
            message: "Profile updated successfully", 
            user: updatedProfile 
        });

    } catch (err) {
        console.error("Error updating profile:", err);
        res.status(500).json({ 
            ok: false,
            message: "Internal server error", 
            code: "INTERNAL_SERVER_ERROR" 
        });
    }
});

Router.get('/:Uid/notifications', async (req, res) => {
  try {
    const { Uid } = req.params;

    if (!Uid) {
      return res.status(400).json({ ok: false, message: "Uid is required" });
    }

    const user = await User.findOne({ Uid })
      .populate("connectionRequests", "firstName lastName UserProfile.avatar");

    if (!user) {
      return res.status(404).json({ ok: false, message: "User not found" });
    }

    const notifications = user.connectionRequests.map(reqUser => ({
      _id: reqUser._id,
      type: "peer_request",
      message: `You have a new peer request from ${reqUser.firstName}`,
      sender: {
        _id: reqUser._id,
        firstName: reqUser.firstName,
        lastName: reqUser.lastName,
        avatar: reqUser?.UserProfile?.avatar?.url || null
      },
      createdAt: new Date(),
      read: false
    }));

    return res.status(200).json({
      ok: true,
      notifications
    });
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ ok: false, message: "Internal server error" });
  }
});


Router.post('/notification/:fromId' , async (req, res) => {
    const { fromId } = req.params;
    const { type, toId } = req.body;

   try{
        if(!fromId || !type) {
        return res.status(404).json({message: "Missing Requirment"});
    }

    const newNotification = {
        user: fromId,
        Type: type,
    }

    const setNotification = await User.findByIdAndUpdate(
        toId,
        { $push : { notification: newNotification }},
        {new: true}
    )

    if(!setNotification){
        return res.status(404).json({message: "User Not Found"});
    }

   }catch(err){
        console.log(err.message);
        res.json({message: err.message});
   }
})


module.exports = Router;