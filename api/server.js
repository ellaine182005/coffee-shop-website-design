const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =====================
// CREATE uploads folder
// =====================
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

// =====================
// MULTER CONFIG
// =====================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({ storage });

// =====================
// SERVE IMAGES
// =====================
app.use("/uploads", express.static("uploads"));

// =====================
// DATABASE
// =====================
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "coffee_db"
});

db.connect(err => {
  if (err) console.log("DB ERROR:", err);
  else console.log("Connected to MySQL");
});

// =====================
// MENU APIs (ONLY PART KEPT)
// =====================

app.get("/menu", (req, res) => {
  db.query("SELECT * FROM menu ORDER BY id DESC", (err, result) => {
    if (err) return res.json({ success: false, message: err.message });
    res.json(result);
  });
});

app.get("/menu/popular", (req, res) => {
  db.query(
    "SELECT * FROM menu WHERE type='POPULAR' ORDER BY id DESC",
    (err, result) => {
      if (err) return res.json({ success: false, message: err.message });
      res.json(result);
    }
  );
});

app.get("/menu/offers", (req, res) => {
  db.query(
    "SELECT * FROM menu WHERE type='OFFER' ORDER BY id DESC",
    (err, result) => {
      if (err) return res.json({ success: false, message: err.message });
      res.json(result);
    }
  );
});

// =====================
app.listen(3000, "0.0.0.0", () => {
  console.log("Server running on port 3000");
});