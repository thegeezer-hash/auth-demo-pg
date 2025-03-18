require("dotenv").config();
const express = require("express");
const pool = require("./db");
const cors = require("cors");
const bcrypt = require("bcryptjs"); 
const jwt = require("jsonwebtoken");

const app = express();  
app.use(express.json()); 
app.use(cors()); 

// ✅ Route to check if the server is running
app.get("/", async (req, res) => {
    res.send("✅ Auth API IS RUNNING.....");
});

// ✅ User Registration Route
app.post("/register", async (req, res) => {
    const { email, password } = req.body; 

    try {
        const userExists = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.query("INSERT INTO users (email, password) VALUES ($1, $2)", [email, hashedPassword]);

        res.json({ message: "User registered successfully" });
    } catch (err) {
        console.error("❌ Registration Error:", err.message);
        res.status(500).json({ message: "Server error" }); // ✅ Fixed status code
    }
});

// ✅ User Login Route (POST)
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = userResult.rows[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({ token });
  } catch (err) {
    console.error("❌ Login Error:", err.message);
    res.status(500).json({ message: "Server error" }); // ✅ Fixed status code
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// ✅ Debugging: List all routes
const listEndpoints = require("express-list-endpoints");
console.log(listEndpoints(app));

const authenticateToken = require("./authMiddleware");

app.get("/dashboard", authenticateToken, (req, res) =>{
  res.json({ message:'Welcoöe to your dashboard mate, User ID: ${req.userId}' });
});

