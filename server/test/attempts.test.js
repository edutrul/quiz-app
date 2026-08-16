import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import db from '../src/db.js';

let quizId;

before(() => {
  const quiz = db
    .prepare('INSERT INTO quizzes (title, description) VALUES (?, ?)')
    .run('Test Quiz', 'A quiz used only by the test suite.');
  quizId = quiz.lastInsertRowid;

  const insertQuestion = db.prepare('INSERT INTO questions (quiz_id, prompt, position) VALUES (?, ?, ?)');
  const insertChoice = db.prepare(
    'INSERT INTO choices (question_id, label, is_correct, position) VALUES (?, ?, ?, ?)'
  );

  const q1 = insertQuestion.run(quizId, '2 + 2 = ?', 0).lastInsertRowid;
  insertChoice.run(q1, '3', 0, 0);
  insertChoice.run(q1, '4', 1, 1);

  const q2 = insertQuestion.run(quizId, 'Capital of France?', 1).lastInsertRowid;
  insertChoice.run(q2, 'Paris', 1, 0);
  insertChoice.run(q2, 'London', 0, 1);
});

test('GET /api/quizzes lists the seeded quiz', async () => {
  const res = await request(app).get('/api/quizzes');
  assert.equal(res.status, 200);
  const quiz = res.body.find((q) => q.id === quizId);
  assert.ok(quiz);
  assert.equal(quiz.questionCount, 2);
});

test('full attempt lifecycle honors the core invariants', async () => {
  const start = await request(app).post(`/api/quizzes/${quizId}/attempts`);
  assert.equal(start.status, 201);
  const { attemptId } = start.body;

  // Invariant: correct answers are never sent before completion.
  const resume = await request(app).get(`/api/attempts/${attemptId}`);
  assert.equal(resume.status, 200);
  assert.equal(JSON.stringify(resume.body).includes('isCorrect'), false);
  const [q1, q2] = resume.body.questions;
  const q1CorrectChoiceId = resume.body.questions[0].choices.find((c) => c.label === '4').id;
  const q2WrongChoiceId = q2.choices.find((c) => c.label === 'London').id;

  // Invariant: idempotent submission — duplicate rapid submits collapse to one row.
  const submit1 = await request(app)
    .put(`/api/attempts/${attemptId}/answers/${q1.id}`)
    .send({ choiceId: q1CorrectChoiceId });
  assert.equal(submit1.status, 201);

  const submit1Again = await request(app)
    .put(`/api/attempts/${attemptId}/answers/${q1.id}`)
    .send({ choiceId: q1CorrectChoiceId });
  assert.equal(submit1Again.status, 200);

  const rowCount = db
    .prepare('SELECT COUNT(*) AS count FROM attempt_answers WHERE attempt_id = ? AND question_id = ?')
    .get(attemptId, q1.id).count;
  assert.equal(rowCount, 1);

  // Invariant: changing an already-answered question is rejected, not silently overwritten.
  const conflictingSubmit = await request(app)
    .put(`/api/attempts/${attemptId}/answers/${q1.id}`)
    .send({ choiceId: resume.body.questions[0].choices.find((c) => c.label === '3').id });
  assert.equal(conflictingSubmit.status, 409);

  // Completing before all questions are answered is rejected.
  const earlyComplete = await request(app).post(`/api/attempts/${attemptId}/complete`);
  assert.equal(earlyComplete.status, 400);
  assert.deepEqual(earlyComplete.body.missingQuestionIds, [q2.id]);

  await request(app).put(`/api/attempts/${attemptId}/answers/${q2.id}`).send({ choiceId: q2WrongChoiceId });

  // Invariant: score is server-computed.
  const complete = await request(app).post(`/api/attempts/${attemptId}/complete`);
  assert.equal(complete.status, 200);
  assert.equal(complete.body.score, 1);

  // Completion is idempotent.
  const completeAgain = await request(app).post(`/api/attempts/${attemptId}/complete`);
  assert.equal(completeAgain.status, 200);
  assert.equal(completeAgain.body.score, 1);

  // Invariant: correctness is only revealed after completion, via the results endpoint.
  const results = await request(app).get(`/api/attempts/${attemptId}/results`);
  assert.equal(results.status, 200);
  assert.equal(results.body.score, 1);
  const resultQ1 = results.body.questions.find((q) => q.id === q1.id);
  assert.equal(resultQ1.wasCorrect, true);
  const resultQ2 = results.body.questions.find((q) => q.id === q2.id);
  assert.equal(resultQ2.wasCorrect, false);
});

test('GET /api/attempts/:id returns 404 for an unknown attempt', async () => {
  const res = await request(app).get('/api/attempts/does-not-exist');
  assert.equal(res.status, 404);
});
