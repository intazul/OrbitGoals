import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// Prevent unhandled browser or iframe script errors from causing crash notifications
window.addEventListener('error', (event) => {
  if (event.message === 'Script error.' || !event.message) {
    console.warn('Handled cross-origin script event:', event);
    event.preventDefault();
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.warn('Handled promise rejection:', event.reason);
  event.preventDefault();
});

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
