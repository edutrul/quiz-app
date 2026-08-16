import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import db from '../db.js';
import { computeScore } from '../scoring.js';
import { NotFoundError, ConflictError, ValidationError } from '../errors.js';

const router = Router();

const getQuizStmt = db.prepare('SELECT id FROM quizzes WHERE id = ?');
const countQuestionsStmt = db.prepare('SELECT COUNT(*) AS count FROM questions WHERE quiz_id = ?');
const insertAttemptStmt = db.prepare(
  'INSERT INTO attempts (id, quiz_id, total_questions) VALUES (?, ?, ?)'
);
const getAttemptStmt = db.prepare('SELECT * FROM attempts WHERE id = ?');
const getQuestionsForQuizStmt = db.prepare(
  'SELECT id, prompt, position FROM questions WHERE quiz_id = ? ORDER BY position ASC'
);
const getChoicesForQuestionStmt = db.prepare(
  'SELECT id, label, position FROM choices WHERE question_id = ? ORDER BY position ASC'
);
const getChoicesWithCorrectnessStmt = db.prepare(
  'SELECT id, label, is_correct, position FROM choices WHERE question_id = ? ORDER BY position ASC'
);
const getAnsweredMapStmt = db.prepare(
  'SELECT question_id, choice_id FROM attempt_answers WHERE attempt_id = ?'
);
const getQuestionStmt = db.prepare('SELECT id, quiz_id FROM questions WHERE id = ?');
const getChoiceStmt = db.prepare('SELECT id, question_id, is_correct FROM choices WHERE id = ?');
const insertAnswerStmt = db.prepare(
  'INSERT INTO attempt_answers (attempt_id, question_id, choice_id, is_correct) VALUES (?, ?, ?, ?)'
);
const getExistingAnswerStmt = db.prepare(
  'SELECT * FROM attempt_answers WHERE attempt_id = ? AND question_id = ?'
);
const getAllAnswersForAttemptStmt = db.prepare('SELECT * FROM attempt_answers WHERE attempt_id = ?');
const completeAttemptStmt = db.prepare(
  "UPDATE attempts SET status = 'completed', score = ?, completed_at = datetime('now') WHERE id = ?"
);

function serializeAttemptStart(attempt) {
  return {
    attemptId: attempt.id,
    quizId: attempt.quiz_id,
    status: attempt.status,
    totalQuestions: attempt.total_questions,
    startedAt: attempt.started_at,
  };
}

// POST /api/quizzes/:quizId/attempts — start a new attempt
router.post('/quizzes/:quizId/attempts', (req, res) => {
  const quizId = Number(req.params.quizId);
  const quiz = getQuizStmt.get(quizId);
  if (!quiz) {
    throw new NotFoundError('Quiz not found');
  }

  const { count } = countQuestionsStmt.get(quizId);
  const attemptId = randomUUID();
  insertAttemptStmt.run(attemptId, quizId, count);
  const attempt = getAttemptStmt.get(attemptId);

  res.status(201).json(serializeAttemptStart(attempt));
});

// GET /api/attempts?ids=a,b,c — history scoped to client-supplied ids
router.get('/attempts', (req, res) => {
  const idsParam = req.query.ids;
  const ids = idsParam
    ? String(idsParam)
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean)
    : [];

  if (ids.length === 0) {
    res.json([]);
    return;
  }

  const placeholders = ids.map(() => '?').join(',');
  const rows = db
    .prepare(
      `SELECT a.id AS attemptId, a.quiz_id AS quizId, q.title AS quizTitle, a.status,
              a.score, a.total_questions AS totalQuestions, a.started_at AS startedAt,
              a.completed_at AS completedAt
       FROM attempts a
       JOIN quizzes q ON q.id = a.quiz_id
       WHERE a.id IN (${placeholders})
       ORDER BY a.started_at DESC`
    )
    .all(...ids);

  res.json(rows);
});

// GET /api/attempts/:attemptId — resume/state, never includes correctness
router.get('/attempts/:attemptId', (req, res) => {
  const attempt = getAttemptStmt.get(req.params.attemptId);
  if (!attempt) {
    throw new NotFoundError('Attempt not found');
  }

  const questions = getQuestionsForQuizStmt.all(attempt.quiz_id);
  const answered = new Map(
    getAnsweredMapStmt.all(attempt.id).map((row) => [row.question_id, row.choice_id])
  );

  res.json({
    attemptId: attempt.id,
    quizId: attempt.quiz_id,
    status: attempt.status,
    totalQuestions: attempt.total_questions,
    startedAt: attempt.started_at,
    completedAt: attempt.completed_at,
    questions: questions.map((question) => ({
      id: question.id,
      prompt: question.prompt,
      position: question.position,
      choices: getChoicesForQuestionStmt.all(question.id),
      answeredChoiceId: answered.get(question.id) ?? null,
    })),
  });
});

