const db = require("../../database");

// Fetch item info (mainly used to check creator)
const getItemById = (itemId, callback) => {
  db.get(
    `SELECT item_id, creator_id
     FROM items
     WHERE item_id = ?`,
    [itemId],
    callback
  );
};

// Insert a new question for an item
const createQuestion = (itemId, userId, questionText, callback) => {
  db.run(
    `
      INSERT INTO questions (item_id, asked_by, question, answer)
      VALUES (?, ?, ?, NULL)
    `,
    [itemId, userId, questionText],
    function (err) {
      callback(err, this ? this.lastID : null);
    }
  );
};

// Get a question along with the item creator (used when answering)
const getQuestionWithCreator = (questionId, callback) => {
  db.get(
    `
      SELECT q.question_id,
             q.item_id,
             q.asked_by,
             q.question,
             q.answer,
             i.creator_id
      FROM questions q
      JOIN items i ON i.item_id = q.item_id
      WHERE q.question_id = ?
    `,
    [questionId],
    callback
  );
};

// Store an answer for a question
const answerQuestion = (questionId, answerText, callback) => {
  db.run(
    `
      UPDATE questions
      SET answer = ?
      WHERE question_id = ?
    `,
    [answerText, questionId],
    callback
  );
};

// Get all questions for an item (newest first)
const getQuestionsForItem = (itemId, callback) => {
  db.all(
    `
      SELECT question_id,
             question AS question_text,
             answer AS answer_text
      FROM questions
      WHERE item_id = ?
      ORDER BY question_id DESC
    `,
    [itemId],
    callback
  );
};

module.exports = {
  getItemById,
  createQuestion,
  getQuestionWithCreator,
  answerQuestion,
  getQuestionsForItem,
};
