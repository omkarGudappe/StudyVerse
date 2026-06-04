const express = require('express');
const Router = express.Router();
const Posts = require('../Db/UserPost');
const User = require('../Db/User');
const AuthMiddleware = require('../AuthVerify/AuthMiddleware');
const userSocketMap = require('../SocketConnection/socketMap');
const { getIo } = require('../SocketConnection/socketInstance');
const Group = require('../Db/GroupChat');
const mongoose = require('mongoose');

const NodeCache = require('node-cache'); 
const rateLimit = require('express-rate-limit');

const searchCache = new NodeCache({ 
    stdTTL: 300,
    checkperiod: 60,
    maxKeys: 10000 
});

const searchLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 30,
    message: {
        ok: false,
        message: 'Too many search requests, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
});


Router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;

        const user = await User.findById(id).select('connections');
        if (!user) return res.status(404).json({ message: "User Not found" });

        const queryConditions = {
            contentType: "post",
            $or: [
                { visibility: "public" },
                { visibility: "peers", author: { $in: user.connections } },
                { author: id },
            ]
        };

        const [AllPosts, totalPosts] = await Promise.all([
            Posts.find(queryConditions)
                .populate({
                    path: 'author',
                    select: 'firstName lastName UserProfile.avatar username'
                })
                .populate({
                    path: 'likes',
                    select: 'Uid username',
                    options: { limit: 10 }
                })
                .select('heading description files visibility likes comments share createdAt')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
                
            Posts.countDocuments(queryConditions)
        ]);

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
});

Router.get('/lesson/:id' , async (req, res) => {
    const { id } = req.params;
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;

        const user = await User.findById(id).select('connections');
        if(!user) return res.status(404).json({message: "User Not found"});

        const queryConditions = {
            contentType: "lesson",
            $or: [
                { visibility: "public" },
                { visibility: "peers", author: { $in: user.connections }},
                { author: id }, 
            ]
        };

        const [AllPosts, totalPosts] = await Promise.all([
            Posts.find(queryConditions)
            .populate({
                    path: 'author',
                    select: 'firstName lastName UserProfile.avatar username'
                })
                .populate({
                    path: 'likes',
                    select: 'Uid username',
                    options: { limit: 10 }
                })
                .select('heading description files visibility likes comments share createdAt')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),

            Posts.countDocuments(queryConditions)
        ]);

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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const skip = (page - 1) * limit;

    try {
        if (!uid) {
            return res.status(404).json({ message: "Missing Requirement" });
        }

        const UserPosts = await Posts.find({ author: uid })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalCount = await Posts.countDocuments({ author: uid });

        if (!UserPosts || UserPosts.length === 0) {
            return res.json({ 
                ok: true, 
                UserPosts: [],
                totalCount: 0,
                currentPage: page,
                totalPages: Math.ceil(totalCount / limit)
            });
        }

        res.json({ 
            ok: true, 
            UserPosts, 
            totalCount,
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            hasMore: page < Math.ceil(totalCount / limit)
        });
    } catch (err) {
        console.log(err.message);
        res.status(500).json({ message: err.message });
    }
});


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

Router.put('/update/:id', AuthMiddleware, async(req, res) => {
    const { id } = req.params;
    const { heading, description, visibility } = req.body;

    try{
        const update = await Posts.findByIdAndUpdate(
            id,
            {
                heading,
                description,
                visibility,
            },
            { new: true },
        )
        .select('heading description visibility')

        if(!update) {
            return res.status(404).json({message: 'Post not found'})
        }
        res.json({ok: true, message: 'Post update successfully', post: update})
    } catch(err) {
       res.status(500).json({message: 'Internal server Error, Please try again later'});
    }
})

