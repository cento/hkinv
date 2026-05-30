import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Button, Paper, Grid, FormControl, InputLabel,
  Select, MenuItem, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Snackbar, Alert,
} from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DownloadIcon from '@mui/icons-material/Download';
import api from '../services/dbService';
import { downloadBlob } from '../database/fsa';
import { formatError } from '../utils/validators';

function getTaxYear(year: number): { start: string; end: string } {
  return {
    start: `${year - 1}-04-01`,
    end: `${year}-03-31`,
  };
}

function getQuarterRanges(year: number): { label: string; start: string; end: string }[] {
  return [
    { label: `Q1 (Apr-Jun ${year - 1})`, start: `${year - 1}-04-01`, end: `${year - 1}-06-30` },
    { label: `Q2 (Jul-Sep ${year - 1})`, start: `${year - 1}-07-01`, end: `${year - 1}-09-30` },
    { label: `Q3 (Oct-Dec ${year - 1})`, start: `${year - 1}-10-01`, end: `${year - 1}-12-31` },
    { label: `Q4 (Jan-Mar ${year})`, start: `${year}-01-01`, end: `${year}-03-31` },
  ];
}

export default function TaxReportsPage() {
  const { t } = useTranslation();
  const now = new Date();
  const defaultYear = now.getMonth() >= 3 ? now.getFullYear() + 1 : now.getFullYear();
  const [taxYear, setTaxYear] = useState(defaultYear);
  const [viewMode, setViewMode] = useState<'annual' | 'quarterly'>('annual');
  const [data, setData] = useState<{ customer_name: string; total: number; count: number }[]>([]);
  const [summary, setSummary] = useState({ totalIncome: 0, totalInvoices: 0, customerCount: 0 });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const yearRange = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const { start, end } = getTaxYear(taxYear);
      const allInvoices = (await api.invoicesGetAll()) as Record<string, any>[];
      const paid = allInvoices.filter((i: any) =>
        i.status === 'paid' && (i.paid_date || i.issue_date) >= start && (i.paid_date || i.issue_date) <= end
      );
      const byCustomer: Record<string, { total: number; count: number }> = {};
      for (const inv of paid) {
        const key = inv.customer_name || `#${inv.customer_id}`;
        if (!byCustomer[key]) byCustomer[key] = { total: 0, count: 0 };
        byCustomer[key].total += (inv.total || 0);
        byCustomer[key].count += 1;
      }
      const rows = Object.entries(byCustomer).map(([customer_name, v]) => ({ customer_name, ...v }));
      rows.sort((a, b) => b.total - a.total);
      setData(rows);
      setSummary({
        totalIncome: paid.reduce((s: number, i: any) => s + (i.total || 0), 0),
        totalInvoices: paid.length,
        customerCount: Object.keys(byCustomer).length,
      });
    } catch (err) {
      setToast({ open: true, message: formatError(err), severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [taxYear]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleExportCSV = () => {
    const lines = [
      [t('customers.name'), t('invoices.total'), t('invoices.title')].join(','),
      ...data.map(r => `"${r.customer_name}",${r.total.toFixed(2)},${r.count}`),
      '',
      `${t('dashboard.totalInvoices')},${summary.totalIncome.toFixed(2)},${summary.totalInvoices}`,
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `tax-report-${taxYear}.csv`);
    setToast({ open: true, message: 'CSV ' + t('common.save') + ' ✓', severity: 'success' });
  };

  const handleExportPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text(t('pdf.taxReport') || `Tax Report ${taxYear - 1}/${taxYear}`, 14, 20);
      doc.setFontSize(10);
      doc.text(`${t('pdf.period')}: ${getTaxYear(taxYear).start} → ${getTaxYear(taxYear).end}`, 14, 28);

      const headers = [t('customers.name'), t('invoices.total'), t('invoices.title')];
      const body = data.map(r => [r.customer_name, `${r.total.toFixed(2)} HKD`, String(r.count)]);
      body.push(['', '', '']);
      body.push([t('dashboard.totalInvoices') || 'Total', `${summary.totalIncome.toFixed(2)} HKD`, String(summary.totalInvoices)]);

      autoTable(doc, {
        startY: 34,
        head: [headers],
        body,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [41, 98, 255] },
      });

      const blob = doc.output('blob');
      downloadBlob(blob, `tax-report-${taxYear}.pdf`);
      setToast({ open: true, message: 'PDF ' + t('common.save') + ' ✓', severity: 'success' });
    } catch (err) {
      setToast({ open: true, message: formatError(err), severity: 'error' });
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5">{t('pdf.taxReport') || 'Tax Report'}</Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <FormControl size="small" sx={{ width: 120 }}>
            <InputLabel>{t('pdf.year') || 'Year'}</InputLabel>
            <Select value={taxYear} label={t('pdf.year') || 'Year'} onChange={e => setTaxYear(Number(e.target.value))}>
              {yearRange.map(y => <MenuItem key={y} value={y}>{y - 1}/{y}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ width: 120 }}>
            <InputLabel>{t('common.view') || 'View'}</InputLabel>
            <Select value={viewMode} label={t('common.view') || 'View'} onChange={e => setViewMode(e.target.value as any)}>
              <MenuItem value="annual">{t('pdf.annual') || 'Annual'}</MenuItem>
              <MenuItem value="quarterly">{t('pdf.quarterly') || 'Quarterly'}</MenuItem>
            </Select>
          </FormControl>
          <Button size="small" startIcon={<DownloadIcon />} onClick={handleExportCSV}>CSV</Button>
          <Button size="small" startIcon={<PictureAsPdfIcon />} onClick={handleExportPDF}>{t('invoices.exportPdf')}</Button>
        </Box>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>{summary.totalIncome.toFixed(2)} HKD</Typography>
            <Typography variant="body2" color="text.secondary">{t('dashboard.monthlyTotal')}</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>{summary.totalInvoices}</Typography>
            <Typography variant="body2" color="text.secondary">{t('invoices.title')}</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>{summary.customerCount}</Typography>
            <Typography variant="body2" color="text.secondary">{t('dashboard.customers')}</Typography>
          </Paper>
        </Grid>
      </Grid>

      {viewMode === 'quarterly' && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>{t('pdf.quarterly') || 'Quarterly'}</Typography>
          <Grid container spacing={1}>
            {getQuarterRanges(taxYear).map(q => (
              <Grid key={q.label} size={{ xs: 12, sm: 6, md: 3 }}>
                <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{q.label}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t('customers.name')}</TableCell>
              <TableCell align="right">{t('invoices.total')}</TableCell>
              <TableCell align="right">{t('invoices.title')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  <Typography color="text.secondary">{loading ? t('common.loading') : t('common.noData')}</Typography>
                </TableCell>
              </TableRow>
            ) : data.map((r, i) => (
              <TableRow key={i}>
                <TableCell>{r.customer_name}</TableCell>
                <TableCell align="right">{r.total.toFixed(2)} HKD</TableCell>
                <TableCell align="right">{r.count}</TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>{t('dashboard.totalInvoices')}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>{summary.totalIncome.toFixed(2)} HKD</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>{summary.totalInvoices}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <Snackbar open={toast.open} autoHideDuration={3000} onClose={() => setToast(t => ({ ...t, open: false }))}>
        <Alert severity={toast.severity} variant="filled">{toast.message}</Alert>
      </Snackbar>
    </Box>
  );
}
