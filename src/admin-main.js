import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { AdminApp } from './AdminApp.js?v=20261016-photos';

createRoot(document.getElementById('root')).render(createElement(AdminApp));
