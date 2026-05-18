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
// ADMIN REGISTER
// =====================
app.post("/admin-register", (req, res) => {

  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.json({
      success: false,
      message: "Fill all fields"
    });
  }

  const checkSql =
    "SELECT * FROM admins WHERE email=?";

  db.query(checkSql, [email], (err, result) => {

    if (err) {
      return res.json({
        success: false,
        message: err.message
      });
    }

    if (result.length > 0) {
      return res.json({
        success: false,
        message: "Email already exists"
      });
    }

    const sql = `
      INSERT INTO admins (name, email, password)
      VALUES (?, ?, ?)
    `;

    db.query(sql, [name, email, password], (err2) => {

      if (err2) {
        return res.json({
          success: false,
          message: err2.message
        });
      }

      res.json({
        success: true,
        message: "Admin registered successfully"
      });

    });

  });

});

// =====================
// ADMIN LOGIN
// =====================
app.post("/admin-login", (req, res) => {

  const { email, password } = req.body;

  if (!email || !password) {
    return res.json({
      success: false,
      message: "Missing fields"
    });
  }

  const sql =
    "SELECT * FROM admins WHERE email=? AND password=?";

  db.query(sql, [email, password], (err, result) => {

    if (err) {
      return res.json({
        success: false,
        message: err.message
      });
    }

    if (result.length > 0) {

      res.json({
        success: true,
        admin: {
          id: result[0].id,
          name: result[0].name,
          email: result[0].email
        }
      });

    } else {

      res.json({
        success: false,
        message: "Invalid email or password"
      });

    }

  });

});

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


// MENU APIs (unchanged)
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

// ====================
// REGISTER USER
// =====================
app.post("/register", (req, res) => {
  const { name, email, password, address, gender, age, phone } = req.body;

  if (!name || !email || !password || !address || !gender || !age || !phone) {
    return res.json({ success: false, message: "Fill all fields" });
  }

  const checkSql = "SELECT * FROM users WHERE email=?";

  db.query(checkSql, [email], (err, result) => {
    if (err) return res.json({ success: false, message: err.message });

    if (result.length > 0) {
      return res.json({ success: false, message: "Email already exists" });
    }

    const sql = `
      INSERT INTO users (name,email,password,address,gender,age,phone)
      VALUES (?,?,?,?,?,?,?)
    `;

    db.query(sql, [name, email, password, address, gender, age, phone], err2 => {
      if (err2) return res.json({ success: false, message: err2.message });

      res.json({ success: true, message: "Registered successfully" });
    });
  });
});

// =====================
// LOGIN USER
// =====================
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const sql = "SELECT * FROM users WHERE email=? AND password=?";

  db.query(sql, [email, password], (err, result) => {
    if (err) return res.json({ success: false, message: err.message });

    if (result.length > 0) {
      res.json({
        success: true,
        user: {
          id: result[0].id,
          name: result[0].name,
          email: result[0].email,
          address: result[0].address,
          gender: result[0].gender,
          age: result[0].age,
          phone: result[0].phone
        }
      });
    } else {
      res.json({ success: false, message: "Invalid login" });
    }
  });
});

// =====================
// ⭐ NEW: UPDATE USER PROFILE
// =====================
app.post("/update-user", (req, res) => {
  const { id, address, gender, age, phone } = req.body;

  if (!id) {
    return res.json({ success: false, message: "Missing user id" });
  }

  const sql = `
    UPDATE users
    SET address=?, gender=?, age=?, phone=?
    WHERE id=?
  `;

  db.query(sql, [address, gender, age, phone, id], err => {
    if (err) return res.json({ success: false, message: err.message });

    res.json({ success: true, message: "Profile updated" });
  });
});

// =====================
// CHECKOUT (unchanged)
// =====================
app.post("/checkout", (req, res) => {
  const { user_name, items, total_price } = req.body;

  const sql = `
    INSERT INTO orders (user_name, items, total_price, status)
    VALUES (?,?,?,'Pending')
  `;

  db.query(sql, [user_name, items, total_price], err => {
    if (err) return res.json({ success: false, message: err.message });

    res.json({ success: true, message: "Order placed" });
  });
});

// =====================
// GET ALL ORDERS (ADMIN)
// =====================
app.get("/orders", (req, res) => {

  const sql = "SELECT * FROM orders ORDER BY id DESC";

  db.query(sql, (err, result) => {
    if (err) {
      return res.json({
        success: false,
        message: err.message
      });
    }

    res.json(result);
  });

});


// =====================
// GET USER ORDERS
// =====================
app.get("/orders/:user_name", (req, res) => {

  const user_name = req.params.user_name;

  const sql = `
    SELECT * FROM orders
    WHERE user_name=?
    ORDER BY id DESC
  `;

  db.query(sql, [user_name], (err, result) => {

    if (err) {
      return res.json({
        success: false,
        message: err.message
      });
    }

    res.json(result);

  });

});


// =====================
// UPDATE ORDER STATUS (ADMIN)
// =====================
app.post("/update-order-status", (req, res) => {

  const { order_id, status } = req.body;

  if (!order_id || !status) {
    return res.json({
      success: false,
      message: "Missing fields"
    });
  }

  const sql = "UPDATE orders SET status=? WHERE id=?";

  db.query(sql, [status, order_id], (err) => {

    if (err) {
      return res.json({
        success: false,
        message: err.message
      });
    }

    res.json({
      success: true,
      message: "Order status updated"
    });

  });

});

// =====================
app.listen(3000, "0.0.0.0", () => {
  console.log("Server running on port 3000");
});