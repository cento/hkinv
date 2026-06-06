import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography, TextField, Button, Paper, Grid, Snackbar, Alert } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { useAppContext } from '../contexts/AppContext';
import api from '../services/dbService';
import { formatError } from '../utils/validators';

export default function SettingsPage() {
  const { t } = useTranslation();
  const { setSettingsComplete } = useAppContext();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const [form, setForm] = useState({
    teacher_name: '',
    teacher_address: '',
    invoice_counter: 1,
    teacher_email: '',
    teacher_phone: '',
    br_number: '',
    invoice_prefix: 'INV-',
    default_payment_terms: '30 giorni',
    default_currency: 'HKD',
    bank_details: '',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = (await api.settingsGet()) as Record<string, any> | null;
      if (data) {
        setForm({
          teacher_name: data.teacher_name || '',
          teacher_address: data.teacher_address || '',
          teacher_email: data.teacher_email || '',
          teacher_phone: data.teacher_phone || '',
          br_number: data.br_number || '',
          invoice_prefix: data.invoice_prefix || 'INV-',
          default_payment_terms: data.default_payment_terms || '30 giorni',
            invoice_counter: data.invoice_counter || 1,
          default_currency: data.default_currency || 'HKD',
          bank_details: data.bank_details || '',
        });
      }
    } catch (err) {
      setToast({ open: true, message: formatError(err), severity: 'error' });
    }
  };

  const handleSave = async () => {
    const newErrors: Record<string, boolean> = {};
    if (!form.teacher_name.trim()) newErrors.teacher_name = true;
    if (!form.teacher_address.trim()) newErrors.teacher_address = true;
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    try {
      setSaving(true);
      await api.settingsSave({
        ...form,
        teacher_email: form.teacher_email || null,
        teacher_phone: form.teacher_phone || null,
        br_number: form.br_number || null,
        bank_details: form.bank_details || null,
      });
      setSettingsComplete(true);
      setToast({ open: true, message: t('common.save') + ' ✓', severity: 'success' });
    } catch (err: any) {
      setToast({ open: true, message: String(err), severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>{t('settings.title')}</Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>{t('settings.teacherInfo')}</Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField fullWidth label={t('wizard.teacherName')} value={form.teacher_name} onChange={e => { setForm(f => ({ ...f, teacher_name: e.target.value })); if (e.target.value.trim()) setErrors(prev => ({ ...prev, teacher_name: false })); }} required error={errors.teacher_name} helperText={errors.teacher_name ? t('validation.required') : ''} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField fullWidth label={t('wizard.teacherEmail')} value={form.teacher_email} onChange={e => setForm(f => ({ ...f, teacher_email: e.target.value }))} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField fullWidth label={t('wizard.teacherAddress')} value={form.teacher_address} onChange={e => { setForm(f => ({ ...f, teacher_address: e.target.value })); if (e.target.value.trim()) setErrors(prev => ({ ...prev, teacher_address: false })); }} required multiline rows={2} error={errors.teacher_address} helperText={errors.teacher_address ? t('validation.required') : ''} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField fullWidth label={t('wizard.teacherPhone')} value={form.teacher_phone} onChange={e => setForm(f => ({ ...f, teacher_phone: e.target.value }))} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField fullWidth label={t('wizard.brNumber')} value={form.br_number} onChange={e => setForm(f => ({ ...f, br_number: e.target.value }))} helperText={t('wizard.brNumberHelp')} />
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>{t('settings.invoiceDefaults')}</Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField fullWidth label={t('wizard.invoicePrefix')} value={form.invoice_prefix} onChange={e => setForm(f => ({ ...f, invoice_prefix: e.target.value }))} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField fullWidth label={t('wizard.paymentTerms')} value={form.default_payment_terms} onChange={e => setForm(f => ({ ...f, default_payment_terms: e.target.value }))} helperText={t('wizard.paymentTermsHelp')} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField fullWidth type="number" label={t('wizard.invoiceCounter')} value={form.invoice_counter} onChange={e => setForm(f => ({ ...f, invoice_counter: parseInt(e.target.value) || 0 }))} slotProps={{ htmlInput: { min: 1 } }} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField fullWidth label={t('wizard.bankDetails')} value={form.bank_details} onChange={e => setForm(f => ({ ...f, bank_details: e.target.value }))} multiline rows={2} />
          </Grid>
        </Grid>
      </Paper>

      

      <Button variant="contained" size="large" startIcon={<SaveIcon />} onClick={handleSave} disabled={saving || !form.teacher_name || !form.teacher_address}>
        {t('common.save')}
      </Button>

      <Snackbar open={toast.open} autoHideDuration={3000} onClose={() => setToast(t => ({ ...t, open: false }))}>
        <Alert severity={toast.severity} variant="filled">{toast.message}</Alert>
      </Snackbar>
    </Box>
  );
}
