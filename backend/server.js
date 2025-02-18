const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "user_auth",
});

db.connect((err) => {
  if (err) throw err;
  console.log("MySQL Connected...");
});

// REGISTER User
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";
    db.query(sql, [name, email, hashedPassword], (err, result) => {
      if (err) {
        return res.status(400).json({ message: "Email already exists!" });
      }
      res.json({ message: "User registered successfully!" });
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

// LOGIN User
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const sql = "SELECT * FROM users WHERE email = ?";
  db.query(sql, [email], async (err, results) => {
    if (err) return res.status(500).json({ message: "Server Error" });
    
    if (results.length === 0) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }

    const user = results[0];

    // Compare Hashed Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }

    // Generate JWT Token
    const token = jwt.sign({ id: user.id, email: user.email }, "secret", { expiresIn: "1h" });

    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  });
});

// GET ALL USERS (Admin View)
app.get("/users", (req, res) => {
  const sql = "SELECT id, name, email, created_at FROM users";
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: "Server Error" });
    res.json(results);
  });
});

app.listen(5000, () => console.log("Server running on port 5000"));
