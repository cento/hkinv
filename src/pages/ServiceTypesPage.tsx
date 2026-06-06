import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography, Button, Snackbar, Alert } from '@mui/material';
import { DataGrid, GridColDef, GridRowParams } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import api from '../services/dbService';
import { formatError } from '../utils/validators';
import { formatHKD } from '../utils/format';
import ServiceTypeDialog, { ServiceTypeFormData } from '../components/ServiceTypeDialog';
import ConfirmDialog, { EmptyState } from '../components/ConfirmDialog';

export default function ServiceTypesPage() {
  const { t } = useTranslation();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editService, setEditService] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const loadServices = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.serviceTypesGetAll();
      setServices(data);
    } catch (err) {
      setToast({ open: true, message: formatError(err), severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadServices(); }, [loadServices]);

  const handleSave = async (data: ServiceTypeFormData) => {
    try {
      if (editService) {
        await api.serviceTypesUpdate(editService.id, data);
      } else {
        await api.serviceTypesCreate(data);
      }
      setDialogOpen(false);
      setEditService(null);
      await loadServices();
      setToast({ open: true, message: t('common.save') + ' ✓', severity: 'success' });
    } catch (err: unknown) {
      setToast({ open: true, message: String(err), severity: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      const inUse = await api.serviceTypesIsInUse(deleteConfirm.id);
      if (inUse) {
        setToast({ open: true, message: t('serviceTypes.inUse'), severity: 'error' });
        setDeleteConfirm(null);
        return;
      }
      await api.serviceTypesDelete(deleteConfirm.id);
      setDeleteConfirm(null);
      await loadServices();
      setToast({ open: true, message: t('common.delete') + ' ✓', severity: 'success' });
    } catch (err: unknown) {
      setDeleteConfirm(null);
      setToast({ open: true, message: String(err), severity: 'error' });
    }
  };

  const handleRowClick = (params: GridRowParams) => {
    const s = params.row as any;
    setEditService(s);
    setDialogOpen(true);
  };

  const columns: GridColDef[] = [
    { field: 'name', headerName: t('serviceTypes.name'), flex: 2 },
    { field: 'description_template', headerName: t('serviceTypes.description'), flex: 2 },
    {
      field: 'default_rate', headerName: t('serviceTypes.rate'), flex: 1,
      valueFormatter: (val: number) => formatHKD(val || 0),
    },
    { field: 'default_hours', headerName: t('serviceTypes.hours'), flex: 0.5 },
    {
      field: 'actions', headerName: t('common.actions'), flex: 0.5, sortable: false,
      renderCell: (params) => (
        <Button size="small" color="error" onClick={(e) => {
          e.stopPropagation();
          setDeleteConfirm(params.row);
        }}>
          {t('common.delete')}
        </Button>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">{t('serviceTypes.title')}</Typography>
        <Button variant="contained" startIcon={<AddIcon />}
          onClick={() => { setEditService(null); setDialogOpen(true); }}>
          {t('serviceTypes.new')}
        </Button>
      </Box>

      <Box sx={{ height: 'calc(100vh - 280px)' }}>
        <DataGrid
          rows={services}
          columns={columns}
          loading={loading}
          pageSizeOptions={[25, 50, 100]}
          disableRowSelectionOnClick
          onRowClick={handleRowClick}
          slots={{ noRowsOverlay: EmptyState }}
          slotProps={{ noRowsOverlay: { message: t('serviceTypes.noServices'), actionLabel: t('serviceTypes.new'), onAction: () => { setEditService(null); setDialogOpen(true); } } as any }}
        />
      </Box>

      <ServiceTypeDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditService(null); }}
        onSave={handleSave}
        initial={editService}
      />

      <ConfirmDialog
        open={!!deleteConfirm}
        title={t('serviceTypes.deleteConfirm')}
        message={deleteConfirm?.name || ''}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
      />

      <Snackbar open={toast.open} autoHideDuration={3000}
        onClose={() => setToast(t => ({ ...t, open: false }))}>
        <Alert severity={toast.severity} variant="filled">{toast.message}</Alert>
      </Snackbar>
    </Box>
  );
}