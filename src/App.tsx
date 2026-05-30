import React, { useMemo, lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, CircularProgress, Box } from '@mui/material';
import { useAppContext } from './contexts/AppContext';
import { getTheme } from './theme';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import WelcomePage from './pages/WelcomePage';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const InvoicesPage = lazy(() => import('./pages/InvoicesPage'));
const InvoiceEditPage = lazy(() => import('./pages/InvoiceEditPage'));
const CustomersPage = lazy(() => import('./pages/CustomersPage'));
const CustomerDetailPage = lazy(() => import('./pages/CustomerDetailPage'));
const ServiceTypesPage = lazy(() => import('./pages/ServiceTypesPage'));
const TaxReportsPage = lazy(() => import('./pages/TaxReportsPage'));
const CloudBackupPage = lazy(() => import('./pages/CloudBackupPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

function PageLoader() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
      <CircularProgress />
    </Box>
  );
}

function AppRoutes() {
  const { state } = useAppContext();

  if (!state.isDbOpen) {
    return <WelcomePage />;
  }

  return (
    <Layout>
      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/invoices" element={<InvoicesPage />} />
          <Route path="/invoices/new" element={<InvoiceEditPage />} />
          <Route path="/invoices/:id/edit" element={<InvoiceEditPage />} />
          <Route path="/invoices/:id" element={<InvoiceEditPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/customers/:id" element={<CustomerDetailPage />} />
          <Route path="/service-types" element={<ServiceTypesPage />} />
          <Route path="/tax-reports" element={<TaxReportsPage />} />
          <Route path="/cloud-backup" element={<CloudBackupPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

export default function App() {
  const { state } = useAppContext();
  const theme = useMemo(() => getTheme(state.isDarkMode), [state.isDarkMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </ThemeProvider>
  );
}
