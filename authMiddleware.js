const jwt = require("jsonwebtoken");

// ✅ Middleware to check if user is authenticated
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Store user data in req object
    next();
  } catch (err) {
    res.status(403).json({ message: "Invalid token" });
  }
};

module.exports = authenticateToken;
