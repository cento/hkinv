import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid
} from '@mui/material';
import { useTranslation } from 'react-i18next';

export interface ServiceTypeFormData {
  name: string;
  description_template: string;
  default_rate: number;
  default_hours: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: ServiceTypeFormData) => void;
  initial?: ServiceTypeFormData | null;
}

const emptyForm: ServiceTypeFormData = {
  name: '', description_template: '', default_rate: 0, default_hours: 1,
};

export default function ServiceTypeDialog({ open, onClose, onSave, initial }: Props) {
  const { t } = useTranslation();
  const [form, setForm] = useState<ServiceTypeFormData>(emptyForm);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (open) setForm(initial || { ...emptyForm });
  }, [open, initial]);

  const handleChange = (field: keyof ServiceTypeFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = field === 'default_rate' || field === 'default_hours'
      ? parseFloat(e.target.value) || 0
      : e.target.value;
    setForm(f => ({ ...f, [field]: value }));
  };

  const handleSave = () => {
    const newErrors: Record<string, boolean> = {};
    if (!form.name.trim()) newErrors.name = true;
    if (form.default_rate <= 0) newErrors.default_rate = true;
    if (form.default_hours <= 0) newErrors.default_hours = true;
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    onSave(form);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initial ? t('serviceTypes.edit') : t('serviceTypes.new')}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid size={{ xs: 12 }}>
            <TextField fullWidth label={t('serviceTypes.name')} value={form.name}
              onChange={handleChange('name')} required error={errors.name}
              helperText={errors.name ? t('validation.required') : ''} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField fullWidth label={t('serviceTypes.description')} value={form.description_template}
              onChange={handleChange('description_template')} multiline rows={2} />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField fullWidth label={t('serviceTypes.rate')} value={form.default_rate}
              onChange={handleChange('default_rate')} type="number" required
              error={errors.default_rate}
              helperText={errors.default_rate ? t('validation.positive') : ''} />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField fullWidth label={t('serviceTypes.hours')} value={form.default_hours}
              onChange={handleChange('default_hours')} type="number" required
              error={errors.default_hours}
              helperText={errors.default_hours ? t('validation.positive') : ''} />
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
