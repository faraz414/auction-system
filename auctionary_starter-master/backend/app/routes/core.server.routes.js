const { isAuthenticated } = require("../middleware/middleware");
const userController = require("../controllers/user.controller");
const searchController = require("../controllers/search.controller");

const itemController = require("../controllers/item.controller");
const bidController = require("../controllers/bid.controller");

module.exports = function (app) {
  app.post("/item", isAuthenticated, itemController.createItem);

  // bidding
  app.post("/item/:id/bid", isAuthenticated, bidController.placeBid);

  // bid history
  app.get("/item/:id/bid", bidController.getBidHistory);

  app.get("/users/:id", userController.getUserDetails);

  // item details
  app.get("/item/:id", itemController.getItemDetails);

  app.get("/search", searchController.search);

};
