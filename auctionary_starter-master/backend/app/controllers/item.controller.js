const { containsBadLanguage } = require("../utils/profanity");
const Item = require("../models/item.model");

// Helper to detect unexpected fields in request body
const hasExtraFields = (obj, allowed) => {
  const keys = Object.keys(obj || {});
  return keys.some((key) => !allowed.includes(key));
};

// Create a new auction item
exports.createItem = (req, res) => {
  const allowedFields = ["name", "description", "starting_bid", "end_date"];

  if (hasExtraFields(req.body, allowedFields)) {
    return res.status(400).json({ error_message: "extra field" });
  }

  const { name, description, starting_bid, end_date } = req.body || {};

  // Missing fields
  if (name === undefined) return res.status(400).json({ error_message: "missing name" });
  if (description === undefined) return res.status(400).json({ error_message: "missing description" });
  if (starting_bid === undefined) return res.status(400).json({ error_message: "missing starting_bid" });
  if (end_date === undefined) return res.status(400).json({ error_message: "missing end_date" });

  // For Blank values
  if (String(name).trim() === "") return res.status(400).json({ error_message: "blank name" });
  if (String(description).trim() === "") return res.status(400).json({ error_message: "blank description" });
  if (starting_bid === null) return res.status(400).json({ error_message: "blank starting_bid" });
  if (String(end_date).trim() === "") return res.status(400).json({ error_message: "blank end_date" });

    // Profanity check (extension task 1)
  if (containsBadLanguage(name) || containsBadLanguage(description)) {
    return res.status(400).json({
      error_message: "item contains inappropriate language",
    });
  }

  // Validate numbers
  const startingBid = Number(starting_bid);
  if (!Number.isFinite(startingBid) || startingBid < 0) {
    return res.status(400).json({ error_message: "invalid starting_bid" });
  }

  const endDate = Number(end_date);
  if (!Number.isFinite(endDate) || endDate < 0) {
    return res.status(400).json({ error_message: "invalid end_date" });
  }

  if (endDate < Date.now()) {
    return res.status(400).json({ error_message: "end_date in past" });
  }

  const start_date = Date.now();
  const creator_id = req.user_id;

  Item.create(
    name,
    description,
    startingBid,
    start_date,
    endDate,
    creator_id,
    (err, item_id) => {
      if (err) {
        return res.status(500).json({ error_message: "server error" });
      }
      return res.status(201).json({ item_id });
    }
  );
};

// this will get details for a single auction item
exports.getItemDetails = async (req, res) => {
  const itemId = Number(req.params.id);

  if (!Number.isInteger(itemId) || itemId <= 0) {
    return res.sendStatus(404);
  }

  try {
    const item = await Item.getItemById(itemId);
    if (!item) return res.sendStatus(404);

    const highestBid = await Item.getHighestBidWithUser(itemId);
    const current_bid = highestBid ? highestBid.amount : item.starting_bid;

    const current_bid_holder = highestBid
      ? {
          user_id: highestBid.user_id,
          first_name: highestBid.first_name,
          last_name: highestBid.last_name,
        }
      : null;

    return res.status(200).json({
      item_id: item.item_id,
      name: item.name,
      description: item.description,
      starting_bid: item.starting_bid,
      current_bid,
      start_date: item.start_date,
      end_date: item.end_date,
      creator_id: item.creator_id,
      first_name: item.creator_first_name,
      last_name: item.creator_last_name,
      current_bid_holder,
    });
  } catch (err) {
    return res.status(500).json({ error_message: "server error" });
  }
};
