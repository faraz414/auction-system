const leoProfanity = require("leo-profanity");

const containsBadLanguage = (text) => {
  const message = String(text ?? "");
  return leoProfanity.check(message);
};

module.exports = { containsBadLanguage };
