import db from './db.js';

const quizzes = [
  {
    title: 'JavaScript Fundamentals',
    description: 'A short quiz to check your JS basics.',
    questions: [
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
    ],
  },
  {
    title: 'AI Fundamentals',
    description: 'A quick quiz on the basics of AI and large language models.',
    questions: [
      {
        prompt: 'What is a "token" in the context of large language models?',
        choices: [
          { label: 'A unit of text (word or subword) the model reads and generates', correct: true },
          { label: 'A cryptographic key used to authenticate API requests', correct: false },
          { label: 'A single neuron in the model', correct: false },
          { label: 'A unit of GPU memory', correct: false },
        ],
      },
      {
        prompt: 'What best describes supervised learning?',
        choices: [
          { label: 'Training a model on labeled input/output examples', correct: true },
          { label: 'Training a model with no data at all', correct: false },
          { label: 'Letting an agent learn purely from trial and error rewards', correct: false },
          { label: 'Clustering unlabeled data into groups', correct: false },
        ],
      },
      {
        prompt: 'What is "overfitting" in machine learning?',
        choices: [
          { label: 'A model performs well on training data but poorly on new data', correct: true },
          { label: 'A model trains faster than expected', correct: false },
          { label: 'A model uses too little memory', correct: false },
          { label: 'A model that generalizes perfectly to all inputs', correct: false },
        ],
      },
    ],
  },
];

const insertQuiz = db.prepare('INSERT INTO quizzes (title, description) VALUES (?, ?)');
const insertQuestion = db.prepare('INSERT INTO questions (quiz_id, prompt, position) VALUES (?, ?, ?)');
const insertChoice = db.prepare(
  'INSERT INTO choices (question_id, label, is_correct, position) VALUES (?, ?, ?, ?)'
);

const seed = db.transaction(() => {
  return quizzes.map((quiz) => {
    const quizResult = insertQuiz.run(quiz.title, quiz.description);
    const quizId = quizResult.lastInsertRowid;

    quiz.questions.forEach((question, questionIndex) => {
      const questionResult = insertQuestion.run(quizId, question.prompt, questionIndex);
      const questionId = questionResult.lastInsertRowid;

      question.choices.forEach((choice, choiceIndex) => {
        insertChoice.run(questionId, choice.label, choice.correct ? 1 : 0, choiceIndex);
      });
    });

    return { id: quizId, title: quiz.title, questionCount: quiz.questions.length };
  });
});

const seeded = seed();
seeded.forEach(({ id, title, questionCount }) => {
  console.log(`Seeded quiz "${title}" (id=${id}) with ${questionCount} questions.`);
});
