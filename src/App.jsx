import React from 'react';
import { lazy, Suspense } from 'react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import Navigation from './components/Navigation.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import LoginPage from './pages/LoginPage.jsx';
import EventsPage from './pages/EventsPage.jsx';
import MyTicketsPage from './pages/MyTicketsPage.jsx';

const OrganizerPanel = lazy(() => import('./pages/OrganizerPanel.jsx'));
function AppRoutes() {
  return (
    <main className="app-shell">
      <header className="site-header">
        <Link className="brand" to="/">EventHub<span>.</span></Link>
        <Navigation />
      </header>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/events" element={<EventsPage />} />
          <Route path="/my-tickets" element={<MyTicketsPage />} />
          <Route element={<ProtectedRoute requiredRole="organizer" />}>
            <Route path="/organizer" element={<Suspense fallback={<p>Loading organizer panel…</p>}><OrganizerPanel /></Suspense>} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
  );
}

export default function App() {
  return <AuthProvider><AppRoutes /></AuthProvider>;
}




