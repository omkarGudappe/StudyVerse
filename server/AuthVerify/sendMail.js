const { json } = require("express");
const nodemailer = require("nodemailer");

const sendMail = async (to , subject , otp) => {
    try{
        const transport = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            }
        });

        console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "Loaded" : "Missing");


        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject,
            html: `
        <div style="max-width:600px;margin:auto;padding:20px;
                    border:1px solid #eee;border-radius:10px;
                    font-family:Arial,sans-serif;">
          
          <!-- Logo -->
          <div style="text-align:center;margin-bottom:20px;">
            <img src="http://localhost:5173/LOGO/StudyVerseLogo.png" alt="Logo" style="width:120px;">
          </div>
          
          <!-- Heading -->
          <h2 style="text-align:center;color:#333;">Email Verification</h2>
          <p style="text-align:center;color:#555;">
            Use the following OTP to verify your email address:
          </p>
          
          <!-- OTP Box -->
          <div style="text-align:center;margin:30px 0;">
            <span style="display:inline-block;padding:15px 30px;
                         font-size:22px;font-weight:bold;
                         color:#fff;background:#007bff;
                         border-radius:8px;letter-spacing:3px;">
              ${otp}
            </span>
          </div>
          
          <p style="color:#555;text-align:center;">
            This OTP will expire in <b>5 minutes</b>.  
            If you did not request this, please ignore this email.
          </p>
          
          <hr style="margin:20px 0;border:none;border-top:1px solid #eee;">
          <p style="text-align:center;font-size:12px;color:#888;">
            &copy; ${new Date().getFullYear()} StudyVerse. All rights reserved.
          </p>
        </div>
      `,
        }

        await transport.sendMail(mailOptions);
        console.log("✅ Email sent successfully");
        return {status: true}
    }catch(err){
        console.error("❌ Email not sent:", err.message);
        return {status: true}
    }
}

exports.sendMail = sendMail;