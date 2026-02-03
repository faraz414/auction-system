const { containsBadLanguage } = require("../utils/profanity");
const Question = require("../models/question.model");

// Check for unexpected fields in request body
const hasUnexpectedFields = (body, allowedFields) => {
  return Object.keys(body || {}).some(
    (key) => !allowedFields.includes(key)
  );
};

const isEmpty = (value) =>
  value === undefined || value === null || String(value).trim() === "";

// POST /item/:id/question
exports.askQuestion = (req, res) => {
  const itemId = Number(req.params.id);
  if (!Number.isInteger(itemId) || itemId <= 0) return res.sendStatus(404);

  // Set by authentication middleware
  const userId = req.user_id;
  if (!userId) return res.sendStatus(401);

  const allowedFields = ["question_text"];
  if (hasUnexpectedFields(req.body, allowedFields)) {
    return res.status(400).json({ error_message: "extra field" });
  }

  const questionText = req.body?.question_text;

  if (questionText === undefined) {
    return res.status(400).json({ error_message: "missing question_text" });
  }

  if (isEmpty(questionText)) {
    return res.status(400).json({ error_message: "blank question_text" });
  }

    if (containsBadLanguage(questionText)) {
    return res.status(400).json({
      error_message: "question contains inappropriate language",
    });
  }


  // Confirm item exists and user is not the creator
  Question.getItemById(itemId, (err, item) => {
    if (err) return res.status(500).json({ error_message: "server error" });
    if (!item) return res.sendStatus(404);

    if (item.creator_id === userId) return res.sendStatus(403);

    Question.createQuestion(
      itemId,
      userId,
      String(questionText).trim(),
      (createErr, questionId) => {
        if (createErr)
          return res.status(500).json({ error_message: "server error" });

        return res.status(200).json({ question_id: questionId });
      }
    );
  });
};

// POST /question/:question_id
exports.answerQuestion = (req, res) => {
  const questionId = Number(req.params.question_id);
  if (!Number.isInteger(questionId) || questionId <= 0)
    return res.sendStatus(404);

  const userId = req.user_id;
  if (!userId) return res.sendStatus(401);

  const allowedFields = ["answer_text"];
  if (hasUnexpectedFields(req.body, allowedFields)) {
    return res.status(400).json({ error_message: "extra field" });
  }

  const answerText = req.body?.answer_text;

  // Validation must happen before checking if question exists
  if (answerText === undefined) {
    return res.status(400).json({ error_message: "missing answer_text" });
  }

  if (isEmpty(answerText)) {
    return res.status(400).json({ error_message: "blank answer_text" });
  }

  // Check question exists and user owns the item
  Question.getQuestionWithCreator(questionId, (err, question) => {
    if (err) return res.status(500).json({ error_message: "server error" });
    if (!question) return res.sendStatus(404);

    if (question.creator_id !== userId) return res.sendStatus(403);

    Question.answerQuestion(
      questionId,
      String(answerText).trim(),
      (updateErr) => {
        if (updateErr)
          return res.status(500).json({ error_message: "server error" });

        return res.sendStatus(200);
      }
    );
  });
};

// GET /item/:id/question
exports.getQuestions = (req, res) => {
  const itemId = Number(req.params.id);
  if (!Number.isInteger(itemId) || itemId <= 0) return res.sendStatus(404);

  // Item must exist before returning questions
  Question.getItemById(itemId, (err, item) => {
    if (err) return res.status(500).json({ error_message: "server error" });
    if (!item) return res.sendStatus(404);

    Question.getQuestionsForItem(itemId, (listErr, questions) => {
      if (listErr)
        return res.status(500).json({ error_message: "server error" });

      return res.status(200).json(questions || []);
    });
  });
};
