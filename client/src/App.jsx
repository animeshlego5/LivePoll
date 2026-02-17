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
          <div className="footer-links">
            <a
              href="https://github.com/animeshlego5/LivePoll"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link source-code"
            >
              <span className="icon">📂</span> Source Code
            </a>
            <span className="separator">•</span>
            <span className="credits">
              Created by <a
                href="https://animeshlego5.github.io/animesh-portfolio/"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link portfolio-link"
              >
                Animesh
              </a>
            </span>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
