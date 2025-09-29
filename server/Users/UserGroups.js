const express = require("express");
const Group = require("../Db/GroupChat");
const router = express.Router();
const mongoose = require('mongoose');

router.post("/create", async (req, res) => {
  try {
    const { name, createdBy, members } = req.body;

    // Validate input
    if (!name || !createdBy) {
      return res.status(400).json({ ok: false, message: "Group name and creator are required" });
    }

    const firestorePath = `groups/${new mongoose.Types.ObjectId()}`;

    const group = new Group({
      name,
      createdBy,
      members: [createdBy, ...(members || [])],
      firestorePath
    });

    await group.save();

    await group.populate("members", "firstName lastName username UserProfile.avatar.url");
    
    res.json({ ok: true, group, message: "Group created successfully" });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

router.get("/user/:userId", async (req, res) => {
  try {
    const groups = await Group.find({ members: req.params.userId }).populate("members", "firstName lastName");
    res.json({ ok: true, groups });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// Get specific group by ID
router.get("/:groupId", async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId)
      .populate("members", "firstName lastName username UserProfile.avatar.url firebaseUid")
      .populate("createdBy", "firstName lastName username");
    
    if (!group) {
      return res.status(404).json({ ok: false, message: "Group not found" });
    }
    
    res.json({ ok: true, group });
  } catch (err) {
    console.error("Error fetching group:", err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

module.exports = router;
