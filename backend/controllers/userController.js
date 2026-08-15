const jwt = require("jsonwebtoken");
const { getPool, sql } = require("../config/database");

const isEmail = (value) =>
  /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(value);

const registerUser = async (req, res) => {
  const { name, email, phone, password, confirmPassword } = req.body;

  if (!name || !email || !phone || !password || !confirmPassword) {
    return res.status(400).json({ message: "All fields are required." });
  }

  if (!isEmail(email.trim())) {
    return res.status(400).json({ message: "Please provide a valid email address." });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match." });
  }

  try {
    const pool = await getPool();

    const existingByEmail = await pool
      .request()
      .input("Email", sql.NVarChar(150), email.trim())
      .query("SELECT id FROM Users WHERE email = @Email");

    if (existingByEmail.recordset.length > 0) {
      return res.status(409).json({ message: "Email already exists." });
    }

    const existingByPhone = await pool
      .request()
      .input("Phone", sql.NVarChar(20), phone.trim())
      .query("SELECT id FROM Users WHERE phone_number = @Phone");

    if (existingByPhone.recordset.length > 0) {
      return res.status(409).json({ message: "Phone number already exists." });
    }

    await pool
      .request()
      .input("Name", sql.NVarChar(100), name.trim())
      .input("Email", sql.NVarChar(150), email.trim())
      .input("Phone", sql.NVarChar(20), phone.trim())
      .input("Password", sql.NVarChar(255), password)
      .query(
        `INSERT INTO Users (full_name, email, phone_number, password)
         VALUES (@Name, @Email, @Phone, @Password)`
      );

    return res.status(201).json({ message: "Registration successful." });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ message: "Failed to register user." });
  }
};

const loginUser = async (req, res) => {
  const { login, password } = req.body;

  if (!login || !password) {
    return res.status(400).json({ message: "Login and password are required." });
  }

  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("login", sql.NVarChar(150), login.trim())
      .input("password", sql.NVarChar(255), password)
      .query(
        `SELECT id, full_name, email, phone_number, password
         FROM Users
         WHERE (email = @login OR phone_number = @login)
           AND password = @password`
      );

    if (result.recordset.length === 0) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const user = result.recordset[0];
    const token = jwt.sign(
      {
        userId: user.id,
        name: user.full_name,
        email: user.email,
        phone: user.phone_number,
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        userId: user.id,
        name: user.full_name,
        email: user.email,
        phone: user.phone_number,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Failed to login." });
  }
};

module.exports = {
  registerUser,
  loginUser,
};
