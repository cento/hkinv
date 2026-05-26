import React, { useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { useAppContext } from './contexts/AppContext';
import { getTheme } from './theme';
import Layout from './components/Layout';
import WelcomePage from './pages/WelcomePage';
import DashboardPage from './pages/DashboardPage';
import InvoicesPage from './pages/InvoicesPage';
import InvoiceEditPage from './pages/InvoiceEditPage';
import CustomersPage from './pages/CustomersPage';
import CustomerDetailPage from './pages/CustomerDetailPage';
import ServiceTypesPage from './pages/ServiceTypesPage';
import SettingsPage from './pages/SettingsPage';

function AppRoutes() {
  const { state } = useAppContext();

  // If no DB is open, just show the welcome page without layout
  if (!state.isDbOpen) {
    return <WelcomePage />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/invoices" element={<InvoicesPage />} />
        <Route path="/invoices/new" element={<InvoiceEditPage />} />
        <Route path="/invoices/:id" element={<InvoiceEditPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/customers/:id" element={<CustomerDetailPage />} />
        <Route path="/service-types" element={<ServiceTypesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  const { state } = useAppContext();
  const theme = useMemo(() => getTheme(state.isDarkMode), [state.isDarkMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ThemeProvider>
  );
}
