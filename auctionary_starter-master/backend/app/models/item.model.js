const db = require("../../database");

// Insert a new item into the databas
const create = (name, description, starting_bid, start_date, end_date, creator_id, done) => {
  db.run(
    `INSERT INTO items (name, description, starting_bid, start_date, end_date, creator_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [name, description, starting_bid, start_date, end_date, creator_id],
    function (err) {
      done(err, this ? this.lastID : null);
    }
  );
};

// Get an item along with the creator's name
const getItemById = (itemId) => {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT i.item_id, i.name, i.description, i.starting_bid, i.start_date, i.end_date,
              i.creator_id, u.first_name AS creator_first_name, u.last_name AS creator_last_name
       FROM items i
       JOIN users u ON u.user_id = i.creator_id
       WHERE i.item_id = ?`,
      [itemId],
      (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      }
    );
  });
};

// Get the highest bid for an item, including bidder details
const getHighestBidWithUser = (itemId) => {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT b.amount, b.user_id, u.first_name, u.last_name
       FROM bids b
       JOIN users u ON u.user_id = b.user_id
       WHERE b.item_id = ?
       ORDER BY b.amount DESC, b.timestamp DESC
       LIMIT 1`,
      [itemId],
      (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      }
    );
  });
};

module.exports = { create, getItemById, getHighestBidWithUser };