Router.post('/lesson/search', searchLimiter, AuthMiddleware, async (req, res) => {
    const startTime = Date.now();
    let cacheHit = false;

    try {
        const { query, page = 1, limit = 20, sortBy = 'relevance' } = req.query;
        const userId = req.user?._id;

        if (!query || query.trim().length === 0) {
            return res.status(400).json({
                ok: false,
                message: "Search query is required",
                errorCode: "SEARCH_QUERY_REQUIRED"
            });
        }

        if (query.trim().length > 100) {
            return res.status(400).json({
                ok: false,
                message: "Search query too long",
                errorCode: "QUERY_TOO_LONG"
            });
        }

        const searchQuery = query.trim().toLowerCase();
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(Math.max(1, parseInt(limit)), 50);
        const skip = (pageNum - 1) * limitNum;

        const cacheKey = `search:${searchQuery}:${pageNum}:${limitNum}:${sortBy}`;

        if (pageNum === 1) {
            const cachedResults = searchCache.get(cacheKey);
            if (cachedResults) {
                cacheHit = true;
                console.log(`[SEARCH] Cache hit for: "${searchQuery}" - ${Date.now() - startTime}ms`);
                
                return res.status(200).json({
                    ok: true,
                    data: cachedResults,
                    cached: true,
                    responseTime: Date.now() - startTime
                });
            }
        }

        const textSearchQuery = {
            $text: { $search: searchQuery },
            contentType: "lesson"
        };

        const selectFields = {
            heading: 1,
            description: 1,
            files: 1,
            likes: 1,
            comments: 1,
            tags: 1,
            category: 1,
            duration: 1,
            views: 1,
            author: 1,
            createdAt: 1,
            contentType: 1,
            score: { $meta: "textScore" }
        };

        let dbQuery = mongoose.model("Posts")
            .find(textSearchQuery)
            .select(selectFields)
            .lean();

        switch(sortBy) {
            case 'newest':
                dbQuery = dbQuery.sort({ createdAt: -1 });
                break;
            case 'oldest':
                dbQuery = dbQuery.sort({ createdAt: 1 });
                break;
            case 'most-liked':
                dbQuery = dbQuery.sort({ likesCount: -1, createdAt: -1 });
                break;
            case 'most-viewed':
                dbQuery = dbQuery.sort({ views: -1, createdAt: -1 });
                break;
            default: // relevance
                dbQuery = dbQuery.sort({ score: { $meta: "textScore" }, createdAt: -1 });
        }

        const [lessons, totalCount] = await Promise.all([
            dbQuery
                .skip(skip)
                .limit(limitNum)
                .populate({
                    path: 'author',
                    select: 'firstName lastName username',
                    populate: {
                        path: 'UserProfile',
                        select: 'avatar.url'
                    }
                })
                .maxTimeMS(10000),
            mongoose.model("Posts")
                .countDocuments(textSearchQuery)
                .maxTimeMS(5000)
        ]);

        const enhancedLessons = await enhanceLessonsWithUserData(lessons, userId);

        const responseData = {
            lessons: enhancedLessons,
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(totalCount / limitNum),
                totalResults: totalCount,
                resultsInPage: enhancedLessons.length,
                hasNext: (skip + limitNum) < totalCount,
                hasPrev: pageNum > 1
            },
            searchMetadata: {
                query: searchQuery,
                sortBy: sortBy
            }
        };

        if (pageNum === 1) {
            searchCache.set(cacheKey, responseData);
        }

        const responseTime = Date.now() - startTime;
        console.log(`[SEARCH] "${searchQuery}" - ${lessons.length} results - ${responseTime}ms`);

        res.status(200).json({
            ok: true,
            data: responseData,
            cached: false,
            responseTime: responseTime
        });

    } catch (error) {
        const responseTime = Date.now() - startTime;
        console.error(`[SEARCH_ERROR] ${error.message} - ${responseTime}ms`);

        // Specific error handling
        if (error.name === 'MongoError' && error.code === 50) {
            return res.status(408).json({
                ok: false,
                message: "Search timeout, please try again",
                errorCode: "SEARCH_TIMEOUT"
            });
        }

        try {
            const fallbackResults = await fallbackSearch(req, res);
            if (fallbackResults) {
                console.log(`[SEARCH] Used fallback for: "${req.query.query}"`);
                return;
            }
        } catch (fallbackError) {
            console.error('[SEARCH] Fallback also failed:', fallbackError);
        }

        res.status(500).json({
            ok: false,
            message: "Search service temporarily unavailable",
            errorCode: "SEARCH_SERVICE_UNAVAILABLE",
            responseTime: responseTime
        });
    }
});

async function enhanceLessonsWithUserData(lessons, userId) {
    if (!userId || !lessons.length) {
        return lessons.map(lesson => ({
            ...lesson,
            userLiked: false,
            likesCount: lesson.likes?.length || 0,
            commentsCount: lesson.comments?.length || 0
        }));
    }

    const userLikedMap = new Map();
    
    lessons.forEach(lesson => {
        if (lesson.likes && lesson.likes.length > 0) {
            const isLiked = lesson.likes.some(like => 
                (typeof like === 'object' ? like._id : like).toString() === userId.toString()
            );
            userLikedMap.set(lesson._id.toString(), isLiked);
        }
    });

    return lessons.map(lesson => ({
        ...lesson,
        userLiked: userLikedMap.get(lesson._id.toString()) || false,
        likesCount: lesson.likes?.length || 0,
        commentsCount: lesson.comments?.length || 0,
        likes: undefined,
        comments: undefined
    }));
}

async function fallbackSearch(req, res) {
    const { query, page = 1, limit = 20 } = req.query;
    const userId = req.user?._id;
    
    const searchQuery = query.trim();
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const searchRegex = new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const regexQuery = {
        contentType: "lesson",
        $or: [
            { heading: { $regex: searchRegex } },
            { description: { $regex: searchRegex } }
        ]
    };

    const [lessons, totalCount] = await Promise.all([
        mongoose.model("Posts")
            .find(regexQuery)
            .select('heading description files tags category duration views author createdAt')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .populate({
                path: 'author',
                select: 'firstName lastName username',
                populate: {
                    path: 'UserProfile',
                    select: 'avatar.url'
                }
            })
            .lean()
            .maxTimeMS(15000),
        mongoose.model("Posts").countDocuments(regexQuery)
    ]);

    const enhancedLessons = await enhanceLessonsWithUserData(lessons, userId);

    res.status(200).json({
        ok: true,
        data: {
            lessons: enhancedLessons,
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(totalCount / limitNum),
                totalResults: totalCount,
                resultsInPage: enhancedLessons.length,
                hasNext: (skip + limitNum) < totalCount,
                hasPrev: pageNum > 1
            },
            searchMetadata: {
                query: searchQuery,
                fallbackUsed: true
            }
        },
        cached: false
    });

    return true;
}

Router.delete('/delete/:id', AuthMiddleware, async(req, res) => {
    try{
        const DeletePost = await Posts.findByIdAndDelete(
            req.params.id,
        )

        if(DeletePost) {
            return res.json({ok: true, message: 'Post Delete Successfully'})
        }
        res.status(404).json({message: 'Post not found'});
    } catch(err) {
        res.status(500).json({message: 'Internal server error'});
    }
})

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