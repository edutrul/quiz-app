export interface Quiz {
  id: number;
  title: string;
  description: string | null;
  questionCount: number;
}

export interface AttemptStart {
  attemptId: string;
  quizId: number;
  status: 'in_progress' | 'completed';
  totalQuestions: number;
  startedAt: string;
}

export interface Choice {
  id: number;
  label: string;
}

export interface QuestionResume {
  id: number;
  prompt: string;
  position: number;
  choices: Choice[];
  answeredChoiceId: number | null;
}

export interface AttemptState {
  attemptId: string;
  quizId: number;
  status: 'in_progress' | 'completed';
  totalQuestions: number;
  startedAt: string;
  completedAt: string | null;
  questions: QuestionResume[];
}

export interface SubmitAnswerResponse {
  questionId: number;
  recorded: boolean;
}

export interface CompleteAttemptResponse {
  attemptId: string;
  status: 'completed';
  score: number;
  totalQuestions: number;
}

export interface ResultChoice {
  id: number;
  label: string;
  isCorrect: boolean;
}

export interface ResultQuestion {
  id: number;
  prompt: string;
  choices: ResultChoice[];
  selectedChoiceId: number | null;
  wasCorrect: boolean;
}

export interface AttemptResults {
  attemptId: string;
  quizId: number;
  score: number;
  totalQuestions: number;
  completedAt: string;
  questions: ResultQuestion[];
}

export interface HistoryEntry {
  attemptId: string;
  quizId: number;
  quizTitle: string;
  status: 'in_progress' | 'completed';
  score: number | null;
  totalQuestions: number;
  startedAt: string;
  completedAt: string | null;
}
