import { useEffect, useState } from 'react';
import logo from '../../public/images/logo1.png';
import './App.css';

function App() {
  const [connection, setConnection] = useState('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    let active = true;

    async function checkHealth() {
      try {
        const response = await fetch('/api/health', {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('Health request failed');
        const data = await response.json();
        if (data.status !== 'ok') throw new Error('Unexpected health response');
        if (active) setConnection('connected');
      } catch {
        if (active) setConnection('error');
      } finally {
        clearTimeout(timeout);
      }
    }

    checkHealth();
    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [attempt]);

  const messages = {
    loading: 'Checking the connection…',
    connected: 'Backend connected. The application foundation is ready.',
    error: 'Unable to reach the backend. Please try again.',
  };

  return (
    <div className="page">
      <header className="header">
        <a className="wordmark" href="/" aria-label="CallingIn home">
          Calling<span>In</span>
        </a>
        <span className="project-label">A project in progress</span>
      </header>
      <main>
        <section className="welcome" aria-labelledby="welcome-title">
          <div>
            <p className="eyebrow">
              A little courage. A meaningful connection.
            </p>
            <h1 id="welcome-title">
              Begin the conversations that matter most.
            </h1>
            <p className="intro">
              Welcome to CallingIn — a space being built to help you find the
              words, while keeping your voice.
            </p>
            <p className="description">
              Our vision is AI-assisted communication that supports thoughtful
              expression and respects each person’s choice to connect.
            </p>
            <a className="learn-link" href="#project-status">
              See where we are <span aria-hidden="true">↓</span>
            </a>
          </div>
          <img
            className="brand-image"
            src={logo}
            alt="CallingIn: two people joined by a heart"
            width="1254"
            height="1254"
          />
        </section>
        <section
          className="project-status"
          id="project-status"
          aria-labelledby="status-title"
        >
          <div>
            <p className="eyebrow">Sprint 1 · Foundation</p>
            <h2 id="status-title">Every conversation starts somewhere.</h2>
            <p>
              This starter connects our welcome page to the backend. AI
              assistance, accounts, invitations, and messaging are planned and
              are not available yet.
            </p>
          </div>
          <div className="connection-panel">
            <h3>Connection status</h3>
            <p className={`connection ${connection}`} role="status">
              {messages[connection]}
            </p>
            <button
              type="button"
              disabled={connection === 'loading'}
              onClick={() => {
                setConnection('loading');
                setAttempt((value) => value + 1);
              }}
            >
              {connection === 'loading' ? 'Checking…' : 'Check again'}
            </button>
          </div>
        </section>
      </main>
      <footer>
        CallingIn · CS 8674 · Fall 2026{' '}
        <span>Thoughtful words. Your choice.</span>
      </footer>
    </div>
  );
}

export default App;
