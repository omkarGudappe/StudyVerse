const nodemailer = require("nodemailer");

// ✅ SINGLETON TRANSPORT - Created once and reused for all emails
let transporter = null;
let lastEmailError = null; // Store last error for debugging

const initializeTransporter = () => {
    if (transporter) return transporter;

    transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: true,
        requireTLS: true,
        pool: {
            maxConnections: 10,           // ✅ Connection pooling
            maxMessages: 100,
            rateDelta: 2000,              // ✅ Rate limiting (ms between messages)
            rateLimit: 5                  // ✅ 5 messages per rateDelta
        },
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        connectionTimeout: 15000,          // ✅ 5 second timeout
        socketTimeout: 15000,
        logger: false,
        debug: false
    });

    // Verify connection on startup
    transporter.verify((error, success) => {
        if (error) {
            console.error("❌ SMTP Connection Error:", error.message);
            lastEmailError = {
                type: 'SMTP_CONNECTION_ERROR',
                message: 'Email service is temporarily unavailable. Please try again later.',
                timestamp: new Date()
            };
            transporter = null; // Reset on error
        } else {
            lastEmailError = null;
        }
    });

    return transporter;
};

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
    };

    // Check if error message contains known patterns
    for (let [key, message] of Object.entries(errorMap)) {
        if (error.message?.includes(key) || error.code?.includes(key)) {
            return message;
        }
    }

    // Default friendly message
    return 'Unable to send email. Please try again later.';
};

const sendMail = async (to, subject, otp) => {
    try {
        // ✅ Initialize transporter only once
        const mailer = initializeTransporter();

        if (!mailer) {
            throw new Error('SMTP_CONNECTION_ERROR: Email service is not initialized');
        }

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
      `,
        };

        // ✅ Send with timeout promise
        const emailPromise = mailer.sendMail(mailOptions);
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Email sending timeout")), 8000)
        );

        await Promise.race([emailPromise, timeoutPromise]);
        
        lastEmailError = null;
        return { status: true, userMessage: 'Verification code sent successfully!' };
    } catch (err) {
        console.error("❌ Email not sent:", err.message);
        
        // Store error for monitoring
        lastEmailError = {
            type: err.code || 'UNKNOWN_ERROR',
            message: err.message,
            timestamp: new Date()
        };

        // Reset transporter on critical errors
        if (err.message.includes("timeout") || err.code === "ECONNREFUSED") {
            transporter = null;
        }

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
// NOW WITH ERROR CALLBACK for real-time notifications
const sendMailAsync = (to, subject, otp, errorCallback = null) => {
    sendMail(to, subject, otp)
        .then((result) => {
            console.log("✅ Async email sent to:", to);
        })
        .catch(err => {
            console.error("❌ Async email failed:", err.message);
            
            // Call error callback if provided (e.g., to notify user via WebSocket)
            if (errorCallback && typeof errorCallback === 'function') {
                errorCallback({
                    email: to,
                    error: err.message,
                    userMessage: getErrorMessage(err)
                });
            }
        });
};

// ✅ Synchronous version with timeout (waits for response)
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

// ✅ Graceful shutdown
const closeTransporter = () => {
    if (transporter) {
        transporter.close();
        transporter = null;
        console.log("📧 Email transporter closed");
    }
};

exports.sendMail = sendMail;
exports.sendMailAsync = sendMailAsync;
exports.sendMailWithRetry = sendMailWithRetry;
exports.getLastError = getLastError;
exports.closeTransporter = closeTransporter;