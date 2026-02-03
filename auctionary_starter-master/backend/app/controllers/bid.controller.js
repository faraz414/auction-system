const db = require("../../database");
const bidModel = require("../models/bid.model");

// Check request body does not contain unexpected fields
function hasExtraFields(obj, allowed) {
  const keys = Object.keys(obj || {});
  return keys.some((k) => !allowed.includes(k));
}

// Simple blank check used across validations
function isBlank(v) {
  return v === undefined || v === null || String(v).trim() === "";
}

// Retrieve user ID from session token, this is used when placing bids
function getUserIdFromToken(token) {
  return new Promise((resolve) => {
    if (!token) return resolve(null);

    db.get(
      `SELECT user_id FROM users WHERE session_token = ?`,
      [token],
      (err, row) => {
        if (err || !row) return resolve(null);
        resolve(row.user_id);
      }
    );
  });
}

// Fetch item to check existence and ownership
function getItem(itemId) {
  return new Promise((resolve) => {
    db.get(
      `SELECT item_id, creator_id FROM items WHERE item_id = ?`,
      [itemId],
      (err, row) => {
        if (err || !row) return resolve(null);
        resolve(row);
      }
    );
  });
}

// POST /item/:id/bid
exports.placeBid = async (req, res) => {
  const itemId = Number(req.params.id);
  if (!Number.isInteger(itemId) || itemId <= 0) {
    return res.sendStatus(404);
  }

  // Authentication (middleware should handle this, but i kept it as a safeguard)
  const sessionToken = req.header("X-Authorization");
  const bidderId = await getUserIdFromToken(sessionToken);
  if (!bidderId) return res.sendStatus(401);

  // Validate request body
  const allowed = ["amount"];
  if (hasExtraFields(req.body, allowed)) {
    return res.status(400).json({ error_message: "extra field" });
  }

  const { amount } = req.body || {};

  if (amount === undefined) {
    return res.status(400).json({ error_message: "missing amount" });
  }

  if (isBlank(amount)) {
    return res.status(400).json({ error_message: "blank amount" });
  }

  const bidAmount = Number(amount);
  if (!Number.isFinite(bidAmount) || bidAmount <= 0) {
    return res.status(400).json({ error_message: "invalid amount" });
  }

  // make sure item exists
  const item = await getItem(itemId);
  if (!item) return res.sendStatus(404);

  // Users are not allowed to bid on their own items
  if (item.creator_id === bidderId) {
    return res.sendStatus(403);
  }

  // determine the current minimum bid threshold
  const highestBid = await bidModel.getHighestBidForItem(itemId);

  // If no bids exist, compare against starting bid instead
  const startingBid = await new Promise((resolve) => {
    db.get(
      `SELECT starting_bid FROM items WHERE item_id = ?`,
      [itemId],
      (err, row) => {
        if (err || !row) return resolve(0);
        resolve(row.starting_bid ?? 0);
      }
    );
  });

  const threshold = highestBid === null ? Number(startingBid) : Number(highestBid);

  // Bid must be higher than current threshold
  if (bidAmount <= threshold) {
    return res.status(400).json({ error_message: "amount too low" });
  }

  // Insert bid into database
  const timestamp = Date.now();
  await bidModel.insertBid(itemId, bidderId, bidAmount, timestamp);

  // Successful bid
  return res.sendStatus(201);
};

// GET /item/:id/bids
exports.getBidHistory = async (req, res) => {
  const itemId = Number(req.params.id);
  if (!Number.isInteger(itemId) || itemId <= 0) {
    return res.sendStatus(404);
  }

  // Check item exists before fetching bids
  const item = await getItem(itemId);
  if (!item) return res.sendStatus(404);

  const bids = await bidModel.getBidHistoryForItem(itemId);

  // this return empty array if no bids exist
  return res.status(200).json(bids);
};
