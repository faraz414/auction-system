const db = require("../../database");

// Allowed status values for filtering auctions
const VALID_STATUS = ["OPEN", "BID", "ARCHIVE"];

// Safely parse limit/offset values, falling back if invalid
const toInt = (value, fallback) => {
  const num = Number(value);
  return Number.isInteger(num) && num >= 0 ? num : fallback;
};

// Look up the logged-in user from the session token (if present)
const getUserIdFromToken = (token) =>
  new Promise((resolve) => {
    if (!token) return resolve(null);

    db.get(
      "SELECT user_id FROM users WHERE session_token = ?",
      [token],
      (err, row) => {
        if (err || !row) return resolve(null);
        resolve(row.user_id);
      }
    );
  });

// GET /search
exports.search = async (req, res) => {
  // Optional search text
  const queryText = (req.query.q ?? "").toString().trim();

  // Optional status filter (OPEN, BID, ARCHIVE)
  const status =
    req.query.status && typeof req.query.status === "string"
      ? req.query.status.trim().toUpperCase()
      : null;

  const limit = toInt(req.query.limit, 10);
  const offset = toInt(req.query.offset, 0);

  // Identify user if logged in
  const token = req.header("X-Authorization");
  const userId = await getUserIdFromToken(token);

  // Reject invalid status values
  if (status && !VALID_STATUS.includes(status)) {
    return res.sendStatus(400);
  }

  // Status filtering requires authentication
  if (status && !userId) {
    return res.sendStatus(400);
  }

  const now = Date.now();

  const whereParts = [];
  const params = [];

  // Search by name or description
  if (queryText.length > 0) {
    whereParts.push("(LOWER(i.name) LIKE ? OR LOWER(i.description) LIKE ?)");
    params.push(
      `%${queryText.toLowerCase()}%`,
      `%${queryText.toLowerCase()}%`
    );
  }

  // Auctions created by the user and still open
  if (status === "OPEN") {
    whereParts.push("i.creator_id = ?");
    whereParts.push("i.end_date > ?");
    params.push(userId, now);

  // Auctions the user has bid on and still open
  } else if (status === "BID") {
    whereParts.push("i.end_date > ?");
    whereParts.push(
      "EXISTS (SELECT 1 FROM bids b WHERE b.item_id = i.item_id AND b.user_id = ?)"
    );
    params.push(now, userId);

  // Auctions that have ended and involve the user
  } else if (status === "ARCHIVE") {
    whereParts.push("i.end_date <= ?");
    whereParts.push(
      "(i.creator_id = ? OR EXISTS (SELECT 1 FROM bids b WHERE b.item_id = i.item_id AND b.user_id = ?))"
    );
    params.push(now, userId, userId);
  }

  // Combine WHERE conditions if any exist
  const whereSql = whereParts.length
    ? `WHERE ${whereParts.join(" AND ")}`
    : "";

  // Main search query
  const sql = `
    SELECT
      i.item_id,
      i.name,
      i.description,
      i.end_date,
      i.creator_id,
      u.first_name,
      u.last_name,
      COALESCE(MAX(b.amount), i.starting_bid) AS current_bid
    FROM items i
    JOIN users u ON u.user_id = i.creator_id
    LEFT JOIN bids b ON b.item_id = i.item_id
    ${whereSql}
    GROUP BY i.item_id
    ORDER BY i.item_id DESC
    LIMIT ? OFFSET ?;
  `;

  params.push(limit, offset);

  // Execute query and return results
  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error_message: "server error" });
    }

    return res.status(200).json(rows || []);
  });
};
