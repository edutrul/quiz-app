import db from './db.js';

const questions = [
  {
    prompt: 'What does `typeof null` return in JavaScript?',
    choices: [
      { label: '"null"', correct: false },
      { label: '"object"', correct: true },
      { label: '"undefined"', correct: false },
      { label: '"number"', correct: false },
    ],
  },
  {
    prompt: 'Which method adds one or more elements to the end of an array?',
    choices: [
      { label: 'array.push()', correct: true },
      { label: 'array.pop()', correct: false },
      { label: 'array.shift()', correct: false },
      { label: 'array.concat()', correct: false },
    ],
  },
  {
    prompt: 'What is the output of `1 == "1"` in JavaScript?',
    choices: [
      { label: 'true', correct: true },
      { label: 'false', correct: false },
      { label: 'undefined', correct: false },
      { label: 'Throws a TypeError', correct: false },
    ],
  },
  {
    prompt: 'Which keyword declares a block-scoped variable that can be reassigned?',
    choices: [
      { label: 'const', correct: false },
      { label: 'var', correct: false },
      { label: 'let', correct: true },
      { label: 'static', correct: false },
    ],
  },
  {
    prompt: 'What does `Array.prototype.map` return?',
    choices: [
      { label: 'A new array', correct: true },
      { label: 'The original array, mutated in place', correct: false },
      { label: 'A single value', correct: false },
      { label: 'undefined', correct: false },
    ],
  },
];

const insertQuiz = db.prepare('INSERT INTO quizzes (title, description) VALUES (?, ?)');
const insertQuestion = db.prepare('INSERT INTO questions (quiz_id, prompt, position) VALUES (?, ?, ?)');
const insertChoice = db.prepare(
  'INSERT INTO choices (question_id, label, is_correct, position) VALUES (?, ?, ?, ?)'
);

const seed = db.transaction(() => {
  const quizResult = insertQuiz.run('JavaScript Fundamentals', 'A short quiz to check your JS basics.');
  const quizId = quizResult.lastInsertRowid;

  questions.forEach((question, questionIndex) => {
    const questionResult = insertQuestion.run(quizId, question.prompt, questionIndex);
    const questionId = questionResult.lastInsertRowid;

    question.choices.forEach((choice, choiceIndex) => {
      insertChoice.run(questionId, choice.label, choice.correct ? 1 : 0, choiceIndex);
    });
  });

  return quizId;
});

const quizId = seed();
console.log(`Seeded quiz "JavaScript Fundamentals" (id=${quizId}) with ${questions.length} questions.`);
