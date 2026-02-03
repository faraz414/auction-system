const crypto = require("crypto");
const User = require("../models/user.model");

// Check request body only contains expected fields
const hasOnlyAllowedFields = (body, allowedFields) => {
  const keys = Object.keys(body || {});
  return keys.every((key) => allowedFields.includes(key));
};

const isEmpty = (value) =>
  value === undefined || value === null || String(value).trim() === "";

// Password rules based on the spec
const isValidPassword = (password) => {
  if (typeof password !== "string") return false;
  if (password.length < 8 || password.length > 30) return false;

  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  return hasUpper && hasLower && hasNumber && hasSpecial;
};

exports.createUser = (req, res) => {
  const allowedFields = ["first_name", "last_name", "email", "password"];

  if (!hasOnlyAllowedFields(req.body, allowedFields)) {
    return res.status(400).json({ error_message: "extra field" });
  }

  const { first_name, last_name, email, password } = req.body || {};

  // Missing fields
  if (
    first_name === undefined ||
    last_name === undefined ||
    email === undefined ||
    password === undefined
  ) {
    return res.status(400).json({ error_message: "missing field" });
  }

  // Blank fields
  if (
    isEmpty(first_name) ||
    isEmpty(last_name) ||
    isEmpty(email) ||
    isEmpty(password)
  ) {
    return res.status(400).json({ error_message: "blank field" });
  }

  if (!isValidPassword(password)) {
    return res.status(400).json({ error_message: "invalid password" });
  }

  User.getByEmail(email, (err, existingUser) => {
    if (err) return res.status(500).json({ error_message: "server error" });
    if (existingUser)
      return res.status(400).json({ error_message: "duplicate email" });

    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = crypto
      .createHash("sha256")
      .update(password + salt)
      .digest("hex");

    User.create(
      first_name,
      last_name,
      email,
      passwordHash,
      salt,
      (createErr, userId) => {
        if (createErr)
          return res.status(500).json({ error_message: "server error" });

        return res.status(201).json({ user_id: userId });
      }
    );
  });
};

exports.login = (req, res) => {
  const allowedFields = ["email", "password"];

  if (!hasOnlyAllowedFields(req.body, allowedFields)) {
    return res.status(400).json({ error_message: "extra field" });
  }

  const { email, password } = req.body || {};

  if (email === undefined || password === undefined) {
    return res.status(400).json({ error_message: "missing field" });
  }

  if (isEmpty(email) || isEmpty(password)) {
    return res.status(400).json({ error_message: "blank field" });
  }

  User.getByEmail(email, (err, user) => {
    if (err) return res.status(500).json({ error_message: "server error" });
    if (!user)
      return res.status(400).json({ error_message: "invalid credentials" });

    const attemptedHash = crypto
      .createHash("sha256")
      .update(password + user.salt)
      .digest("hex");

    if (attemptedHash !== user.password) {
      return res.status(400).json({ error_message: "invalid credentials" });
    }

    // Reuse token if already logged in
    if (user.session_token) {
      return res
        .status(200)
        .json({ user_id: user.user_id, session_token: user.session_token });
    }

    const newToken = crypto.randomBytes(24).toString("hex");

    User.setToken(user.user_id, newToken, (tokenErr) => {
      if (tokenErr)
        return res.status(500).json({ error_message: "server error" });

      return res
        .status(200)
        .json({ user_id: user.user_id, session_token: newToken });
    });
  });
};

exports.logout = (req, res) => {
  const token = req.header("X-Authorization");
  if (!token) return res.sendStatus(401);

  User.getIdFromToken(token, (err, row) => {
    if (err) return res.status(500).json({ error_message: "server error" });
    if (!row) return res.sendStatus(401);

    User.clearToken(row.user_id, (clearErr) => {
      if (clearErr)
        return res.status(500).json({ error_message: "server error" });

      return res.sendStatus(200);
    });
  });
};

// helpers for async/await style
const getOne = (fn, ...args) =>
  new Promise((resolve, reject) => {
    fn(...args, (err, row) => (err ? reject(err) : resolve(row || null)));
  });

const getMany = (fn, ...args) =>
  new Promise((resolve, reject) => {
    fn(...args, (err, rows) => (err ? reject(err) : resolve(rows || [])));
  });

exports.getUserDetails = async (req, res) => {
  const userId = Number(req.params.id);
  if (!Number.isInteger(userId) || userId <= 0) return res.sendStatus(404);

  try {
    const now = Date.now();

    const user = await getOne(User.getUserById, userId);
    if (!user) return res.sendStatus(404);

    const selling = await getMany(User.getSelling, userId, now);
    const biddingOn = await getMany(User.getBiddingOn, userId, now);
    const auctionsEnded = await getMany(User.getAuctionsEnded, userId, now);

    return res.status(200).json({
      user_id: user.user_id,
      first_name: user.first_name,
      last_name: user.last_name,
      selling,
      bidding_on: biddingOn,
      auctions_ended: auctionsEnded,
    });
  } catch (err) {
    return res.status(500).json({ error_message: "server error" });
  }
};
