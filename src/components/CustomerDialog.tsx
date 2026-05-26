import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid
} from '@mui/material';
import { useTranslation } from 'react-i18next';

export interface CustomerFormData {
  name: string;
  address: string;
  contact_person: string;
  email: string;
  phone: string;
  notes: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: CustomerFormData) => void;
  initial?: CustomerFormData | null;
}

const emptyForm: CustomerFormData = {
  name: '', address: '', contact_person: '', email: '', phone: '', notes: '',
};

export default function CustomerDialog({ open, onClose, onSave, initial }: Props) {
  const { t } = useTranslation();
  const [form, setForm] = useState<CustomerFormData>(emptyForm);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (open) setForm(initial || { ...emptyForm });
  }, [open, initial]);

  const handleChange = (field: keyof CustomerFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    if (e.target.value.trim()) setErrors(e => ({ ...e, [field]: false }));
  };

  const handleSave = () => {
    const newErrors: Record<string, boolean> = {};
    if (!form.name.trim()) newErrors.name = true;
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    onSave(form);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initial ? t('customers.edit') : t('customers.new')}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid size={{ xs: 12 }}>
            <TextField fullWidth label={t('customers.name')} value={form.name}
              onChange={handleChange('name')} required error={errors.name}
              helperText={errors.name ? t('validation.required') : ''} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField fullWidth label={t('customers.address')} value={form.address}
              onChange={handleChange('address')} multiline rows={2} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField fullWidth label={t('customers.contactPerson')} value={form.contact_person}
              onChange={handleChange('contact_person')} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField fullWidth label={t('customers.email')} value={form.email}
              onChange={handleChange('email')} type="email" />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField fullWidth label={t('customers.phone')} value={form.phone}
              onChange={handleChange('phone')} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField fullWidth label={t('customers.notes')} value={form.notes}
              onChange={handleChange('notes')} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button variant="contained" onClick={handleSave}>{t('common.save')}</Button>
      </DialogActions>
    </Dialog>
  );
}