// PUT /api/attempts/:attemptId/answers/:questionId — idempotent answer submission
router.put('/attempts/:attemptId/answers/:questionId', (req, res) => {
  const { attemptId } = req.params;
  const questionId = Number(req.params.questionId);
  const choiceId = Number(req.body?.choiceId);

  if (!Number.isInteger(questionId) || !Number.isInteger(choiceId)) {
    throw new ValidationError('invalid_request', 'questionId and choiceId must be integers');
  }

  const attempt = getAttemptStmt.get(attemptId);
  if (!attempt) {
    throw new NotFoundError('Attempt not found');
  }
  if (attempt.status === 'completed') {
    throw new ConflictError('attempt_completed', 'This attempt is already completed');
  }

  const question = getQuestionStmt.get(questionId);
  if (!question || question.quiz_id !== attempt.quiz_id) {
    throw new ValidationError('invalid_question', 'Question does not belong to this attempt');
  }

  const choice = getChoiceStmt.get(choiceId);
  if (!choice || choice.question_id !== questionId) {
    throw new ValidationError('invalid_choice', 'Choice does not belong to this question');
  }

  try {
    insertAnswerStmt.run(attemptId, questionId, choiceId, choice.is_correct);
    res.status(201).json({ questionId, recorded: true });
  } catch (err) {
    if (err.code !== 'SQLITE_CONSTRAINT_UNIQUE' && err.code !== 'SQLITE_CONSTRAINT_PRIMARYKEY') {
      throw err;
    }

    const existing = getExistingAnswerStmt.get(attemptId, questionId);
    if (existing.choice_id === choiceId) {
      res.status(200).json({ questionId, recorded: true });
      return;
    }

    throw new ConflictError(
      'already_answered',
      'This question was already answered with a different choice',
      { recordedChoiceId: existing.choice_id }
    );
  }
});

// POST /api/attempts/:attemptId/complete — finalize and score, idempotent
router.post('/attempts/:attemptId/complete', (req, res) => {
  const attempt = getAttemptStmt.get(req.params.attemptId);
  if (!attempt) {
    throw new NotFoundError('Attempt not found');
  }

  if (attempt.status === 'completed') {
    res.json({
      attemptId: attempt.id,
      status: 'completed',
      score: attempt.score,
      totalQuestions: attempt.total_questions,
    });
    return;
  }

  const answers = getAllAnswersForAttemptStmt.all(attempt.id);
  if (answers.length < attempt.total_questions) {
    const questionIds = getQuestionsForQuizStmt.all(attempt.quiz_id).map((q) => q.id);
    const answeredIds = new Set(answers.map((a) => a.question_id));
    const missingQuestionIds = questionIds.filter((id) => !answeredIds.has(id));
    throw new ValidationError('incomplete', 'Not all questions have been answered', {
      missingQuestionIds,
    });
  }

  const score = computeScore(answers);
  completeAttemptStmt.run(score, attempt.id);

  res.json({ attemptId: attempt.id, status: 'completed', score, totalQuestions: attempt.total_questions });
});

// GET /api/attempts/:attemptId/results — score + correctness reveal, only once completed
router.get('/attempts/:attemptId/results', (req, res) => {
  const attempt = getAttemptStmt.get(req.params.attemptId);
  if (!attempt) {
    throw new NotFoundError('Attempt not found');
  }
  if (attempt.status !== 'completed') {
    throw new ConflictError('not_completed', 'This attempt has not been completed yet');
  }

  const questions = getQuestionsForQuizStmt.all(attempt.quiz_id);
  const answers = new Map(
    getAllAnswersForAttemptStmt.all(attempt.id).map((answer) => [answer.question_id, answer])
  );

  res.json({
    attemptId: attempt.id,
    quizId: attempt.quiz_id,
    score: attempt.score,
    totalQuestions: attempt.total_questions,
    completedAt: attempt.completed_at,
    questions: questions.map((question) => {
      const answer = answers.get(question.id);
      return {
        id: question.id,
        prompt: question.prompt,
        choices: getChoicesWithCorrectnessStmt.all(question.id).map((choice) => ({
          id: choice.id,
          label: choice.label,
          isCorrect: !!choice.is_correct,
        })),
        selectedChoiceId: answer ? answer.choice_id : null,
        wasCorrect: answer ? !!answer.is_correct : false,
      };
    }),
  });
});

export default router;
