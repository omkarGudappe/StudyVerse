const express = require('express');
const Router = express.Router();
const Posts = require('../Db/UserPost');
const User = require('../Db/User');

Router.get('/', async (req, res) => {
    try {
        // Populate author field with user's profile data
        const AllPosts = await Posts.find().populate({
            path: 'author',
            select: 'firstName lastName UserProfile.avatar'
        });
        res.json({ ok: true, posts: AllPosts });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
})

module.exports = Router;