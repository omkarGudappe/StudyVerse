const express = require('express');
const Router = express.Router();
const Posts = require('../Db/UserPost');
const User = require('../Db/User');

Router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;

        // Populate author field with user's profile data
        const AllPosts = await Posts.find()
            .populate({
                path: 'author',
                select: 'firstName lastName UserProfile.avatar username'
            })
            .populate({
                path: 'likes',
                select: 'Uid username',
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalPosts = await Posts.countDocuments();
        const hasMore = page * limit < totalPosts;

        res.json({ 
            ok: true, 
            posts: AllPosts,
            pagination: {
                page,
                limit,
                totalPosts,
                hasMore,
                totalPages: Math.ceil(totalPosts / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
})

Router.get('/comments/:id', async (req, res) => {
    const { id } = req.params;

    try {
        if (!id) {
            return res.status(400).json({ message: "Id Not Found" });
        }

        const postWithComments = await Posts.findById(id)
            .populate({
                path: "comments.user",
                select: "firstName lastName UserProfile.avatar",
                populate: {
                    path: "UserProfile.avatar",
                    select: "url"
                }
            })
            .select("comments")

            
            if (!postWithComments) {
                return res.status(404).json({ message: "Post not found" });
            }
            
            if (postWithComments) {
                postWithComments.comments.sort((a, b) => b.createdAt - a.createdAt);
            }
            
        const formattedComments = postWithComments.comments.map(comment => ({
            _id: comment._id,
            content: comment.comment,
            createdAt: comment.createdAt,
            author: {
                _id: comment.user._id,
                firstName: comment.user.firstName,
                lastName: comment.user.lastName,
                avatar: comment.user.UserProfile?.avatar?.url || null
            }
        }));

        res.json({ ok: true, comments: formattedComments });

    } catch (err) {
        console.log(err.message);
        res.status(500).json({ message: "Server error" });
    }
});

Router.post('/comments/:postId', async (req, res) => {
    const { postId } = req.params;
    const { userId, comment } = req.body;

    try {
        if (!postId || !userId || !comment) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const newComment = {
            user: userId,
            comment: comment,
            createdAt: new Date()
        };

        const updatedPost = await Posts.findByIdAndUpdate(
            postId,
            { $push: { comments: newComment } },
            { new: true }
        ).populate({
            path: "comments.user",
            select: "firstName lastName UserProfile.avatar",
            populate: {
                path: "UserProfile.avatar",
                select: "url"
            }
        });

        if (!updatedPost) {
            return res.status(404).json({ message: "Post not found" });
        }

        const addedComment = updatedPost.comments[updatedPost.comments.length - 1];

        res.status(201).json({ 
            ok: true, 
            comment: {
                _id: addedComment._id,
                content: addedComment.comment,
                createdAt: addedComment.createdAt,
                author: {
                    _id: addedComment.user._id,
                    firstName: addedComment.user.firstName,
                    lastName: addedComment.user.lastName,
                    avatar: addedComment.user.UserProfile?.avatar?.url || null
                }
            }
        });

    } catch (err) {
        console.log(err.message);
        res.status(500).json({ message: "Server error" });
    }
});

Router.get('/usersPosts/:uid', async (req, res) => {
    const { uid } = req.params;

   try{
       if(!uid) {
            console.log("missing requirment");
            return res.status(404).json({ message: "Missing Requirment"});
        }

        const UserPosts = await Posts.find({ author: uid})
        .sort({ createdAt: -1 });

        if(!UserPosts){
            console.log("User not found");
            return res.json({message: "User don't have any Post yet"})
        }

        res.json({ok: true, UserPosts});
   }catch(err){
    console.log(err.message);
    res.json({message: err.message})
   }
})

module.exports = Router;