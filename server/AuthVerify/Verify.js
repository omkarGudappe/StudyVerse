const express = require('express');
const Router = express.Router();
const { sendMail, sendMailAsync, sendMailWithRetry } = require('./sendMail');
const crypto = require("crypto");
const User = require('../Db/User');
const jwt = require('jsonwebtoken');
const authMiddleware  = require('./AuthMiddleware');
const Auth = require('../Db/User');


let otpStore = {};

Router.post('/verify' , async (req , res) => {
    try{
        const { email } = req.body;

        // ✅ Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                ok: false, 
                message: "Invalid email address", 
                userMessage: "Please enter a valid email address."
            });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otpStore[email] = { otp, expires: Date.now() + 5 * 60 * 1000 };


        // ✅ Try to send email with retry logic (waits for result)
        // If you want non-blocking, use sendMailAsync instead
        const emailResult = await sendMailWithRetry(email, "Your OTP Code", otp, 2);

        if (!emailResult.status) {
            // Email failed even after retries
            return res.status(500).json({ 
                ok: false, 
                message: emailResult.userMessage || "Failed to send verification code",
                userMessage: emailResult.userMessage || "We couldn't send the verification code. Please check your email and try again."
            });
        }

        // ✅ Email sent successfully
        res.status(200).json({ 
            ok: true, 
            message: "email_sent",
            userMessage: "Verification code sent! Check your email inbox or spam folder."
        });

    }catch(err){
        res.status(500).json({ 
            ok: false, 
            message: "Internal Server Error",
            userMessage: "Something went wrong. Please try again later."
        });
    }
})

Router.post('/verify-otp' , async (req , res) => {
    try{
        const { otp , email, password } = req.body;

        if(!otp || !email || !password){
            throw new Error("Please provide email, otp and password");
        }

        const storedOtp = otpStore[email];

        if(!storedOtp){
            throw new Error("OTP not found or expired");
        }


        if(storedOtp.otp !== otp){
            throw new Error("Invalid OTP");
        }

        let user = await Auth.findOne({ email });
            if (!user) {
            const Uid = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            user = await Auth.create({ email , password: crypto.createHash('sha256').update(password).digest('hex'), Uid});
        }

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        delete otpStore[email];

        res.status(200).json({ ok: true , message: "OTP verified successfully", token });
    }catch(err){
        res.status(400).json({ ok: false , message: err.message });
    }
})

Router.post('/google-signin' , async(req , res) => {
    try{
        const { uid, email } = req.body;

        if(!uid){
            throw new Error("User Id is Required");
        }
        
        const check = await User.findOne({ firebaseUid: uid });
        if(!check){
            const Uid = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            const user = await User.create({
                email,
                Uid
            });

            const token = jwt.sign(
                { id: user._id},
                process.env.JWT_SECRET,
                { expiresIn: "7d" }
            );

            return res.json({ exist: false, token });
        }

        
        let route = '';
        const UserDetailExist = await User.findOne({ firebaseUid: uid, firstName: { $exists: true, $ne: null } });
        if(!UserDetailExist){
            route = '/fillprofile';
        } else {
            const UseruserNameExist = await User.findOne({ firebaseUid: uid, username: { $exists: true, $ne: null } });
            if(!UseruserNameExist) {
                route = '/profileBio';
            }else {
                route = '/home';
            }
        }

        const token = jwt.sign(
            { id: check._id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        return res.json({
            exist: true,
            user: check,
            token,
            route,
        });

    }catch(err){
        console.log("Error: ", err.message);
        return res.status(500).json({ error: err.message });
    }
});

Router.get('/UserDetail', async (req, res) => {
    const { email, uid } = req.query;

    if (!email || !uid) {
        return res.status(400).json({ ok: false, message: "All field's are required" });
    }

    try{

        let route = '';
        const check = await Auth.findOne({ email });
        if(!check){
            return res.json({ exist: false });
        }else{
            const UserDetailExist = await User.findOne({ firebaseUid: uid, firstName: { $exists: true, $ne: null } });
            if(!UserDetailExist){
                route = '/fillprofile';
            } else {
                const UseruserNameExist = await User.findOne({ firebaseUid: uid, username: { $exists: true, $ne: null } });
                if(!UseruserNameExist) {
                    route = '/profileBio';
                }else {
                    route = '/home';
                }
            }
        }


        const token = jwt.sign(
            { id: check._id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        return res.json({
            exist: true,
            token,
            route,
        });

    }catch(err) {
        console.log("Error: ", err.message);
        return res.status(500).json({ message: err.message });
    }
});

Router.get('/verify-session', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ ok: false, message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const id = decoded.id;

    if (!id) {
      return res.status(401).json({ ok: false, message: "Invalid token" });
    }

    const findUser = await User.findById(id);

    if(!findUser) {
        return res.status(404).json({ ok: false, message: "User Not Exist"});
    }

   const missing = (v) => !v || (typeof v === 'string' && v.trim() === '');

    let route = '';
    if (missing(findUser.firstName) || missing(findUser.lastName)) {
        route = '/fillprofile';
    } else if (missing(findUser.username)) {
        route = '/profileBio';
    } else {
        route = '/home';
    }

    res.json({ ok: true, user: decoded, route });
  } catch (err) {
    res.status(401).json({ ok: false, message: "Invalid or expired token" });
  }
});

module.exports = Router;