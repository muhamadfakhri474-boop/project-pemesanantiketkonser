import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { useRealtimeStore } from './store/realtimeStore';
import AdminLayout from './layouts/AdminLayout';
import LoginPage from './pages/Login/LoginPage';
import LandingPage from './pages/Landing/LandingPage';
import DashboardPage from './pages/Dashboard/DashboardPage';

import EventsPage from './pages/Events/EventsPage';
import ArtistsPage from './pages/Artists/ArtistsPage';
import TicketCategoriesPage from './pages/TicketCategories/TicketCategoriesPage';
import OrdersPage from './pages/Orders/OrdersPage';
import PaymentsPage from './pages/Payments/PaymentsPage';
import ProfilePage from './pages/Profile/ProfilePage';

export default function App() {
  const loadFromStorage = useAuthStore((s) => s.loadFromStorage);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const connectSocket = useRealtimeStore((s) => s.connect);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (isAuthenticated) {
      connectSocket();
    }
  }, [isAuthenticated, connectSocket]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AdminLayout />}>
          <Route path="admin" element={<DashboardPage />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="artists" element={<ArtistsPage />} />
          <Route path="categories" element={<TicketCategoriesPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}