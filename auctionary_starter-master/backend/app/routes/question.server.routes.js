const { isAuthenticated } = require("../middleware/middleware");
const questionController = require("../controllers/question.controller");

module.exports = function (app) {
  // Ask question 
  app.post("/item/:id/question", isAuthenticated, questionController.askQuestion);
  // Answer question 
  app.post("/question/:question_id", isAuthenticated, questionController.answerQuestion);
  // Get questions
  app.get("/item/:id/question", questionController.getQuestions);
};
