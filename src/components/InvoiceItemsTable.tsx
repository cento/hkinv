import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Button, IconButton, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Select, MenuItem, FormControl
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useTranslation } from 'react-i18next';
import api from '../services/dbService';

export interface InvoiceItemRow {
  tempId: number;
  id?: number;
  service_type_id?: number;
  description: string;
  lesson_date: string;
  hours: number;
  rate: number;
  amount: number;
}

interface Props {
  items: InvoiceItemRow[];
  onChange: React.Dispatch<React.SetStateAction<InvoiceItemRow[]>>;
  customerId: number | null;
  readOnly?: boolean;
}

export default function InvoiceItemsTable({ items, onChange, customerId, readOnly }: Props) {
  const { t } = useTranslation();
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);
  const nextTempIdRef = useRef(1);

  useEffect(() => {
    nextTempIdRef.current = items.length > 0 ? Math.max(...items.map(i => i.tempId)) + 1 : 1;
  }, [items]);

  useEffect(() => {
    api.serviceTypesGetAll().then(setServiceTypes).catch(console.error);
  }, []);

  const addItem = () => {
    const newItem: InvoiceItemRow = {
      tempId: nextTempIdRef.current++,
      description: '',
      lesson_date: new Date().toISOString().split('T')[0],
      hours: 1,
      rate: 0,
      amount: 0,
    };
    onChange([...items, newItem]);
  };

  const updateItem = (tempId: number, field: keyof InvoiceItemRow, value: any) => {
    const updated = items.map(item => {
      if (item.tempId !== tempId) return item;
      const next = { ...item, [field]: value };
      next.amount = (next.hours ?? 0) * (next.rate ?? 0);
      return next;
    });
    onChange(updated);

    if (field === 'service_type_id' && value && customerId) {
      const numericValue = typeof value === 'string' ? parseInt(value, 10) : value;
      api.customerRatesResolve(customerId, numericValue).then(resolved => {
        onChange(prev => prev.map(i => {
          if (i.tempId !== tempId) return i;
          return {
            ...i,
            service_type_id: numericValue,
            description: resolved.description || i.description,
            rate: resolved.rate,
            amount: (resolved.rate) * (i.hours || 1),
          };
        }));
      });
    }
  };

  const removeItem = (tempId: number) => {
    onChange(items.filter(i => i.tempId !== tempId));
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{t('invoices.items')}</Typography>
        {!readOnly && (
          <Button size="small" startIcon={<AddIcon />} onClick={addItem}>
            {t('invoices.addItem')}
          </Button>
        )}
      </Box>

      {items.length === 0 ? (
        <Typography color="text.secondary" variant="body2" sx={{ py: 2 }}>
          {t('common.noData')} — {t('invoices.addItem')}
        </Typography>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                {serviceTypes.length > 0 && !readOnly && (
                  <TableCell>{t('invoices.serviceType')}</TableCell>
                )}
                <TableCell>{t('invoices.itemDescription')}</TableCell>
                <TableCell>{t('invoices.itemDate')}</TableCell>
                <TableCell align="right">{t('invoices.itemHours')}</TableCell>
                <TableCell align="right">{t('invoices.itemRate')}</TableCell>
                <TableCell align="right">{t('invoices.itemAmount')}</TableCell>
                {!readOnly && <TableCell align="center">{t('common.actions')}</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map(item => (
                <TableRow key={item.tempId}>
                  {serviceTypes.length > 0 && !readOnly && (
                    <TableCell sx={{ minWidth: 140 }}>
                      <FormControl fullWidth size="small">
                        <Select
                          value={item.service_type_id ?? ''}
                          onChange={e => updateItem(item.tempId, 'service_type_id', parseInt(String(e.target.value), 10) || undefined)}
                          displayEmpty
                        >
                          <MenuItem value=""><em>-</em></MenuItem>
                          {serviceTypes.map(st => (
                            <MenuItem key={st.id} value={st.id}>{st.name}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                  )}
                  <TableCell>
                    <TextField size="small" variant="standard" fullWidth
                      value={item.description}
                      onChange={e => updateItem(item.tempId, 'description', e.target.value)}
                      disabled={readOnly}
                      placeholder="Es. Lezioni di italiano — Maggio 2026" />
                  </TableCell>
                  <TableCell>
                    <TextField size="small" variant="standard" type="date"
                      value={item.lesson_date || ''}
                      onChange={e => updateItem(item.tempId, 'lesson_date', e.target.value)}
                      disabled={readOnly}
                      slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: today } }} />
                  </TableCell>
                  <TableCell align="right">
                    <TextField size="small" variant="standard" type="number"
                      value={item.hours}
                      onChange={e => updateItem(item.tempId, 'hours', parseFloat(e.target.value) || 0)}
                      disabled={readOnly}
                      sx={{ width: 70 }} slotProps={{ htmlInput: { min: 0, step: 0.5 } }} />
                  </TableCell>
                  <TableCell align="right">
                    <TextField size="small" variant="standard" type="number"
                      value={item.rate}
                      onChange={e => updateItem(item.tempId, 'rate', parseFloat(e.target.value) || 0)}
                      disabled={readOnly}
                      sx={{ width: 90 }} slotProps={{ htmlInput: { min: 0, step: 50 } }} />
                  </TableCell>
                  <TableCell align="right">
                    {item.amount.toFixed(2)}
                  </TableCell>
                  {!readOnly && (
                    <TableCell align="center">
                      <IconButton size="small" color="error" onClick={() => removeItem(item.tempId)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}