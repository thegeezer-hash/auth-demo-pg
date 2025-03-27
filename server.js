require("dotenv").config();
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const pool = require("./db");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios"); //  Added axios for API requests
const GitHubStrategy = require("passport-github2").Strategy;
const authenticateToken = require("./authMiddleware"); // Import middleware

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

//  GitHub OAuth Configuration
passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: "http://localhost:5002/auth/github/callback"
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

// Route to check if the server is running
app.get("/", (req, res) => {
  res.send("Auth API IS RUNNING.....");
});

app.get("/user", authenticateToken, async (req, res) => {
  try {
    const user = await pool.query("SELECT * FROM users WHERE id = $1", [req.user.userId]);

    if (user.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      email: user.rows[0].email,
      avatar: `https://github.com/${user.rows[0].email.split("@")[0]}.png`
    });

  } catch (err) {
    console.error(" User Fetch Error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});


//  GitHub OAuth Login Route
app.get("/auth/github", passport.authenticate("github", { scope: ["user:email"] }));

//  GitHub OAuth Callback - FIXED
app.get("/auth/github/callback", async (req, res) => {
  try {
    console.log(" GitHub Callback Hit! Query Params:", req.query);

    const { code } = req.query;
    if (!code) {
      return res.redirect("http://localhost:3000?error=missing_code");
    }

    //  Exchange the code for an access token
    const tokenResponse = await axios.post("https://github.com/login/oauth/access_token", {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code: code,
      redirect_uri: "http://localhost:5002/auth/github/callback"
    }, { headers: { accept: "application/json" } });

    console.log(" GitHub Token Response:", tokenResponse.data);

    const accessToken = tokenResponse.data.access_token;
    if (!accessToken) {
      console.log(" No access token received!");
      return res.redirect("http://localhost:3000?error=no_access_token");
    }

    //  Fetch user data from GitHub API
    const userResponse = await axios.get("https://api.github.com/user", {
      
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    console.log(" GitHub User Data:", userResponse.data);

    const email = userResponse.data.email || `${userResponse.data.login}@github.com`;

    //  Save user in database (or check if exists)
    let user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (user.rows.length === 0) {
      user = await pool.query(
        "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *",
        [email, "GITHUB_AUTH"]
      );
    }

    //  Generate JWT token
    const jwtToken = jwt.sign({ userId: user.rows[0].id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    console.log(" Redirecting with Token:", jwtToken);

    //  Redirect to frontend with token
    res.redirect(`http://localhost:3000?token=${jwtToken}`);

  } catch (err) {
    console.error(" GitHub OAuth Error:", err.response ? err.response.data : err.message);
    res.redirect("http://localhost:3000?error=oauth_failed");
  }
});

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
    console.error(" Registration Error:", err.message);
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

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "18010000h" });
    res.json({ token });
  } catch (err) {
    console.error(" Login Error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

//  Start Server
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(` Server running on port ${PORT}`));

//  Debugging: List all routes
const listEndpoints = require("express-list-endpoints");
console.log(listEndpoints(app));

//  GET all clients for logged-in user
app.get("/clients", authenticateToken, async (req, res) => {
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      "SELECT * FROM clients WHERE user_id = $1 ORDER BY id DESC",
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(" Error fetching clients:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});


app.get('/clients', (req, res) => {
  // Return some dummy data or real data from your database
  res.json([
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob', email: 'bob@example.com' }
  ]);
});


//  POST: add new client
app.post("/clients", authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const { name, email, phone, company, notes } = req.body;

  try {
    const result = await pool.query(
      "INSERT INTO clients (name, email, phone, company, notes, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [name, email, phone, company, notes, userId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(" Error adding client:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH: update client
app.patch("/clients/:id", authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const clientId = req.params.id;
  const { name, email, phone, company, notes } = req.body;

  try {
    const result = await pool.query(
      "UPDATE clients SET name=$1, email=$2, phone=$3, company=$4, notes=$5 WHERE id=$6 AND user_id=$7 RETURNING *",
      [name, email, phone, company, notes, clientId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Client not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(" Error updating client:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

//  DELETE: remove client
app.delete("/clients/:id", authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const clientId = req.params.id;

  try {
    const result = await pool.query(
      "DELETE FROM clients WHERE id = $1 AND user_id = $2 RETURNING *",
      [clientId, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Client not found" });
    }

    res.json({ message: "Client deleted successfully" });
  } catch (err) {
    console.error(" Error deleting client:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});
