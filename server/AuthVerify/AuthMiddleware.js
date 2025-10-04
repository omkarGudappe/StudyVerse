const jwt = require("jsonwebtoken");
const User = require("../Db/User");

const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ ok: false, message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ ok: false, message: "User not found" });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ ok: false, message: "Invalid token" });
  }
};

module.exports = authenticate;