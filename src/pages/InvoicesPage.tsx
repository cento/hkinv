import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography, Button, Chip, Snackbar, Alert, Tooltip } from '@mui/material';
import { DataGrid, GridColDef, GridRowParams, GridRowSelectionModel, GridToolbar } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import DownloadIcon from '@mui/icons-material/Download';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useNavigate } from 'react-router-dom';
import api from '../services/dbService';
import InvoiceFilters, { FilterValues, defaultFilters } from '../components/InvoiceFilters';
import ConfirmDialog, { EmptyState } from '../components/ConfirmDialog';
import { downloadBlob } from '../database/fsa';
import { formatError } from '../utils/validators';
import { formatHKD } from '../utils/format';
import { useUndoDelete } from '../hooks/useUndoDelete';

const statusColors: Record<string, 'default' | 'primary' | 'success' | 'error' | 'warning'> = {
  draft: 'default',
  sent: 'primary',
  paid: 'success',
  cancelled: 'error',
};

export default function InvoicesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Record<string, any>[]>([]);
  const [customers, setCustomers] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterValues>({ ...defaultFilters });
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [deleteConfirm, setDeleteConfirm] = useState<Record<string, any> | null>(null);
  const [overdueCount, setOverdueCount] = useState(0);
  const [hidePaid, setHidePaid] = useState(false);
  const [selectedIds, setSelectedIds] = useState<GridRowSelectionModel>({ type: 'include', ids: new Set() });
  const [selectionKey, setSelectionKey] = useState(0);

  const handleBatchStatus = async (status: string) => {
    try {
      const count = selectedIds.ids.size;
      const ids = selectedIds.ids;
      setSelectionKey(k => k + 1);
      setSelectedIds({ type: 'include', ids: new Set() });
      for (const id of ids) {
        await api.invoicesUpdate(Number(id), { status } as any);
        if (status === 'paid') {
          await api.invoicesUpdate(Number(id), { paid_date: new Date().toISOString().split('T')[0] } as any);
        }
      }
      await loadInvoices();
      setToast({ open: true, message: `${count} ${t('invoices.title')} → ${t(`invoices.${status}`)}`, severity: 'success' });
    } catch (err: any) {
      setToast({ open: true, message: String(err), severity: 'error' });
    }
  };

  const handleBatchExport = async () => {
    const count = selectedIds.ids.size;
    const ids = selectedIds.ids;
    setSelectionKey(k => k + 1);
    setSelectedIds({ type: 'include', ids: new Set() });
    try {
      for (const id of ids) {
        const inv = (await api.invoicesGetById(Number(id))) as Record<string, any> | null;
        if (!inv) continue;
        const customer = (await api.customersGetById(inv.customer_id as number)) as Record<string, any> | null;
        const pdfSettings = (await api.settingsGet()) as Record<string, any> | null;
        if (!customer || !pdfSettings) continue;
        const items = (await api.invoiceItemsGetAll(inv.id as number)) as Record<string, any>[];
        const { generatePDF } = await import('../utils/pdf');
        const doc = generatePDF({
          teacherName: pdfSettings.teacher_name, teacherAddress: pdfSettings.teacher_address,
          customerName: customer.name, customerAddress: customer.address,
          invoiceNumber: inv.invoice_number, issueDate: inv.issue_date, dueDate: inv.due_date,
          subtotal: inv.subtotal, discountPercent: inv.discount_percent,
          discountAmount: inv.discount_amount, total: inv.total,
          paymentTerms: inv.payment_terms, notes: inv.notes,
          items: (items || []).map((i: any) => ({ description: i.description, lesson_date: i.lesson_date, hours: i.hours, rate: i.rate, amount: i.amount })),
          language: (localStorage.getItem('app-language') || 'it') as 'it' | 'en',
        });
        downloadBlob(doc.output('blob'), `${inv.invoice_number}.pdf`);
      }
      setToast({ open: true, message: `${count} PDF ${t('common.save')} ✓`, severity: 'success' });
    } catch (err: any) {
      setToast({ open: true, message: String(err), severity: 'error' });
    }
  };

  const loadInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const sqlFilters: any = {};
      if (filters.dateFrom) sqlFilters.dateFrom = filters.dateFrom;
      if (filters.dateTo) sqlFilters.dateTo = filters.dateTo;
      if (filters.customerId) sqlFilters.customerId = filters.customerId;
      if (filters.status) sqlFilters.status = filters.status;
      if (filters.invoiceNumberSearch) sqlFilters.invoiceNumberSearch = filters.invoiceNumberSearch;
      if (filters.minAmount) sqlFilters.minAmount = parseFloat(filters.minAmount);
      if (filters.maxAmount) sqlFilters.maxAmount = parseFloat(filters.maxAmount);
      const data = (await api.invoicesSearch(sqlFilters)) as Record<string, any>[];
      setInvoices(data || []);
    } catch (err) {
      setToast({ open: true, message: formatError(err), severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    api.customersGetAll().then(c => setCustomers(c as Record<string, any>[])).catch(err => setToast({ open: true, message: formatError(err), severity: 'error' }));
  }, []);

  useEffect(() => {
    api.invoicesGetAll().then(all => {
      const today = new Date().toISOString().split('T')[0];
      const overdue = (all || []).filter((i: any) => i.status === 'sent' && i.due_date && i.due_date < today);
      setOverdueCount(overdue.length);
    }).catch(err => setToast({ open: true, message: formatError(err), severity: 'error' }));
  }, [invoices]);

  useEffect(() => { loadInvoices(); }, [loadInvoices]);

  const displayedInvoices = hidePaid ? invoices.filter((i: any) => i.status !== 'paid') : invoices;

  const handleExportPDF = async (invoice: Record<string, any>) => {
    try {
      const full = (await api.invoicesGetById(invoice.id)) as Record<string, any> | null;
      if (!full) return;
      const items = (await api.invoiceItemsGetAll(invoice.id)) as Record<string, any>[];
      const settings = await api.settingsGet() as Record<string, any> | null;
      const customer = await api.customersGetById(full.customer_id as number) as Record<string, any> | null;
      if (!settings || !customer) {
        setToast({ open: true, message: t('common.error') + ': customer or settings missing', severity: 'error' });
        return;
      }

      const { generatePDF } = await import('../utils/pdf');
      const doc = generatePDF({
        teacherName: settings.teacher_name,
        teacherAddress: settings.teacher_address,
        teacherEmail: settings.teacher_email,
        teacherPhone: settings.teacher_phone,
        brNumber: settings.br_number,
        bankDetails: settings.bank_details,
        customerName: customer.name,
        customerAddress: customer.address,
        invoiceNumber: full.invoice_number,
        issueDate: full.issue_date,
        dueDate: full.due_date,
        subtotal: full.subtotal,
        discountPercent: full.discount_percent,
        discountAmount: full.discount_amount,
        total: full.total,
        paymentTerms: full.payment_terms,
        notes: full.notes,
        items: (items || []).map((i: any) => ({
          description: i.description,
          lesson_date: i.lesson_date,
          hours: i.hours,
          rate: i.rate,
          amount: i.amount,
        })),
        language: (localStorage.getItem('app-language') || 'it') as 'it' | 'en',
      });
      const blob = doc.output('blob');
      downloadBlob(blob, `${full.invoice_number}.pdf`);
      setToast({ open: true, message: 'PDF ' + t('common.save') + ' ✓', severity: 'success' });
    } catch (err: any) {
      setToast({ open: true, message: String(err), severity: 'error' });
    }
  };

  const undoDelete = useUndoDelete(async (invoice: Record<string, any>) => {
    await api.invoicesCreate({
      issue_date: invoice.issue_date,
      due_date: invoice.due_date,
      customer_id: invoice.customer_id,
      status: invoice.status || 'draft',
      currency: invoice.currency || 'HKD',
      invoice_number: invoice.invoice_number,
      subtotal: invoice.subtotal || 0,
      discount_percent: invoice.discount_percent || 0,
      discount_amount: invoice.discount_amount || 0,
      total: invoice.total || 0,
      notes: invoice.notes || null,
      payment_terms: invoice.payment_terms || null,
    });
    await loadInvoices();
  });

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    const deleted = { ...deleteConfirm };
    try {
      await api.invoicesDelete(deleteConfirm.id);
      setDeleteConfirm(null);
      await loadInvoices();
      undoDelete.scheduleUndo(deleted, t('common.delete') + ' ✓');
    } catch (err: any) {
      setDeleteConfirm(null);
      setToast({ open: true, message: String(err), severity: 'error' });
    }
  };

  const handleExportCSV = async (invoice: Record<string, any>) => {
    try {
      const full = (await api.invoicesGetById(invoice.id)) as Record<string, any> | null;
      if (!full) return;
      const items = (await api.invoiceItemsGetAll(invoice.id)) as Record<string, any>[];
      const customer = await api.customersGetById(full.customer_id as number) as Record<string, any> | null;
      if (!customer) return;

      const { exportToCsv } = await import('../utils/csv');
      const headers = [t('invoices.itemDescription'), t('invoices.itemDate'), t('invoices.itemHours'), t('invoices.itemRate'), t('invoices.itemAmount')];
      const rows = (items || []).map((i: any) => [
        i.description || '',
        i.lesson_date || '',
        String(i.hours || 0),
        String(i.rate || 0),
        String(i.amount || 0),
      ]);
      const csv = exportToCsv(
        `${full.invoice_number}.csv`,
        headers,
        rows
      );
      const blob = new Blob([csv], { type: 'text/csv' });
      downloadBlob(blob, `${full.invoice_number}.csv`);
      setToast({ open: true, message: 'CSV ' + t('common.save') + ' ✓', severity: 'success' });
    } catch (err: any) {
      setToast({ open: true, message: String(err), severity: 'error' });
    }
  };

  const handleRowDoubleClick = (params: GridRowParams) => {
    navigate(`/invoices/${params.id}`);
  };

  const columns: GridColDef[] = [
    { field: 'invoice_number', headerName: t('invoices.number'), flex: 1.5, minWidth: 120 },
    { field: 'customer_name', headerName: t('invoices.customer'), flex: 1.5, minWidth: 120 },
    { field: 'issue_date', headerName: t('invoices.date'), flex: 1, minWidth: 100 },
    { field: 'due_date', headerName: t('invoices.dueDate'), flex: 1, minWidth: 100 },
    {
      field: 'total', headerName: t('invoices.total'), flex: 1, minWidth: 100,
      valueFormatter: (val: number) => formatHKD(val || 0),
    },
    {
      field: 'status', headerName: t('invoices.status'), flex: 0.8, minWidth: 90,
      renderCell: (params) => (
        <Chip
          label={t(`invoices.${params.value}`)}
          color={statusColors[params.value] || 'default'}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: 'actions', headerName: '', flex: 1.2, minWidth: 240, sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Button size="small" aria-label={`${t('invoices.exportPdf')} ${params.row.invoice_number}`} onClick={(e) => {
            e.stopPropagation();
            handleExportPDF(params.row);
          }}>
            {t('invoices.exportPdf')}
          </Button>
          <Button size="small" aria-label={`Export CSV ${params.row.invoice_number}`} onClick={(e) => {
            e.stopPropagation();
            handleExportCSV(params.row);
          }}>
            CSV
          </Button>
          <Button size="small" color="error" aria-label={`${t('common.delete')} ${params.row.invoice_number}`} onClick={(e) => {
            e.stopPropagation();
            setDeleteConfirm(params.row);
          }}>
            {t('common.delete')}
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">{t('invoices.title')}</Typography>
        <Button variant="contained" startIcon={<AddIcon />}
          onClick={() => navigate('/invoices/new')}>
          {t('invoices.new')}
        </Button>
      </Box>

      {overdueCount > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }} icon={<WarningAmberIcon />}>
          {t('invoices.overdueWarning', { count: overdueCount })}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
        <Button
          size="small"
          variant={hidePaid ? 'contained' : 'outlined'}
          color="inherit"
          onClick={() => setHidePaid(v => !v)}
        >
          {hidePaid ? t('invoices.showPaid') : t('invoices.hidePaid')}
        </Button>
      </Box>

      {selectedIds.ids.size > 0 && (
        <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
          <Typography variant="body2" sx={{ mr: 1 }}>{selectedIds.ids.size} selected</Typography>
          <Tooltip title={t('invoices.paid')}>
            <Button size="small" color="success" startIcon={<CheckCircleIcon />}
              onClick={() => handleBatchStatus('paid')}>
              {t('invoices.paid')}
            </Button>
          </Tooltip>
          <Tooltip title={t('invoices.sent')}>
            <Button size="small" color="primary" startIcon={<CheckCircleIcon />}
              onClick={() => handleBatchStatus('sent')}>
              {t('invoices.sent')}
            </Button>
          </Tooltip>
          <Button size="small" startIcon={<DownloadIcon />} onClick={handleBatchExport}>
            PDF ({selectedIds.ids.size})
          </Button>
        </Box>
      )}

      <InvoiceFilters
        values={filters}
        onChange={setFilters}
        customers={customers as { id: number; name: string }[]}
      />

      <Box sx={{ height: 'calc(100vh - 280px)' }}>
        <DataGrid
          key={selectionKey}
          rows={displayedInvoices}
          columns={columns}
          loading={loading}
           pageSizeOptions={[25, 50, 100]}
          checkboxSelection
          disableRowSelectionOnClick
          onRowSelectionModelChange={setSelectedIds}
          onRowDoubleClick={handleRowDoubleClick}
          slots={{ toolbar: GridToolbar, noRowsOverlay: EmptyState, footer: () => null }}
          slotProps={{ noRowsOverlay: { message: t('invoices.noInvoices'), actionLabel: t('invoices.new'), onAction: () => navigate('/invoices/new') } as any }}
        />
      </Box>

      <ConfirmDialog
        open={!!deleteConfirm}
        title={t('invoices.deleteConfirm')}
        message={deleteConfirm ? `${deleteConfirm.invoice_number} — ${t('invoices.total')}: ${formatHKD(deleteConfirm.total || 0)}` : ''}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
      />

      <Snackbar open={toast.open} autoHideDuration={3000}
        onClose={() => setToast(t => ({ ...t, open: false }))}>
        <Alert severity={toast.severity} variant="filled">{toast.message}</Alert>
      </Snackbar>

      <Snackbar open={undoDelete.snackbar.open} autoHideDuration={5000}
        onClose={undoDelete.closeSnackbar}
        message={undoDelete.snackbar.message}
        action={
          <Button color="inherit" size="small" onClick={undoDelete.handleUndo}>
            {t('common.undo') || 'Undo'}
          </Button>
        }
      />
    </Box>
  );
}
