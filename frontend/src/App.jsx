import { useRef } from 'react';
import logo from '../../public/images/logo1.png';
import './App.css';
import { Account } from './account/Account.jsx';

/** @param {{onAccountNavigate: (event: import('react').MouseEvent<HTMLAnchorElement>) => void}} props */
function Welcome({ onAccountNavigate }) {
  return (
    <section className="welcome" aria-labelledby="welcome-title">
      <div>
        <p className="eyebrow">A little courage. A meaningful connection.</p>
        <h1 id="welcome-title">Begin the conversations that matter most.</h1>
        <p className="intro">
          Welcome to CallingIn, a space being built to help you find the words,
          while keeping your voice.
        </p>
        <p className="description">
          Our vision is AI-assisted communication that supports thoughtful
          expression and respects each person’s choice to connect.
        </p>
        <a className="learn-link" href="#account" onClick={onAccountNavigate}>
          Go to your account <span aria-hidden="true">↓</span>
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
  );
}

function App() {
  const navigationRef = useRef(/** @type {(() => void) | null} */ (null));
  /** @param {import('react').MouseEvent<HTMLAnchorElement>} event */
  function onAccountNavigate(event) {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    if (navigationRef.current) {
      event.preventDefault();
      navigationRef.current();
    }
  }
  return (
    <div className="page">
      <header className="header">
        <a className="wordmark" href="/" aria-label="CallingIn home">
          Calling<span>In</span>
        </a>
        <a className="learn-link" href="#account" onClick={onAccountNavigate}>
          Your account
        </a>
      </header>
      <main>
        <Welcome onAccountNavigate={onAccountNavigate} />
        <div id="account">
          <Account navigationRef={navigationRef} />
        </div>
      </main>
      <footer className="site-footer">© 2026 CallingIn</footer>
    </div>
  );
}

export default App;
