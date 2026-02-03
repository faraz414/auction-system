const db = require("../../database");

// Save a new bid for an item
const insertBid = (itemId, bidderId, bidAmount, timePlaced) => {
  return new Promise((resolve, reject) => {
    db.run(
      `
        INSERT INTO bids (item_id, user_id, amount, timestamp)
        VALUES (?, ?, ?, ?)
      `,
      [itemId, bidderId, bidAmount, timePlaced],
      (err) => {
        if (err) return reject(err);
        resolve();
      }
    );
  });
};

// Find the current highest bid for an item
// Returns null if there are no bids yet
const getHighestBidForItem = (itemId) => {
  return new Promise((resolve, reject) => {
    db.get(
      `
        SELECT MAX(amount) AS highestBid
        FROM bids
        WHERE item_id = ?
      `,
      [itemId],
      (err, row) => {
        if (err) return reject(err);
        if (!row || row.highestBid === null) return resolve(null);
        resolve(row.highestBid);
      }
    );
  });
};

// Get all bids for an item, including bidder names
const getBidHistoryForItem = (itemId) => {
  return new Promise((resolve, reject) => {
    db.all(
      `
        SELECT
          b.item_id,
          b.amount,
          b.timestamp,
          b.user_id,
          u.first_name,
          u.last_name
        FROM bids b
        JOIN users u ON u.user_id = b.user_id
        WHERE b.item_id = ?
        ORDER BY b.amount DESC, b.timestamp DESC
      `,
      [itemId],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      }
    );
  });
};

module.exports = {
  insertBid,
  getHighestBidForItem,
  getBidHistoryForItem,
};
