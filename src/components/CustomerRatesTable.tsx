import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Select, MenuItem, FormControl, InputLabel,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Snackbar, Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useTranslation } from 'react-i18next';
import api from '../services/dbService';
import { formatError } from '../utils/validators';
import { formatHKD } from '../utils/format';
import ConfirmDialog from './ConfirmDialog';

interface Props {
  customerId: number;
}

interface Rate {
  id: number;
  service_type_id: number;
  custom_rate: number;
  custom_description: string | null;
  service_name: string;
}

export default function CustomerRatesTable({ customerId }: Props) {
  const { t } = useTranslation();
  const [rates, setRates] = useState<Rate[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<number | ''>('');
  const [customRate, setCustomRate] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [r, s] = await Promise.all([
        api.customerRatesGetAllForCustomer(customerId),
        api.serviceTypesGetAll(),
      ]);
      setRates(r as Rate[]);
      setServices(s as any[]);
    } catch (err) {
      setToast({ open: true, message: formatError(err), severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    loadData();
  }, [customerId, loadData]);

  const handleAdd = async () => {
    if (!selectedService || !customRate) return;
    try {
      await api.customerRatesSet(customerId, selectedService as number, parseFloat(customRate));
      setDialogOpen(false);
      setSelectedService('');
      setCustomRate('');
      await loadData();
      setToast({ open: true, message: t('common.save') + ' ✓', severity: 'success' });
    } catch (err: any) {
      setToast({ open: true, message: String(err), severity: 'error' });
    }
  };

  const handleDelete = async (id: number) => {
    setDeleteConfirm(id);
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirm === null) return;
    try {
      await api.customerRatesDelete(deleteConfirm);
      setDeleteConfirm(null);
      await loadData();
    } catch (err: any) {
      setDeleteConfirm(null);
      setToast({ open: true, message: String(err), severity: 'error' });
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">{t('customerRates.title')}</Typography>
        <Button size="small" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
          {t('customerRates.new')}
        </Button>
      </Box>

      {rates.length === 0 && !loading ? (
        <Typography color="text.secondary" variant="body2">{t('common.noData')}</Typography>
      ) : rates.length === 0 ? null : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('customerRates.service')}</TableCell>
                <TableCell align="right">{t('customerRates.rate')}</TableCell>
                <TableCell align="center">{t('common.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rates.map(rate => (
                <TableRow key={rate.id}>
                  <TableCell>{rate.service_name}</TableCell>
                  <TableCell align="right">{formatHKD(rate.custom_rate)}</TableCell>
                  <TableCell align="center">
                    <IconButton size="small" color="error" onClick={() => handleDelete(rate.id)} aria-label={t('common.delete')}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('customerRates.new')}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>{t('customerRates.service')}</InputLabel>
            <Select value={selectedService} label={t('customerRates.service')}
              onChange={e => setSelectedService(Number(e.target.value) || '')}>
              {services.map(s => (
                <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField fullWidth label={t('customerRates.rate')} value={customRate}
            onChange={e => setCustomRate(e.target.value)} type="number" sx={{ mt: 2 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleAdd}
            disabled={!selectedService || !customRate}>{t('common.save')}</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={3000} onClose={() => setToast(t => ({ ...t, open: false }))}>
        <Alert severity={toast.severity} variant="filled">{toast.message}</Alert>
      </Snackbar>

      <ConfirmDialog
        open={deleteConfirm !== null}
        title={t('common.delete')}
        message={t('customerRates.deleteConfirm') || 'Delete this custom rate?'}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        confirmColor="error"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirm(null)}
      />
    </Box>
  );
}
