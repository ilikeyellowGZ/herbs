import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles.css';
import './collection.css';

if (import.meta.env.DEV && import.meta.env.VITE_REACT_TOOLS !== 'false') {
  void import('react-grab');
  void import('react-scan');
}

const root = document.getElementById('root')!;
const application = <React.StrictMode><BrowserRouter><App /></BrowserRouter></React.StrictMode>;
if (root.hasChildNodes()) ReactDOM.hydrateRoot(root, application);
else ReactDOM.createRoot(root).render(application);
