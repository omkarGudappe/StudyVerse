const express = require("express");
const Group = require("../Db/GroupChat");
const router = express.Router();
const mongoose = require('mongoose');

const multer = require('multer');
const cloudinary = require('../CloudinaryStorage/cloudinary');

const authenticate = require('../AuthVerify/AuthMiddleware')

const storage = multer.memoryStorage(); // Use memory storage for better performance
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// router.post("/create", async (req, res) => {
//   try {
//     const { name, createdBy, members } = req.body;

//     if (!name || !createdBy) {
//       return res.status(400).json({ ok: false, message: "Group name and creator are required" });
//     }

//     const firestorePath = `groups/${new mongoose.Types.ObjectId()}`;



//     const group = new Group({
//       name,
//       createdBy,
//       members: [createdBy, ...(members || [])],
//       firestorePath
//     });

//     await group.save();

//     await group.populate("members", "firstName lastName username UserProfile.avatar.url");
    
//     res.json({ ok: true, group, message: "Group created successfully" });
    
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ ok: false, message: err.message });
//   }
// });


router.post("/create", async (req, res) => {
  try {
    const { name, createdBy, members } = req.body;

    if (!name || !createdBy) {
      return res.status(400).json({ ok: false, message: "Group name and creator are required" });
    }

    const firestorePath = `groups/${new mongoose.Types.ObjectId()}`;

    const membersArray = [
      { member: createdBy, isAdmin: true },
      ...(members || []).map(memberId => ({ 
        member: memberId, 
        isAdmin: false 
      }))
    ];

    const group = new Group({
      name,
      createdBy,
      members: membersArray,
      firestorePath
    });

    await group.save();

    await group.populate("members.member", "firstName lastName username UserProfile.avatar.url");
    
    res.json({ ok: true, group, message: "Group created successfully" });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

router.get("/user/:userId", async (req, res) => {
  try {
    const groups = await Group.find({ "members.member": req.params.userId }).populate("members.member", "firstName lastName");
    res.json({ ok: true, groups });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

router.get("/:groupId", async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId)
      .populate("members.member", "firstName lastName username UserProfile.avatar.url firebaseUid")
      .populate("createdBy", "firstName lastName username")
      .select("isAdmin members name avatar createdBy");
    
    if (!group) {
      return res.status(404).json({ ok: false, message: "Group not found" });
    }
    
    res.json({ ok: true, group });
  } catch (err) {
    console.error("Error fetching group:", err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

const authorizeGroupAccess = async (req, res, next) => {
  try {
    const { groupId } = req.params;
     const userId = req.user._id;

    if (!userId) {
      return res.status(401).json({ ok: false, message: "User ID required" });
    }

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ ok: false, message: "Invalid group ID" });
    }

    const group = await Group.findById(groupId).select('members createdBy');
    
    if (!group) {
      return res.status(404).json({ ok: false, message: "Group not found" });
    }

    const isMember = group.members.some(member => 
      member.member._id.toString() === userId.toString()
    );
    
    if (!isMember) {
      return res.status(403).json({ 
        ok: false, 
        message: "Access denied - You are not a member of this group" 
      });
    }
    
    req.group = group;
    next();
  } catch (err) {
    console.error("Authorization error:", err);
    res.status(500).json({ ok: false, message: "Authorization failed" });
  }
};

const validateGroupUpdate = (req, res, next) => {
  const { name } = req.body;
  
  if (name && (name.length < 1 || name.length > 50)) {
    return res.status(400).json({ 
      ok: false, 
      message: "Group name must be between 1 and 50 characters" 
    });
  }
  
  next();
};

router.put('/:groupId/update',
  authenticate,
  authorizeGroupAccess,
  upload.single('avatar'),
  validateGroupUpdate,
  async (req, res) => {
    const { groupId } = req.params;
    const { name } = req.body;

    try {
      const updateData = {};
      
      if (name && name.trim() && name !== req.group.name) {
        updateData.name = name.trim();
      }

      console.log("File received:", req.file , "and name:", name );

      if (req.file) {
        try {
          const result = await cloudinary.uploader.upload(
            `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
            {
              folder: 'studyverse/GroupAvatars',
              transformation: [
                { width: 200, height: 200, crop: 'fill' },
                { quality: 'auto' },
                { format: 'webp' }
              ]
            }
          );
          updateData.avatar = result.secure_url;
        } catch (uploadError) {
          console.error("Cloudinary upload error:", uploadError);
          return res.status(500).json({ 
            ok: false, 
            message: "Failed to upload avatar" 
          });
        }
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ 
          ok: false, 
          message: "No changes provided" 
        });
      }

      const updatedGroup = await Group.findByIdAndUpdate(
        groupId,
        { $set: updateData },
        { 
          new: true,
          runValidators: true 
        }
      ).populate("members.member", "firstName lastName username UserProfile.avatar.url")
       .populate("createdBy", "firstName lastName username");

      res.json({ 
        ok: true, 
        group: updatedGroup,
        message: "Group updated successfully" 
      });

    } catch (err) {
      console.error("Error updating group:", err);
      
      if (err.name === 'ValidationError') {
        return res.status(400).json({ 
          ok: false, 
          message: "Validation failed",
          errors: err.errors 
        });
      }
      
      res.status(500).json({ 
        ok: false, 
        message: "Internal server error" 
      });
    }
  }
);

router.put('/:groupId/update-simple', 
  upload.single('avatar'),
  validateGroupUpdate,
  async (req, res) => {
    const { groupId } = req.params;
    const { name, currentUserId } = req.body;

    try {
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ ok: false, message: "Group not found" });
      }

      const isMember = group.members.some(member => 
        member.member.toString() === currentUserId
      );

      if (!isMember) {
        return res.status(403).json({ 
          ok: false, 
          message: "You are not a member of this group" 
        });
      }

      const updateData = {};
      
      if (name && name.trim()) {
        updateData.name = name.trim();
      }

      if (req.file) {
        const result = await cloudinary.uploader.upload(
          `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
          {
            folder: 'studyverse/GroupAvatars',
            transformation: [
              { width: 200, height: 200, crop: 'fill' },
              { quality: 'auto' },
              { format: 'webp' }
            ]
          }
        );
        updateData.avatar = result.secure_url;
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ 
          ok: false, 
          message: "No changes provided" 
        });
      }

      const updatedGroup = await Group.findByIdAndUpdate(
        groupId,
        { $set: updateData },
        { new: true }
      ).populate("members", "firstName lastName username UserProfile.avatar.url")
       .populate("createdBy", "firstName lastName username");

      res.json({ 
        ok: true, 
        group: updatedGroup,
        message: "Group updated successfully" 
      });

    } catch (err) {
      console.error("Error updating group:", err);
      res.status(500).json({ ok: false, message: err.message });
    }
  }
);

router.post('/:groupId/members', authenticate, async (req, res) => {
  const { memberIds } = req.body;
  const { groupId } = req.params;

  try {
    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({ 
        ok: false, 
        message: "memberIds array is required and cannot be empty" 
      });
    }

   const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ 
        ok: false, 
        message: "Group not found" 
      });
    }

    const isAdmin = group.createdBy.toString() === req.user._id.toString();
    if (!isAdmin) {
      return res.status(403).json({ 
        ok: false, 
        message: "Only group admin can add members" 
      });
    }

    const existingMemberIds = group.members.map(member => member.member.toString());
    const newMemberIds = memberIds.filter(id => !existingMemberIds.includes(id));

    if (newMemberIds.length === 0) {
      return res.status(400).json({ 
        ok: false, 
        message: "All selected users are already members of the group" 
      });
    }

    const updatedGroup = await Group.findByIdAndUpdate(
      groupId,
      { 
        $addToSet: { 
          members: { 
            $each: newMemberIds.map(id => ({ member: id }))
          } 
        } 
      },
      { 
        new: true,
        runValidators: true 
      }
    ).populate("members.member", "firstName lastName username UserProfile.avatar.url firebaseUid")
     .populate("createdBy", "firstName lastName username");

    if (!updatedGroup) {
      return res.status(404).json({ 
        ok: false, 
        message: "Group not found after update" 
      });
    }

    return res.json({ 
      ok: true, 
      message: `${newMemberIds.length} member(s) added successfully`,
      group: updatedGroup 
    });

  } catch (err) {
    console.error("Error adding members:", err.message);
    
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        ok: false, 
        message: "Invalid member IDs provided" 
      });
    }
    
    res.status(500).json({ 
      ok: false, 
      message: "Internal server error" 
    });
  }
});

