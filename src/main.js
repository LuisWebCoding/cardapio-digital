import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.js?v=20261028-gastro';

createRoot(document.getElementById('root')).render(createElement(App));
