const express = require('express');
const Router = express.Router();
const sendMail = require('./sendMail').sendMail;
const crypto = require("crypto");
const User = require('../Db/User');
const jwt = require('jsonwebtoken');
const authMiddleware  = require('./AuthMiddleware');
const Auth = require('../Db/UserAuth');


let otpStore = {};

Router.post('/verify' , async (req , res) => {
    try{
        const { email } = req.body;

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        otpStore[email] = { otp, expires: Date.now() + 5 * 60 * 1000 };

        const Data = await sendMail(email , "Your OTP Code" , otp);
        console.log("My otp" , otp);

        console.log(Data.status);

        res.status(200).json({ ok: true , message: "email_sent" , status: Data.status });

    }catch(err){
        console.error("❌ OTP not sent:", err.message);
        console.log(Data.status);
        res.status(500).json({ ok: false , message: "Internal Server Error" , status: Data.status });
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
            user = await Auth.create({ email , password: crypto.createHash('sha256').update(password).digest('hex')});
        }

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        delete otpStore[email];

        res.status(200).json({ ok: true , message: "OTP verified successfully", token });
    }catch(err){
        console.error("❌ OTP verification failed:", err.message);
        res.status(400).json({ ok: false , message: err.message });
    }
})

Router.post('/google-signin' , async(req , res) => {
    try{
        const { uid } = req.body;

        if(!uid){
            throw new Error("User Id is Required");
        }

        
        const check = await User.findOne({ firebaseUid: uid });
        if(!check){
            return res.json({ exist: false });
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
        return res.status(400).json({ ok: false, message: "Missing email or uid parameter" });
    }

    console.log("Email: ", email);

    try{

        let route = '';
        const check = await Auth.findOne({ email });
        if(!check){
            console.log("User not found");
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

        console.log("User Found: ", route);

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

Router.get('/verify-session', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ ok: false, message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const id = decoded.id;

    if (!id) {
        console.log("Invalid token: No user ID found");
      return res.status(401).json({ ok: false, message: "Invalid token" });
    }
    console.log("Token verified for user ID:", id);
    res.json({ ok: true, user: decoded });
  } catch (err) {
    res.status(401).json({ ok: false, message: "Invalid or expired token" });
  }
});

module.exports = Router;