const express = require('express');
const Router = express.Router();
const Posts = require('../Db/UserPost');
const User = require('../Db/User');
const AuthMiddleware = require('../AuthVerify/AuthMiddleware');
const userSocketMap = require('../SocketConnection/socketMap');
const { getIo } = require('../SocketConnection/socketInstance'); // Import the getter
const Group = require('../Db/GroupChat');

Router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;

        const user = await User.findById(id)
        if(!user) return res.status(404).json({message: "User Not found"});

        const AllPosts = await Posts.find({
            contentType: "post",
            $or: [
                { visibility : "public" },
                { visibility : "peers" , author: { $in: user.connections }},
                { author: id },
            ]
        }).populate({
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

Router.get('/lesson/:id' , async (req, res) => {
    const { id } = req.params;
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;

        const user = await User.findById({ _id: id })
        if(!user) return res.status(404).json({message: "User Not found"});

        const AllPosts = await Posts.find({
            contentType: "lesson",
            $or: [
                { visibility : "public" },
                { visibility : "peers" , author: { $in: user.connections }},
                { author: id },
            ]
        }).populate({
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
            lesson: AllPosts,
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
    const { page = 1, limit = 10 } = req.query;

    try {
        if (!id) {
            return res.status(400).json({ message: "Id Not Found" });
        }

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const postWithComments = await Posts.findById(id)
            .populate({
                path: "comments.user",
                select: "username UserProfile.avatar",
                populate: {
                    path: "UserProfile.avatar",
                    select: "url"
                }
            })
            .select("comments")

        if (!postWithComments) {
            return res.status(404).json({ message: "Post not found" });
        }
        
        if (postWithComments.comments) {
            postWithComments.comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
        
        const totalComments = postWithComments.comments.length;
        
        const paginatedComments = postWithComments.comments.slice(skip, skip + limitNum);
        
        const formattedComments = paginatedComments.map(comment => ({
            _id: comment._id,
            content: comment.comment,
            createdAt: comment.createdAt,
            author: {
                _id: comment.user._id,
                username: comment.user.username,
                avatar: comment.user.UserProfile?.avatar?.url || null
            }
        }));

        res.json({ 
            ok: true, 
            comments: formattedComments,
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(totalComments / limitNum),
                totalComments: totalComments,
                hasNextPage: skip + limitNum < totalComments,
                hasPrevPage: pageNum > 1
            }
        });

    } catch (err) {
        console.log(err.message);
        res.status(500).json({ message: "Server error" });
    }
});

Router.post('/comments/:postId', async (req, res) => {
    const { postId } = req.params;
    const { userId, comment, PostownerId } = req.body;

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
            select: "username UserProfile.avatar",
            populate: {
                path: "UserProfile.avatar",
                select: "url"
            }
        });

        try{            
            const newNotification = {
                user: userId,
                Type: "comment",
                whichPost: postId,
                comment: comment,
            }

                await User.findByIdAndUpdate(
                    { _id: PostownerId },
                    { $push : {notification: newNotification }},
                    { new: true },
                )
            } catch(err){
                console.log(err.message);
        }

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
                    username: addedComment.user.username,
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
            return res.status(404).json({ message: "Missing Requirment"});
        }

        const UserPosts = await Posts.find({ author: uid})
        .sort({ createdAt: -1 });

        if(!UserPosts){
            return res.json({message: "User don't have any Post yet"})
        }

        res.json({ok: true, UserPosts});
   }catch(err){
    console.log(err.message);
    res.json({message: err.message})
   }
})


