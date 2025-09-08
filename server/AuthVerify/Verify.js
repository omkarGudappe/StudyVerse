const express = require('express');
const Router = express.Router();
const sendMail = require('./sendMail').sendMail;
const crypto = require("crypto");
const User = require('../Db/User');

let otpStore = {};

Router.post('/verify' , async (req , res) => {
    try{
        const { email } = req.body;

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        otpStore[email] = { otp, expires: Date.now() + 5 * 60 * 1000 };

        const Data = await sendMail(email , "Your OTP Code" , otp);

        console.log(Data.status);

        res.status(200).json({ ok: true , message: "email_sent" , status: Data.status });

    }catch(err){
        console.error("❌ OTP not sent:", err.message);
        console.log(Data.status);
        res.status(500).json({ ok: false , message: "Internal Server Error" , status: Data.status });
    }
})

Router.post('/verify-otp' , (req , res) => {
    try{
        const { otp , email } = req.body;

        if(!otp || !email){
            throw new Error("Please provide email and otp");
        }

        const storedOtp = otpStore[email];

        if(!storedOtp){
            throw new Error("OTP not found or expired");
        }

        if(storedOtp.otp !== otp){
            throw new Error("Invalid OTP");
        }

        delete otpStore[email];

        res.status(200).json({ ok: true , message: "OTP verified successfully" });
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
        }else{
            return res.json({ exist: true, user: check });
        }

    }catch(err){
        console.log("Error: ", err.message);
        return res.status(500).json({ error: err.message });
    }
})

module.exports = Router;