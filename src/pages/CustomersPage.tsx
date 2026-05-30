import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography, Button, Snackbar, Alert } from '@mui/material';
import { DataGrid, GridColDef, GridRowParams } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import api from '../services/dbService';
import CustomerDialog, { CustomerFormData } from '../components/CustomerDialog';
import ConfirmDialog, { EmptyState } from '../components/ConfirmDialog';

export default function CustomersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<any>(null);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.customersGetAll();
      setCustomers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCustomers(); }, [loadCustomers]);

  const handleSave = async (data: CustomerFormData) => {
    try {
      if (editCustomer) {
        await api.customersUpdate(editCustomer.id, data as unknown as Record<string, unknown>);
      } else {
        await api.customersCreate(data as unknown as Record<string, unknown>);
      }
      setDialogOpen(false);
      setEditCustomer(null);
      await loadCustomers();
      setToast({ open: true, message: t('common.save') + ' ✓', severity: 'success' });
    } catch (err: any) {
      setToast({ open: true, message: String(err), severity: 'error' });
    }
  };

  const handleRowClick = (params: GridRowParams) => {
    navigate(`/customers/${params.id}`);
  };

  const columns: GridColDef[] = [
    { field: 'name', headerName: t('customers.name'), flex: 2 },
    { field: 'email', headerName: t('customers.email'), flex: 1.5 },
    { field: 'phone', headerName: t('customers.phone'), flex: 1 },
    { field: 'contact_person', headerName: t('customers.contactPerson'), flex: 1.5 },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">{t('customers.title')}</Typography>
        <Button variant="contained" startIcon={<AddIcon />}
          onClick={() => { setEditCustomer(null); setDialogOpen(true); }}>
          {t('customers.new')}
        </Button>
      </Box>
      <Box sx={{ height: 500 }}>
        <DataGrid
          rows={customers}
          columns={columns}
          loading={loading}
          pageSizeOptions={[25, 50]}
          disableRowSelectionOnClick
          onRowClick={handleRowClick}
          slots={{ noRowsOverlay: EmptyState }}
          slotProps={{ noRowsOverlay: { message: t('customers.noCustomers'), actionLabel: t('customers.new'), onAction: () => { setEditCustomer(null); setDialogOpen(true); } } as any }}
        />
      </Box>

      <CustomerDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditCustomer(null); }}
        onSave={handleSave}
        initial={editCustomer}
      />

      <Snackbar open={toast.open} autoHideDuration={3000}
        onClose={() => setToast(t => ({ ...t, open: false }))}>
        <Alert severity={toast.severity} variant="filled">{toast.message}</Alert>
      </Snackbar>
    </Box>
  );
}
