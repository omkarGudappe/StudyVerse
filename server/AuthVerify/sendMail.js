const sgMail = require('@sendgrid/mail');

// ✅ Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

let lastEmailError = null; // Store last error for debugging

// ✅ User-friendly error messages
const getErrorMessage = (error) => {
    const errorMap = {
        'ECONNREFUSED': 'Email service connection failed. Please check your internet connection.',
        'ENOTFOUND': 'Email service is unreachable. Please try again later.',
        'ETIMEDOUT': 'Email service is slow to respond. Please try again.',
        'Email sending timeout': 'Email is taking too long. Please try again.',
        'Invalid email': 'Please check your email address and try again.',
        'Authentication failed': 'Email service authentication failed. Please contact support.',
        'EACCES': 'Email service permission denied. Please contact support.',
        '401': 'Email service authentication failed. Invalid API key. Please contact support.',
        '400': 'Invalid email format. Please check your email address.',
        '429': 'Too many requests. Please try again in a moment.',
    };

    // Check if error message contains known patterns
    for (let [key, message] of Object.entries(errorMap)) {
        if (error.message?.includes(key) || error.code?.includes(key) || error.status?.toString().includes(key)) {
            return message;
        }
    }

    // Default friendly message
    return 'Unable to send email. Please try again later.';
};

const sendMail = async (to, subject, otp) => {

    const htmlTemplate = `
 <div style="max-width:600px;margin:auto;padding:20px;
                    border:1px solid #eee;border-radius:10px;
                    font-family:Arial,sans-serif;">
          
          <!-- Logo -->
          <div style="text-align:center;margin-bottom:20px;">
            <img src="https://study-verse-rose.vercel.app/LOGO/StudyVerseLogo2.png" alt="Logo" style="width:120px;">
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
`

    try {
        // ✅ Verify API key is set
        if (!process.env.SENDGRID_API_KEY) {
            throw new Error('SendGrid API key not configured');
        }

        if (!process.env.SENDGRID_FROM_EMAIL) {
            throw new Error('SendGrid from email not configured');
        }

        const mailOptions = {
            to,
            from: {
                email:  process.env.SENDGRID_FROM_EMAIL,
                name: "StudyVerse"
            },
            subject,
            text: `Your StudyVerse verification code is ${otp}. This code expires in 5 minutes.`,
            html: htmlTemplate,
        };

        // ✅ Send via SendGrid HTTP API (no SMTP port restrictions)
        await sgMail.send(mailOptions);
        
        lastEmailError = null;
        console.log("✅ Email sent successfully to:", to);
        return { status: true, userMessage: 'Verification code sent successfully!' };
    } catch (err) {
        console.log("STATUS:", err.code);
        console.log("BODY:", err.response?.body);
        console.error("❌ Email not sent:", err.message);
        
        // Store error for monitoring
        lastEmailError = {
            type: err.code || err.status || 'UNKNOWN_ERROR',
            message: err.message,
            timestamp: new Date()
        };

        // Return user-friendly error message
        const userFriendlyMessage = getErrorMessage(err);
        return { 
            status: false, 
            error: err.message,
            userMessage: userFriendlyMessage 
        };
    }
};

// ✅ Send email asynchronously WITHOUT blocking response
const sendMailAsync = (to, subject, otp, errorCallback = null) => {
    sendMail(to, subject, otp)
        .then((result) => {
            console.log("✅ Async email sent to:", to);
        })
        .catch(err => {
            console.error("❌ Async email failed:", err.message);
            
            // Call error callback if provided
            if (errorCallback && typeof errorCallback === 'function') {
                errorCallback({
                    email: to,
                    error: err.message,
                    userMessage: getErrorMessage(err)
                });
            }
        });
};

// ✅ Synchronous version with retry logic
const sendMailWithRetry = async (to, subject, otp, maxRetries = 2) => {
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`📧 Attempt ${attempt}/${maxRetries} to send email to ${to}`);
            const result = await sendMail(to, subject, otp);
            
            if (result.status) {
                return result;
            }
            
            lastError = result;
        } catch (err) {
            lastError = {
                status: false,
                userMessage: getErrorMessage(err),
                error: err.message
            };
        }

        // Wait before retrying (exponential backoff)
        if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
    }

    return lastError;
};

// ✅ Get last error for monitoring/debugging
const getLastError = () => {
    return lastEmailError;
};

// ✅ Graceful shutdown (not needed for SendGrid, but kept for compatibility)
const closeTransporter = () => {
    console.log("📧 SendGrid cleanup complete");
};

exports.sendMail = sendMail;
exports.sendMailAsync = sendMailAsync;
exports.sendMailWithRetry = sendMailWithRetry;
exports.getLastError = getLastError;
exports.closeTransporter = closeTransporter;