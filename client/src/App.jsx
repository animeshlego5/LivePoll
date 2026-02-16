import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CreatePoll from './pages/CreatePoll';
import ViewPoll from './pages/ViewPoll';

function App() {
  return (
    <Router>
      <div className="app">
        <header className="app-header">
          <a href="/" className="logo">
            <span className="logo-icon">📊</span>
            <span className="logo-text">LivePoll</span>
          </a>
        </header>
        <main className="app-main">
          <Routes>
            <Route path="/" element={<CreatePoll />} />
            <Route path="/poll/:id" element={<ViewPoll />} />
          </Routes>
        </main>
        <footer className="app-footer">
          <p>Real-time polling — share, vote, see results live.</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
