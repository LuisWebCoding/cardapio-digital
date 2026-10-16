import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { AdminApp } from './AdminApp.js?v=20261016-qa2';

createRoot(document.getElementById('root')).render(createElement(AdminApp));
