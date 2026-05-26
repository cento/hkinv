import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Paper, Grid, Tabs, Tab, Snackbar, Alert } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import api from '../services/ipc';
import CustomerDialog, { CustomerFormData } from '../components/CustomerDialog';
import CustomerRatesTable from '../components/CustomerRatesTable';

export default function CustomerDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const customerId = parseInt(id || '0');
  const [customer, setCustomer] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [tab, setTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const loadData = useCallback(async () => {
    if (!customerId) return;
    try {
      const [c, inv] = await Promise.all([
        api.customersGetById(customerId),
        api.invoicesSearch({ customerId }),
      ]);
      setCustomer(c);
      setInvoices(inv as any[]);
    } catch (err) {
      console.error(err);
    }
  }, [customerId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleEditSave = async (data: CustomerFormData) => {
    try {
      await api.customersUpdate(customerId, data as unknown as Record<string, unknown>);
      setDialogOpen(false);
      await loadData();
      setToast({ open: true, message: t('common.save') + ' ✓', severity: 'success' });
    } catch (err: any) {
      setToast({ open: true, message: String(err), severity: 'error' });
    }
  };

  if (!customer) return <Typography>{t('common.loading')}</Typography>;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/customers')}>
          {t('common.back')}
        </Button>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>{customer.name}</Typography>
        <Button startIcon={<EditIcon />} onClick={() => setDialogOpen(true)}>
          {t('common.edit')}
        </Button>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="caption" color="text.secondary">{t('customers.address')}</Typography>
            <Typography>{customer.address || '-'}</Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <Typography variant="caption" color="text.secondary">{t('customers.contactPerson')}</Typography>
            <Typography>{customer.contact_person || '-'}</Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <Typography variant="caption" color="text.secondary">{t('customers.phone')}</Typography>
            <Typography>{customer.phone || '-'}</Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="caption" color="text.secondary">{t('customers.email')}</Typography>
            <Typography>{customer.email || '-'}</Typography>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Typography variant="caption" color="text.secondary">{t('customers.notes')}</Typography>
            <Typography>{customer.notes || '-'}</Typography>
          </Grid>
        </Grid>
      </Paper>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label={t('customerRates.title')} />
          <Tab label={`${t('invoices.title')} (${invoices.length})`} />
        </Tabs>
      </Box>

      {tab === 0 && (
        <CustomerRatesTable customerId={customerId} />
      )}

      {tab === 1 && (
        <Box>
          {invoices.length === 0 ? (
            <Typography color="text.secondary">{t('common.noData')}</Typography>
          ) : (
            invoices.map(inv => (
              <Paper key={inv.id} sx={{ p: 2, mb: 1, cursor: 'pointer' }}
                onClick={() => navigate(`/invoices/${inv.id}`)}>
                <Typography><strong>{inv.invoice_number}</strong></Typography>
                <Typography variant="body2" color="text.secondary">
                  {inv.issue_date} — {inv.total?.toFixed(2)} HKD — {t(`invoices.${inv.status}`)}
                </Typography>
              </Paper>
            ))
          )}
        </Box>
      )}

      <CustomerDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleEditSave}
        initial={{
          name: customer.name,
          address: customer.address || '',
          contact_person: customer.contact_person || '',
          email: customer.email || '',
          phone: customer.phone || '',
          notes: customer.notes || '',
        }}
      />

      <Snackbar open={toast.open} autoHideDuration={3000}
        onClose={() => setToast(t => ({ ...t, open: false }))}>
        <Alert severity={toast.severity} variant="filled">{toast.message}</Alert>
      </Snackbar>
    </Box>
  );
}
