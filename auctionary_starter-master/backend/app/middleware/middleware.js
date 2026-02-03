const db = require("../../database");

const isAuthenticated = (req, res, next) => {
  const token = req.header("X-Authorization");
  if (!token) return res.sendStatus(401);

  db.get(
    "SELECT user_id FROM users WHERE session_token = ?",
    [token],
    (err, row) => {
      if (err) return res.status(500).json({ error_message: "server error" });
      if (!row) return res.sendStatus(401);

      req.user_id = row.user_id;
      next();
    }
  );
};

module.exports = {
  isAuthenticated
};
