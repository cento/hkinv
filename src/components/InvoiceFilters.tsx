import React, { useState } from 'react';
import {
  Box, TextField, Select, MenuItem, FormControl, InputLabel,
  Button, Autocomplete, Paper, Collapse,
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useTranslation } from 'react-i18next';

export interface FilterValues {
  dateFrom: string;
  dateTo: string;
  customerId: number | null;
  status: string;
  invoiceNumberSearch: string;
  minAmount: string;
  maxAmount: string;
}

interface Props {
  values: FilterValues;
  onChange: (values: FilterValues) => void;
  customers: { id: number; name: string }[];
}

const defaultFilters: FilterValues = {
  dateFrom: '', dateTo: '', customerId: null,
  status: '', invoiceNumberSearch: '',
  minAmount: '', maxAmount: '',
};

export { defaultFilters };

export default function InvoiceFilters({ values, onChange, customers }: Props) {
  const { t } = useTranslation();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const statuses = ['draft', 'sent', 'paid', 'cancelled'];

  const handleChange = (field: keyof FilterValues, value: any) => {
    onChange({ ...values, [field]: value });
  };

  const handleClear = () => {
    onChange({ ...defaultFilters });
  };

  const hasFilters = Object.values(values).some(v => v !== '' && v !== null && v !== 0);

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField size="small" label={t('invoices.filterNumber')}
          value={values.invoiceNumberSearch}
          onChange={e => handleChange('invoiceNumberSearch', e.target.value)}
          sx={{ width: 160 }} />

        <FormControl size="small" sx={{ width: 140 }}>
          <InputLabel>{t('invoices.filterStatus')}</InputLabel>
          <Select value={values.status} label={t('invoices.filterStatus')}
            onChange={e => handleChange('status', e.target.value)}>
            <MenuItem value="">{t('common.search')}</MenuItem>
            {statuses.map(s => (
              <MenuItem key={s} value={s}>{t(`invoices.${s}`)}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button size="small" onClick={() => setShowAdvanced(!showAdvanced)}
          endIcon={showAdvanced ? <ExpandLessIcon /> : <ExpandMoreIcon />}>
          {showAdvanced ? t('common.search') : t('invoices.filterDateFrom')}
        </Button>

        {hasFilters && (
          <Button size="small" startIcon={<ClearIcon />} onClick={handleClear}>
            {t('invoices.filterClear')}
          </Button>
        )}
      </Box>

      <Collapse in={showAdvanced}>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center', mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <TextField size="small" label={t('invoices.filterDateFrom')} type="date"
            value={values.dateFrom}
            onChange={e => handleChange('dateFrom', e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ width: 170 }} />

          <TextField size="small" label={t('invoices.filterDateTo')} type="date"
            value={values.dateTo}
            onChange={e => handleChange('dateTo', e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ width: 170 }} />

          <Autocomplete
            size="small"
            options={customers}
            getOptionLabel={opt => opt.name}
            value={customers.find(c => c.id === values.customerId) || null}
            onChange={(_, v) => handleChange('customerId', v?.id || null)}
            renderInput={params => (
              <TextField {...params} label={t('invoices.customer')} sx={{ width: 200 }} />
            )}
          />

          <TextField size="small" label={t('invoices.filterPriceMin')} type="number"
            value={values.minAmount}
            onChange={e => handleChange('minAmount', e.target.value)}
            sx={{ width: 120 }} />

          <TextField size="small" label={t('invoices.filterPriceMax')} type="number"
            value={values.maxAmount}
            onChange={e => handleChange('maxAmount', e.target.value)}
            sx={{ width: 120 }} />
        </Box>
      </Collapse>
    </Paper>
  );
}
