import { Router } from 'express';
import db from '../db.js';

const router = Router();

const listQuizzesStmt = db.prepare(`
  SELECT q.id, q.title, q.description, COUNT(qu.id) AS questionCount
  FROM quizzes q
  LEFT JOIN questions qu ON qu.quiz_id = q.id
  GROUP BY q.id
  ORDER BY q.created_at ASC
`);

router.get('/', (req, res) => {
  const rows = listQuizzesStmt.all();
  res.json(
    rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      questionCount: row.questionCount,
    }))
  );
});

export default router;
