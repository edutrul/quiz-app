CREATE TABLE IF NOT EXISTS quizzes (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT NOT NULL,
  description TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS questions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  quiz_id     INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  prompt      TEXT NOT NULL,
  position    INTEGER NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_questions_quiz ON questions(quiz_id);

CREATE TABLE IF NOT EXISTS choices (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  label       TEXT NOT NULL,
  is_correct  INTEGER NOT NULL DEFAULT 0 CHECK (is_correct IN (0,1)),
  position    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_choices_question ON choices(question_id);

CREATE TABLE IF NOT EXISTS attempts (
  id               TEXT PRIMARY KEY,
  quiz_id          INTEGER NOT NULL REFERENCES quizzes(id),
  status           TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','completed')),
  total_questions  INTEGER NOT NULL,
  score            INTEGER,
  started_at       TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at     TEXT
);
CREATE INDEX IF NOT EXISTS idx_attempts_quiz ON attempts(quiz_id);

CREATE TABLE IF NOT EXISTS attempt_answers (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  attempt_id   TEXT NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  question_id  INTEGER NOT NULL REFERENCES questions(id),
  choice_id    INTEGER NOT NULL REFERENCES choices(id),
  is_correct   INTEGER NOT NULL CHECK (is_correct IN (0,1)),
  answered_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (attempt_id, question_id)
);
CREATE INDEX IF NOT EXISTS idx_attempt_answers_attempt ON attempt_answers(attempt_id);
