import { Link, Route, Routes } from 'react-router-dom';
import { QuizListPage } from './pages/QuizListPage';
import { QuizAttemptPage } from './pages/QuizAttemptPage';
import { ResultsPage } from './pages/ResultsPage';
import { HistoryPage } from './pages/HistoryPage';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <Link to="/" className="app-title">
          Quiz App
        </Link>
        <nav>
          <Link to="/history">History</Link>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<QuizListPage />} />
          <Route path="/quiz/:quizId/attempt" element={<QuizAttemptPage />} />
          <Route path="/results/:attemptId" element={<ResultsPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