Router.post('/share', async (req, res) => {
  try {
    const { postId, recipientId, senderId } = req.body;
        
    const post = await Posts.findById(postId)
      .populate('author', 'firstName lastName UserProfile.avatar username');
    
    if (!post) {
        console.log("Post not found:", postId);
      return res.status(404).json({ error: 'Post not found' });
    }
    
    console.log("Sharing post:", postId, "to recipient:", recipientId, "from sender:", senderId);

    const recipient = await User.findById(recipientId);
    if (!recipient) {
        console.log("Recipient not found in users:", recipientId);
        const GroupRecipient = await Group.findById(recipientId);
        if(!GroupRecipient){
            console.log("Recipient not found:", recipientId);
            return res.status(404).json({ error: 'Recipient not found' });
        }
    }
    
    await Posts.findByIdAndUpdate(
      postId,
      { 
        $addToSet: { 
          share: {
            sender: senderId,
            recipient: recipientId,
            sharedAt: new Date()
          }
        } 
      },
      { new: true }
    );
    
    const recipientSocketId = userSocketMap.get(recipientId);
    
   if (recipientSocketId) {
      const authorData = post.author ? {
        _id: post.author._id,
        firstName: post.author.firstName || '',
        lastName: post.author.lastName || '',
        username: post.author.username || '',
        UserProfile: post.author.UserProfile || {}
      } : {
        _id: null,
        firstName: 'Unknown',
        lastName: 'User',
        username: 'unknown',
        UserProfile: {}
      };
      
      console.log("Emitting to socket ID:", recipientSocketId);
      const io = getIo();
      io.to(recipientSocketId).emit('post-shared', {
        postId,
        postData: {
          _id: post._id,
          heading: post.heading || '',
          description: post.description || '',
          files: post.files || {},
          author: authorData
        },
        senderId
      });
    }
    
    res.json({ success: true, message: 'Post shared successfully' });
  } catch (error) {
    console.log('Error sharing post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

Router.get('/single/:id', async (req, res) => {
    const { id } = req.params;

    if(!id) {
        return res.status(404).json({message: "Post not found"});
    }

    try{
        const Post = await Posts.findById(id)
            .populate({
                path: 'author',
                select: 'firstName lastName UserProfile.avatar username'
            }).populate({
                path: 'likes',
                select: 'Uid username',
            }).populate({
                path: "comments.user",
                select: "firstName lastName UserProfile.avatar",
                populate: {
                    path: "UserProfile.avatar",
                    select: "url"
                }
            });

        if(!Post) {
            return res.status(404).json({message: "Post not found"});
        }

        // Sort comments by createdAt in descending order (most recent first)
        Post.comments.sort((a, b) => b.createdAt - a.createdAt);

        return res.json({ok: true, Post});
    }catch(err){
        console.log(err.message);
        res.json({message: err.message});
    }
});

// Router.post('/share', async (req, res) => {
//   try {
//     const { postId, recipientId, senderId } = req.body;
    
//     const post = await Posts.findById(postId)
//       .populate('author', 'firstName lastName UserProfile.avatar username');
//       console.log("1 check", postId, recipientId, senderId)
    
//     if (!post) {
//       return res.status(404).json({ error: 'Post not found' });
//     }
    
//     console.log("1 check", postId, recipientId, senderId)

//     const recipient = await User.findById(recipientId);
//     if (!recipient) {
//       return res.status(404).json({ error: 'Recipient not found' });
//     }
    
//     console.log("2 check", postId, recipientId, senderId)

//     // Update the post with share information
//     await Posts.findByIdAndUpdate(
//       postId,
//       { 
//         $addToSet: { 
//           share: {
//             sender: senderId,
//             recipient: recipientId
//           }
//         } 
//       },
//       { new: true }
//     );
    
//     const recipientSocketId = userSocketMap.get(recipientId);
//     console.log("3 check", postId, recipientId, senderId)
//     if (recipientSocketId) {
//       req.io.to(recipientSocketId).emit('post-shared', {
//         postId,
//         postData: {
//           _id: post._id,
//           heading: post.heading,
//           description: post.description,
//           files: post.files,
//           author: {
//             _id: post.author._id,
//             firstName: post.author.firstName,
//             lastName: post.author.lastName,
//             username: post.author.username,
//             UserProfile: post.author.UserProfile
//           }
//         },
//         senderId
//       });
//     }
//     console.log("4 check", postId, recipientId, senderId)
//     res.json({ success: true, message: 'Post shared successfully' });
//   } catch (error) {
//     console.log('Error sharing post:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

module.exports = Router;