const db = require("../../database");

// lookups used by auth
const getByEmail = (email, callback) => {
  db.get(
    `
      SELECT user_id, email, password, salt, session_token
      FROM users
      WHERE email = ?
    `,
    [email],
    callback
  );
};

const getIdFromToken = (sessionToken, callback) => {
  db.get(
    `SELECT user_id FROM users WHERE session_token = ?`,
    [sessionToken],
    callback
  );
};

// Create a new user record, password is already hashed
const create = (first_name, last_name, email, passwordHash, salt, callback) => {
  db.run(
    `
      INSERT INTO users (first_name, last_name, email, password, salt, session_token)
      VALUES (?, ?, ?, ?, ?, NULL)
    `,
    [first_name, last_name, email, passwordHash, salt],
    function (err) {
      callback(err, this ? this.lastID : null);
    }
  );
};

const setToken = (user_id, sessionToken, callback) => {
  db.run(
    `UPDATE users SET session_token = ? WHERE user_id = ?`,
    [sessionToken, user_id],
    callback
  );
};

const clearToken = (user_id, callback) => {
  db.run(
    `UPDATE users SET session_token = NULL WHERE user_id = ?`,
    [user_id],
    callback
  );
};

// Used for /users/:id endpoint
const getUserById = (userId, callback) => {
  db.get(
    `SELECT user_id, first_name, last_name FROM users WHERE user_id = ?`,
    [userId],
    callback
  );
};

// Auctions the user is selling that are still open
const getSelling = (userId, nowTs, callback) => {
  db.all(
    `
      SELECT i.item_id, i.name, i.description, i.end_date,
             i.creator_id, u.first_name, u.last_name
      FROM items i
      JOIN users u ON u.user_id = i.creator_id
      WHERE i.creator_id = ?
        AND i.end_date > ?
    `,
    [userId, nowTs],
    callback
  );
};

// Auctions the user has bid on that are still open
const getBiddingOn = (userId, nowTs, callback) => {
  db.all(
    `
      SELECT DISTINCT i.item_id, i.name, i.description, i.end_date,
                      i.creator_id, u.first_name, u.last_name
      FROM bids b
      JOIN items i ON i.item_id = b.item_id
      JOIN users u ON u.user_id = i.creator_id
      WHERE b.user_id = ?
        AND i.end_date > ?
    `,
    [userId, nowTs],
    callback
  );
};

// Auctions the user created that have ended
const getAuctionsEnded = (userId, nowTs, callback) => {
  db.all(
    `
      SELECT i.item_id, i.name, i.description, i.end_date,
             i.creator_id, u.first_name, u.last_name
      FROM items i
      JOIN users u ON u.user_id = i.creator_id
      WHERE i.creator_id = ?
        AND i.end_date <= ?
    `,
    [userId, nowTs],
    callback
  );
};

module.exports = {
  getByEmail,
  getIdFromToken,
  create,
  setToken,
  clearToken,
  getUserById,
  getSelling,
  getBiddingOn,
  getAuctionsEnded,
};
