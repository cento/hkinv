import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Grid, Card, CardContent, Button, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArchiveIcon from '@mui/icons-material/Archive';
import BackupIcon from '@mui/icons-material/Backup';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PeopleIcon from '@mui/icons-material/People';
import PaymentsIcon from '@mui/icons-material/Payments';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import api from '../services/dbService';
import { EmptyState } from '../components/ConfirmDialog';
import { useAppContext } from '../contexts/AppContext';
import { getBackupFileName, isBackupConfigured } from '../database/backup';

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color?: string }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ color: color || 'primary.main', display: 'flex' }}>{icon}</Box>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>{value}</Typography>
          <Typography variant="body2" color="text.secondary">{label}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { state } = useAppContext();
  const archiveName = state.dbPath || '-';
  const backupName = isBackupConfigured() ? getBackupFileName() : null;
  const [stats, setStats] = useState<Record<string, number>>({
    totalInvoices: 0,
    totalDraft: 0,
    totalSent: 0,
    totalPaid: 0,
    totalOverdue: 0,
    monthlyTotal: 0,
    customerCount: 0,
  });
  const [overdueInvoices, setOverdueInvoices] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      const invoices = (await api.invoicesGetAll()) as Record<string, any>[];
      const customers = (await api.customersGetAll()) as Record<string, any>[];
      const today = new Date().toISOString().split('T')[0];

      const allInvoices = invoices || [];
      const allCustomers = customers || [];

      const totalInvoices = allInvoices.length;
      const totalDraft = allInvoices.filter((i: any) => i.status === 'draft').length;
      const totalSent = allInvoices.filter((i: any) => i.status === 'sent').length;
      const totalPaid = allInvoices.filter((i: any) => i.status === 'paid').length;
      const overdue = allInvoices.filter((i: any) =>
        i.status === 'sent' && i.due_date && i.due_date < today
      );
      const monthlyTotal = allInvoices
        .filter((i: any) => i.status === 'paid' || i.status === 'sent')
        .reduce((sum: number, i: any) => sum + (i.total || 0), 0);

      setStats({
        totalInvoices,
        totalDraft,
        totalSent,
        totalPaid,
        totalOverdue: overdue.length,
        monthlyTotal,
        customerCount: allCustomers.length,
      });
      setOverdueInvoices(overdue);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">{t('dashboard.title')}</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/invoices/new')}>
          {t('invoices.new')}
        </Button>
      </Box>

      <Paper variant="outlined" sx={{ p: 1.5, mb: 3, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ArchiveIcon fontSize="small" color="action" />
          <Typography variant="body2" color="text.secondary">
            {t('dashboard.archive')}: <strong>{archiveName}</strong>
          </Typography>
        </Box>
        {backupName && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BackupIcon fontSize="small" color="success" />
            <Typography variant="body2" color="text.secondary">
              {t('dashboard.backup')}: <strong>{backupName}</strong>
            </Typography>
          </Box>
        )}
      </Paper>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard icon={<ReceiptLongIcon sx={{ fontSize: 40 }} />} label={t('dashboard.totalInvoices')} value={stats.totalInvoices} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard icon={<PaymentsIcon sx={{ fontSize: 40 }} />} label={t('dashboard.monthlyTotal')} value={`${stats.monthlyTotal.toFixed(0)} HKD`} color="success.main" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard icon={<PeopleIcon sx={{ fontSize: 40 }} />} label={t('dashboard.customers')} value={stats.customerCount} />
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <StatCard icon={<ReceiptLongIcon />} label={t('invoices.draft')} value={stats.totalDraft} />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <StatCard icon={<ReceiptLongIcon />} label={t('invoices.sent')} value={stats.totalSent} color="primary.main" />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <StatCard icon={<ReceiptLongIcon />} label={t('invoices.paid')} value={stats.totalPaid} color="success.main" />
        </Grid>
      </Grid>

      {!loading && stats.totalInvoices === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <EmptyState
            message={t('dashboard.emptyMessage') || 'No invoices yet. Create your first invoice to get started!'}
            actionLabel={t('invoices.new')}
            onAction={() => navigate('/invoices/new')}
          />
        </Paper>
      )}

      {overdueInvoices.length > 0 && (
        <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ mb: 3 }}
          action={
            <Button size="small" onClick={() => navigate('/invoices')}>
              {t('common.view') || 'View'}
            </Button>
          }
        >
          <Typography variant="body2">
            {t('dashboard.overdueWarning', { count: overdueInvoices.length })}
          </Typography>
        </Alert>
      )}

      {overdueInvoices.length > 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>{t('dashboard.overdueList')}</Typography>
          {overdueInvoices.slice(0, 5).map((inv: any) => (
            <Box key={inv.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, cursor: 'pointer' }}
              onClick={() => navigate(`/invoices/${inv.id}`)}>
              <Typography variant="body2">{inv.invoice_number} — {inv.customer_name || `#${inv.customer_id}`}</Typography>
              <Typography variant="body2" color="error">
                {t('invoices.dueDate')}: {inv.due_date} — {inv.total?.toFixed(2)} HKD
              </Typography>
            </Box>
          ))}
        </Paper>
      )}
    </Box>
  );
}