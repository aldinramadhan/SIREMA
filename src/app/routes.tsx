import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { MainApp } from './components/MainApp';

// We use a wrapper component to hold all state at the top level
export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainApp />,
    children: [
      { index: true, id: 'dashboard' },
      { path: 'retensi', id: 'retensi' },
      { path: 'mahasiswa', id: 'mahasiswa' },
      { path: 'log-import', id: 'log-import' },
    ],
  },
]);
