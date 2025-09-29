const express = require('express');
const multer = require('multer');
const cloudinary = require('../CloudinaryStorage/cloudinary');
const User = require('../Db/User');
const Posts = require('../Db/UserPost');

const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");

ffmpeg.setFfmpegPath(ffmpegPath);

const Router = express.Router();
const storage = multer.diskStorage({});
const upload = multer({ storage });


Router.post('/userdetail', upload.none(), async (req, res) => {
    const { firstName, lastName, dob, gender, education, Uid, FUid } = req.body;

    if (!firstName || !lastName || !dob || !gender || !education || !Uid || !FUid) {
        return res.json({ ok: false, message: "All fields are required" });
    }

    await User.findOne({ firebaseUid: FUid }).then((existingUser) => {
        if (existingUser) {
            return res.json({ ok: false, message: "User already exists" });
        }
    });

    try {
        let educationData;
        try {
            educationData = typeof education === 'string' ? JSON.parse(education) : education;
        } catch (e) {
            educationData = education;
        }

        const user = new User({
            firstName: firstName,
            lastName: lastName,
            dob,
            gender,
            education: educationData,
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
});

Router.post('/profile', upload.single('image'), async (req, res) => {
    const { bio, FUid, username } = req.body;

    if (!FUid || !username) {
        return res.status(400).json({ message: "Username are required", code: "MISSING_FIELDS" });
    }

    try {
        const usernameTaken = await User.findOne({ username, firebaseUid: { $ne: FUid } });
        if (usernameTaken) {
            return res.status(400).json({ message: "Username is already taken", code: "USERNAME_TAKEN" });
        }

        const data = {
            username,
            "UserProfile.description": bio,
        }

         if (req.file) {
            const uploadResult = await cloudinary.uploader.upload(req.file.path, {
                folder: "studyverse/profiles",
            });

            data["UserProfile.avatar"] = {
                url: uploadResult.secure_url,
                publicId: uploadResult.public_id,
            };
        }

        const updatedUser = await User.findOneAndUpdate(
            { firebaseUid: FUid },
            data,
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


// Router.post('/posts/:Fid', upload.single('image'), async (req, res) => {
//     try{
//         const { Fid } = req.params;
//         const { heading, description } = req.body;

//         if(!heading || !description || !Fid){
//             return res.status(400).json({ message: "All fields required"});
//         }

//         const MongoId = await User.findOne({ firebaseUid: Fid });

//         if(!MongoId){
//             return res.status(404).json({ message:"User not Found from the user" });
//         }

//         const uploadFile = await cloudinary.uploader.upload(req.file.path, {
//             folder: "studyverse/posts",
//             resource_type: req.file.mimetype === "application/pdf" ? "raw" : "auto",
//         });

//         const newPost = await Posts.create({
//             author: MongoId._id,
//             heading,
//             description,
//             files: {
//                 url: uploadFile.secure_url,
//                 publicId: uploadFile.public_id,
//                 type: uploadFile.resource_type,
//             },
//         })

//         if(newPost) {
//             return res.json({ message: "Content Posted Successfully" , newPost });
//         }

//     }catch(err){
//         res.status(500).json({ message: "Because of Some reason content is not posted. Please Try again" });
//         console.log("Error: ", err);
//     }
// })


Router.post("/posts/:Fid", upload.single("image"), async (req, res) => {
  try {
    const { Fid } = req.params;
    const { heading, description, visibility, contentType } = req.body;

    if (!heading || !description || !Fid) {
      return res.status(400).json({ message: "All fields required" });
    }

    const MongoId = await User.findOne({ firebaseUid: Fid });
    if (!MongoId) {
      return res.status(404).json({ message: "User not Found from the user" });
    }

    let filePath = req.file.path;

    const fileSizeInMB = req.file.size / (1024 * 1024);
    if (req.file.mimetype.startsWith("video/") && fileSizeInMB > 70) {
    console.log("⚡ Large video detected, compressing...");
    console.log(`Original size: ${fileSizeInMB.toFixed(2)} MB`);

    const uploadsDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const compressedPath = path.join(
        uploadsDir,
        `compressed-${Date.now()}.mp4`
    );

    await new Promise((resolve, reject) => {
        ffmpeg(filePath)
        .videoCodec("libx264")
        .size("?x720")
        .outputOptions(["-crf 28"])
        .on("end", () => {
            const stats = fs.statSync(compressedPath);
            const compressedSizeMB = stats.size / (1024 * 1024);

            console.log(`✅ Compression finished: ${compressedPath}`);
            console.log(
            `Compressed size: ${compressedSizeMB.toFixed(
                2
            )} MB (Saved: ${(fileSizeInMB - compressedSizeMB).toFixed(2)} MB)`
            );

            filePath = compressedPath;
            resolve();
        })
        .on("error", (err) => reject(err))
        .save(compressedPath);
    });
    }

    const uploadFile = await cloudinary.uploader.upload(filePath, {
      folder: "studyverse/posts",
      resource_type:
        req.file.mimetype === "application/pdf" ? "raw" : "auto",
        use_filename: true,
        unique_filename: false
    });

    fs.unlinkSync(filePath);

    const newPost = await Posts.create({
      author: MongoId._id,
      heading,
      description,
      files: {
        url: uploadFile.secure_url,
        publicId: uploadFile.public_id,
        type: uploadFile.resource_type,
      },
      visibility: visibility,
      contentType: contentType,
    });

    return res.json({
      message: "Content Posted Successfully",
      newPost,
    });

  } catch (err) {
    res.status(500).json({
      message:
        "Because of Some reason content is not posted. Please Try again",
    });
    console.log("Error: ", err);
  }
});

Router.get('/search', async (req, res) => {
    const { query } = req.query;

    try {
        const users = await User.find({
            $or: [
                { username: { $regex: query, $options: "i" } },
            ]
        })
        .select('firstName lastName education firebaseUid username UserProfile')

        const Notes = await Posts.find({
            contentType: 'note',
            $or: [
                { heading: { $regex: query, $options: "i" },
                  description: { $regex: query, $options: "i" }
                },
            ]
        })

        const Lesson = await Posts.find({
            contentType: 'lesson',
             $or: [
                { heading: { $regex: query, $options: "i" },
                  description: { $regex: query, $options: "i" }
                },
            ]
        })

        res.json({ message: "Search results", users, Lesson, Notes });
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

    let educationData;
    try {
        educationData = typeof education === 'string' ? JSON.parse(education) : education;
    } catch (e) {
        educationData = education;
    }

    try {
        let updateData = {
            firstName,
            lastName,
            dob,
            gender,
            education: educationData,
            "UserProfile.description": description,
            "UserProfile.heading": heading,
        };

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

Router.get('/setting/:id' , async (req, res) => {
    const { id } = req.params;

    if(!id) {
        return res.status(404).json({message : "User not found, Please refresh the page"})
    }

    try{
        const UserSetting = await User.findById(id);

        if(!UserSetting) {
            return res.status(404).json({message: "User not found, Please refresh the page or try again"});
        }

        res.json({ok: true , settings: UserSetting.setting});

    }catch(err){
        console.log(err.message);
        res.status(500).json({message: "Server is busy"});
    }
});

Router.post('/settingsUpdated/:id', async (req, res) => {
    const { id } = req.params;
    const settings  = req.body;

    if(!id) {
        return res.status(404).json({message : "User not found, Please refresh the page"})
    }

    if(!settings) {
        return res.status(404).json({message: "Changes found"});
    }

    try{
       const UserSettings = await User.findOneAndUpdate(
            { _id: id },
            { setting: settings},
            { new: true },
        )

        if(!UserSettings){
            return res.status(404).json({message: "User not found"});
        }

        return res.json({ok : true , message: "Setting updated successfully"})
    }catch(err){
        res.status(500).json({message: err.message});
        console.log(err.message);
    }
})

Router.get('/notification/:Uid' , async (req, res) => {

    const { Uid } = req.params;

      try{
        const GetNotification = await User.findOne({ Uid })
        .select("notification._id setting notification.user notification.Type notification.whichPost")
        .populate("notification.user" , "firstName lastName UserProfile.avatar")
        .populate("notification.whichPost", "files.url")
    
        if(!GetNotification){
          return res.status(404).json({message: "User Not Found"});
        }

        const {setting}  = GetNotification;

        let filterNotification = GetNotification.notification.filter((notify) => {
            if(notify.Type === 'like' && !setting.showLikeNotifications) return false;
            if(notify.Type === 'comment' && !setting.showCommentNotifications) return false;
            return true;
        })        

        const notification = filterNotification.map((notify) => ({
            _id: notify._id,
            type: notify.Type,
            message: `${notify.Type === 'comment' ? `${notify.user.firstName} commented on your post` : `Your post Liked by the ${notify.user.firstName} ${notify.user.lastName}` }`,
            sender: {
                _id: notify.user._id,
                firstName: notify.user.firstName,
                lastName: notify.user.lastName,
                avatar: notify?.whichPost?.files?.url,
            },
            comment: notify?.comment || '',
            createdAt: new Date(),
            read: false
        }))
    
        res.json({ok: true , notification});
      }catch(err) {
        console.log("Notificaion" ,err.message);
      }
})

Router.get('/getConnections', async (req, res) => {
    const  ids = req.query.ids.split(',');

    try{
        if(ids.length < 2 ) {
            return res.status(404).json({message: " Missing requirements" });
        }
        const User1 = await User.findById(ids[0])
            .select("firstName lastName connections MyConnections connectionRequests");

        const User2 = await User.findById(ids[1])
            .select("firstName lastName connections MyConnections connectionRequests");

        if(!User1 || !User2){
            return res.status(404).json({message: "User Not Found"});
        }

        return res.json({ok: true, currentUserData: User1, OtherUserData: User2});

    }catch(err){
        console.log(err.message);
        res.status(500).json({ ok: false, message: "Internal server error" });
    }
})

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

Router.post('/messages/fileupload' , upload.single('file') , async (req, res) => {

    try{
        if (!req.file) {
            return res.status(404).json({ message: "No file uploaded", code: "NO_FILE_UPLOADED" });
        }

        const uploadFile = await cloudinary.uploader.upload(req.file.path, {
            folder: "studyverse/posts",
            resource_type: req.file.mimetype === "application/pdf" ? "raw" : "auto",
        });

        return res.json({ok: true, url: uploadFile.secure_url, publicId: uploadFile.public_id, type: uploadFile.resource_type })

    }catch(err){
        console.log(err.message);
    }
})

Router.get('/userConnections/:id', async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ message: "User ID is required" });
    }

    try {
        const user = await User.findById(id)
            .populate({
                path: "connections",
                select: "firstName lastName username education UserProfile.avatar"
            })
            .populate({
                path: "MyConnections",
                select: "firstName lastName username education UserProfile.avatar"
            });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({
            ok: true,
            Connections: user.connections,
            ConnectionNetWork: user.MyConnections
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Server error" });
    }
});


module.exports = Router;