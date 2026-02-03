const userController = require("../controllers/user.controller");

module.exports = function (app) {
  app.post("/users", userController.createUser);
  app.post("/login", userController.login);
  app.post("/logout", userController.logout);
};
