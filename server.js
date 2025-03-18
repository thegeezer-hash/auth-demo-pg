require("dotenv").config();
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const pool = require("./db");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const GitHubStrategy = require("passport-github2").Strategy;
const authenticateToken = require("./authMiddleware"); //  Import middleware

//  Define 'app' BEFORE using it
const app = express();

app.use(express.json());
app.use(cors());

//  Middleware to handle sessions
app.use(session({
  secret: "your_secret_key",
  resave: false,
  saveUninitialized: true
}));

//  Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

//  Configure GitHub OAuth
passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: "/auth/github/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await pool.query("SELECT * FROM users WHERE email = $1", [profile.username + "@github.com"]);

    if (user.rows.length === 0) {
      user = await pool.query(
        "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *",
        [profile.username + "@github.com", "GITHUB_AUTH"]
      );
    }

    return done(null, user.rows[0]);
  } catch (err) {
    return done(err, null);
  }
}));

//  Serialize & Deserialize User
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    done(null, user.rows[0]);
  } catch (err) {
    done(err, null);
  }
});

//  Route to check if the server is running
app.get("/", (req, res) => {
  res.send("Auth API IS RUNNING.....");
});

//  GitHub OAuth Login Route
app.get("/auth/github",
  passport.authenticate("github", { scope: ["user:email"] })
);

app.get("/auth/github/callback",
  passport.authenticate("github", { failureRedirect: "/" }),
  (req, res) => {
    res.json({ message: "GitHub Login Successful", user: req.user });
  }
);

//  User Registration Route
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
    res.status(500).json({ message: "Server error" });
  }
});

//  User Login Route
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
    res.status(500).json({ message: "Server error" });
  }
});

//  Route to update user details (Protected)
app.patch("/update", authenticateToken, async (req, res) => {
  const { email, password } = req.body;
  const userId = req.user.userId; // Get user ID from token

  try {
    if (email) {
      const emailExists = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
      if (emailExists.rows.length > 0) {
        return res.status(400).json({ message: "Email is already in use" });
      }

      await pool.query("UPDATE users SET email = $1 WHERE id = $2", [email, userId]);
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.query("UPDATE users SET password = $1 WHERE id = $2", [hashedPassword, userId]);
    }

    res.json({ message: "User information updated successfully" });
  } catch (err) {
    console.error("❌ Update Error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

//  Route to delete user account (Protected)
app.delete("/delete", authenticateToken, async (req, res) => {
  const userId = req.user.userId; // Get user ID from token

  try {
    const result = await pool.query("DELETE FROM users WHERE id = $1 RETURNING *", [userId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User account deleted successfully" });
  } catch (err) {
    console.error(" Delete Error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

//  Start Server (AFTER defining routes)
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

//  Debugging: List all routes
const listEndpoints = require("express-list-endpoints");
console.log(listEndpoints(app));