router.delete('/:groupId/members/:memberId', authenticate, authorizeGroupAccess, async(req, res) => {
   const { groupId, memberId } = req.params;

   try {
     const group = await Group.findById(groupId);
     if (!group) {
       return res.status(404).json({ ok: false, message: "Group not found" });
     }

     const isAdmin = group.createdBy.toString() === req.user._id.toString();
     if (!isAdmin) {
       return res.status(403).json({ ok: false, message: "You are not authorized to remove members" });
     }

     group.members.pull({ member: memberId });
     await group.save();

     res.json({ ok: true, message: "Member removed successfully" });
   } catch (error) {
     console.error("Error removing member:", error);
     res.status(500).json({ ok: false, message: "Internal server error" });
   }
});

router.delete('/:groupId/leave' , authenticate, async(req, res) => {
    const { groupId } = req.params;
    const userId = req.user._id;

    try{
      if(!userId) {
        return res.status(401).json({ ok: false, message: "User ID required" });
      }
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ ok: false, message: "Group not found" });
      }

      group.members.pull({ member: userId });
      await group.save();

      res.json({ ok: true, message: "You have left the group successfully" });
    } catch(err) {
        console.error("Error leaving group:", err);
        res.status(500).json({ ok: false, message: "Internal server error" });
    }
});

router.post('/:groupId/members/:memberId/admin', authenticate, async (req, res) => {
  const { groupId, memberId } = req.params;

  if(!groupId || !memberId) {
    return res.status(404).json({message: "Missing requirements"});
  }

  try{

    console.log("Making admin:", memberId, "in group:", groupId);

    await Group.findByIdAndUpdate(
      groupId,
      { $set: { "members.$[elem].isAdmin": true } },
      { 
        arrayFilters: [{ "elem.member": memberId }],
        new: true
      }
    )

    res.json({ ok: true, message: "User has been made admin successfully" });

  }catch(err) {
    console.error("Error making admin:", err);
    return res.status(500).json({ ok: false, message: "Internal server error" });
  }
})

router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        ok: false,
        message: 'File too large. Maximum size is 5MB'
      });
    }
  }
  
  if (error.message === 'Only image files are allowed') {
    return res.status(400).json({
      ok: false,
      message: error.message
    });
  }
  
  next(error);
});

module.exports = router;