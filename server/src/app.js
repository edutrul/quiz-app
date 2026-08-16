import express from 'express';
import quizzesRouter from './routes/quizzes.js';
import attemptsRouter from './routes/attempts.js';
import { errorHandler } from './errors.js';

const app = express();

app.use(express.json());

app.use('/api/quizzes', quizzesRouter);
app.use('/api', attemptsRouter);

app.use(errorHandler);

export default app;
