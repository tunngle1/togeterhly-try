import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // Импорт Tailwind стилей

console.log('[TOGETHERLY] index.tsx loaded');

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
console.log('[TOGETHERLY] Rendering App component...');
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);