import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Paper, Grid, TextField, Select, MenuItem,
  FormControl, InputLabel, Snackbar, Alert, Autocomplete, Divider, Dialog,
  DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import PrintIcon from '@mui/icons-material/Print';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import api from '../services/dbService';
import InvoiceItemsTable, { InvoiceItemRow } from '../components/InvoiceItemsTable';
import { formatDateISO, calculateDueDate } from '../utils/format';
import { validateInvoice } from '../utils/validators';
import ConfirmDialog from '../components/ConfirmDialog';
import PDFPreviewDialog from '../components/PDFPreviewDialog';
import { downloadBlob } from '../database/fsa';

export default function InvoiceEditPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;
  const invoiceId = id ? parseInt(id) : null;

  const [customers, setCustomers] = useState<any[]>([]);
  const [settings, setSettings] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  // Form state
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [issueDate, setIssueDate] = useState<string>(formatDateISO(new Date().toISOString()));
  const [dueDate, setDueDate] = useState<string>('');
  const [status, setStatus] = useState<string>('draft');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [paymentTerms, setPaymentTerms] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [items, setItems] = useState<InvoiceItemRow[]>([]);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceNumberError, setInvoiceNumberError] = useState('');
  const [existingInvoice, setExistingInvoice] = useState<Record<string, any> | null>(null);
  const [discardDialog, setDiscardDialog] = useState(false);
  const [reviewDialog, setReviewDialog] = useState(false);
  const [previewPdfData, setPreviewPdfData] = useState<string | null>(null);
  const [pendingSaveStatus, setPendingSaveStatus] = useState<string>('draft');
  const [templateReady, setTemplateReady] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const initialFormRef = useRef<{ customerId: number | null; issueDate: string; dueDate: string; status: string; discountPercent: number; paymentTerms: string; notes: string; items: InvoiceItemRow[] } | null>(null);
  const dataReadyRef = useRef(false);
  const invoiceNumberEdited = useRef(false);

  // Load data
  useEffect(() => {
    api.customersGetAll().then(c => setCustomers(c as any[])).catch(console.error);
    api.settingsGet().then(s => {
      const cfg = s as Record<string, any> | null;
      setSettings(cfg);
      if (cfg) {
        setPaymentTerms(cfg.default_payment_terms || '');
        setDueDate(calculateDueDate(cfg.default_payment_terms));
      }
    }).catch(console.error);
    if (isNew) {
      api.settingsGenerateInvoiceNumber().then(num => {
        if (!invoiceNumberEdited.current) {
          setInvoiceNumber(num);
        }
      }).catch(console.error);
    }
  }, []);

  // Load existing invoice for editing
  useEffect(() => {
    if (!invoiceId) return;
    (async () => {
      try {
        const inv = (await api.invoicesGetById(invoiceId)) as Record<string, any> | null;
        if (!inv) return;
        setExistingInvoice(inv);
        setInvoiceNumber(inv.invoice_number);
        setCustomerId(inv.customer_id);
        setIssueDate(inv.issue_date);
        setDueDate(inv.due_date);
        setStatus(inv.status);
        setDiscountPercent(inv.discount_percent);
        setPaymentTerms(inv.payment_terms || '');
        setNotes(inv.notes || '');
        const invItems = await api.invoiceItemsGetAll(invoiceId);
        const loadedItems = (invItems as any[]).map((item: any, i: number) => ({
          tempId: i + 1,
          id: item.id,
          description: item.description,
          lesson_date: item.lesson_date || '',
          hours: item.hours,
          rate: item.rate,
          amount: item.amount,
        }));
        setItems(loadedItems);
        dataReadyRef.current = true;
        setDataReady(true);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [invoiceId]);

  // Track form dirty state by snapshotting initial form values
  const isDirty = useMemo(() => {
    if (!initialFormRef.current) return false;
    const snap = initialFormRef.current;
    return snap.customerId !== customerId ||
      snap.issueDate !== issueDate ||
      snap.dueDate !== dueDate ||
      snap.status !== status ||
      snap.discountPercent !== discountPercent ||
      snap.paymentTerms !== paymentTerms ||
      snap.notes !== notes ||
      JSON.stringify(snap.items) !== JSON.stringify(items);
  }, [customerId, issueDate, dueDate, status, discountPercent, paymentTerms, notes, items]);

  // Capture initial form snapshot after data loads
  useEffect(() => {
    if (initialFormRef.current !== null) return;
    if (existingInvoice && !dataReady) return;
    if (isNew && !templateReady) return;
    if (customers.length === 0) return;
    initialFormRef.current = {
      customerId,
      issueDate,
      dueDate,
      status,
      discountPercent,
      paymentTerms,
      notes,
      items: [...items],
    };
  }, [customers.length, existingInvoice, isNew, dataReady, templateReady]);

  // beforeunload for window close / reload
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // Template from last invoice for new invoices
  const loadTemplate = useCallback(async () => {
    if (!isNew) return;
    try {
      const last = (await api.invoicesGetLast()) as Record<string, any> | null;
      if (last) {
        setCustomerId(last.customer_id);
        const lastItems = (await api.invoiceItemsGetAll(last.id)) as Record<string, any>[];
        if (lastItems && lastItems.length > 0) {
          const templateItems = lastItems.map((item: any, i: number) => ({
            tempId: i + 1,
            description: item.description,
            lesson_date: item.lesson_date || '',
            hours: item.hours,
            rate: 0, // Don't copy amounts
            amount: 0,
          }));
          setItems(templateItems);
        }
      }
    } catch (err) {
      console.error('Template load error:', err);
    } finally {
      setTemplateReady(true);
    }
  }, [isNew]);

  useEffect(() => {
    if (isNew && customers.length > 0 && settings) {
      loadTemplate();
    }
  }, [isNew, customers, settings, loadTemplate]);

  const handleSave = async (finalStatus: string) => {
    // Fallback: se issue_date o due_date sono vuote, usa oggi
    const safeIssueDate = issueDate || formatDateISO(new Date().toISOString());
    const safeDueDate = dueDate || calculateDueDate(settings?.default_payment_terms);
    const data = {
      issue_date: safeIssueDate,
      due_date: safeDueDate,
      customer_id: customerId,
      discount_percent: discountPercent,
      notes: notes || null,
      payment_terms: paymentTerms || null,
    };

    const validation = validateInvoice(data);
    if (!validation.valid) {
      const fieldLabels: Record<string, string> = {
        customer_id: t('invoices.customer'),
        issue_date: t('invoices.date'),
      };
      const msg = validation.errors.map(e => `• ${fieldLabels[e.field] || e.field}: ${t(e.message)}`).join('\n');
      setToast({ open: true, message: msg, severity: 'error' });
      return;
    }

    try {
      setSaving(true);
      setInvoiceNumberError('');

      // Check for duplicate invoice number
      if (invoiceNumber.trim()) {
        const existing = await api.invoicesGetByNumber(invoiceNumber.trim()) as Record<string, any> | null;
        if (existing && existing.id !== (existingInvoice?.id || null)) {
          setInvoiceNumberError(t('invoices.numberAlreadyExists') || 'This invoice number already exists');
          setSaving(false);
          return;
        }
      }

      if (existingInvoice) {
        // Update existing
        const updateData: Record<string, unknown> = { ...data, status: finalStatus };
        if (invoiceNumber.trim() && invoiceNumber.trim() !== existingInvoice.invoice_number) {
          updateData.invoice_number = invoiceNumber.trim();
        }
        if (finalStatus === 'paid') {
          updateData.paid_date = new Date().toISOString().split('T')[0];
        } else if (existingInvoice.status === 'paid' && finalStatus !== 'paid') {
          updateData.paid_date = null;
        }
        await api.invoicesUpdate(existingInvoice.id, updateData);

        // Sync items: delete removed, update existing, add new
        const existingIds = (await api.invoiceItemsGetAll(existingInvoice.id)).map((i: any) => i.id);
        const currentIds = items.filter(i => i.id).map(i => i.id);

        for (const item of items) {
          if (item.id) {
            await api.invoiceItemsUpdate(item.id, {
              description: item.description,
              lesson_date: item.lesson_date || null,
              hours: item.hours,
              rate: item.rate,
            });
          } else {
            await api.invoiceItemsAdd(existingInvoice.id, {
              description: item.description,
              lesson_date: item.lesson_date || null,
              hours: item.hours,
              rate: item.rate,
            });
          }
        }

        // Delete items removed by user
        for (const eid of existingIds) {
          if (!currentIds.includes(eid)) {
            await api.invoiceItemsDelete(eid);
          }
        }

        await api.invoicesRecalculateTotals(existingInvoice.id);
      } else {
        // Create new — lascia che sia il backend a generare il numero atomicamente
        const createData: Record<string, unknown> = {
          ...data,
          invoice_number: invoiceNumber || undefined,
          status: finalStatus,
          currency: 'HKD',
        };
        if (finalStatus === 'paid') {
          createData.paid_date = new Date().toISOString().split('T')[0];
        }
        const newId: number = await api.invoicesCreate(createData);

        for (const item of items) {
          await api.invoiceItemsAdd(newId, {
            description: item.description,
            lesson_date: item.lesson_date || null,
            hours: item.hours,
            rate: item.rate,
          });
        }

        await api.invoicesRecalculateTotals(newId);
      }

      setToast({ open: true, message: t('common.save') + ' ✓', severity: 'success' });
      setTimeout(() => navigate('/invoices'), 800);
    } catch (err: any) {
      setToast({ open: true, message: String(err), severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleExportPDF = async (download = true) => {
    if (!existingInvoice && !invoiceId) return;
    try {
      const inv = (existingInvoice || await api.invoicesGetById(invoiceId!)) as Record<string, any> | null;
      if (!inv) return;
      const customer = (await api.customersGetById(inv.customer_id as number)) as Record<string, any> | null;
      const pdfSettings = (await api.settingsGet()) as Record<string, any> | null;
      if (!customer || !pdfSettings) return;

      const { generatePDF } = await import('../utils/pdf');
      const currentItems = items.length > 0 ? items : (await api.invoiceItemsGetAll(inv.id as number)) as Record<string, any>[];
      const doc = generatePDF({
        teacherName: pdfSettings.teacher_name,
        teacherAddress: pdfSettings.teacher_address,
        teacherEmail: pdfSettings.teacher_email,
        teacherPhone: pdfSettings.teacher_phone,
        brNumber: pdfSettings.br_number,
        bankDetails: pdfSettings.bank_details,
        customerName: customer.name,
        customerAddress: customer.address,
        invoiceNumber: inv.invoice_number,
        issueDate: inv.issue_date,
        dueDate: inv.due_date,
        subtotal: inv.subtotal,
        discountPercent: inv.discount_percent,
        discountAmount: inv.discount_amount,
        total: inv.total,
        paymentTerms: inv.payment_terms,
        notes: inv.notes,
        items: (currentItems as any[]).map((i: any) => ({
          description: i.description,
          lesson_date: i.lesson_date,
          hours: i.hours,
          rate: i.rate,
          amount: i.amount,
        })),
        language: (localStorage.getItem('app-language') || 'it') as 'it' | 'en',
      });

      if (download) {
        const blob = doc.output('blob');
        downloadBlob(blob, `${inv.invoice_number}.pdf`);
        setToast({ open: true, message: 'PDF ' + t('common.save') + ' ✓', severity: 'success' });
      } else {
        setPreviewPdfData(doc.output('datauristring'));
      }
    } catch (err: any) {
      setToast({ open: true, message: String(err), severity: 'error' });
    }
  };

  const handlePrint = async () => {
    if (!existingInvoice && !invoiceId) return;
    try {
      const inv = (existingInvoice || await api.invoicesGetById(invoiceId!)) as Record<string, any> | null;
      if (!inv) return;
      const customer = (await api.customersGetById(inv.customer_id as number)) as Record<string, any> | null;
      const pdfSettings = (await api.settingsGet()) as Record<string, any> | null;
      if (!customer || !pdfSettings) return;

      const { generatePDF } = await import('../utils/pdf');
      const currentItems = items.length > 0 ? items : (await api.invoiceItemsGetAll(inv.id as number)) as Record<string, any>[];
      const doc = generatePDF({
        teacherName: pdfSettings.teacher_name,
        teacherAddress: pdfSettings.teacher_address,
        teacherEmail: pdfSettings.teacher_email,
        teacherPhone: pdfSettings.teacher_phone,
        brNumber: pdfSettings.br_number,
        bankDetails: pdfSettings.bank_details,
        customerName: customer.name,
        customerAddress: customer.address,
        invoiceNumber: inv.invoice_number,
        issueDate: inv.issue_date,
        dueDate: inv.due_date,
        subtotal: inv.subtotal,
        discountPercent: inv.discount_percent,
        discountAmount: inv.discount_amount,
        total: inv.total,
        paymentTerms: inv.payment_terms,
        notes: inv.notes,
        items: (currentItems as any[]).map((i: any) => ({
          description: i.description,
          lesson_date: i.lesson_date,
          hours: i.hours,
          rate: i.rate,
          amount: i.amount,
        })),
        language: (localStorage.getItem('app-language') || 'it') as 'it' | 'en',
      });

      // Open PDF in a hidden window and print
      const pdfDataUri = doc.output('datauristring');
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html><head><title>${inv.invoice_number}</title></head>
          <body style="margin:0"><iframe width="100%" height="100%"
            src="${pdfDataUri}"></iframe></body></html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 500);
      }
    } catch (err: any) {
      setToast({ open: true, message: String(err), severity: 'error' });
    }
  };

  const handleDuplicate = async () => {
    if (!existingInvoice) return;
    try {
      const invoiceNum = await api.settingsGenerateInvoiceNumber();
      const newId: number = await api.invoicesCreate({
        issue_date: formatDateISO(new Date().toISOString()),
        due_date: dueDate,
        customer_id: customerId,
        status: 'draft',
        currency: 'HKD',
        invoice_number: invoiceNum,
        discount_percent: discountPercent,
        notes: notes || null,
        payment_terms: paymentTerms || null,
      });
      for (const item of items) {
        await api.invoiceItemsAdd(newId, {
          description: item.description,
          lesson_date: item.lesson_date || null,
          hours: item.hours,
          rate: 0,
        });
      }
      await api.invoicesRecalculateTotals(newId);
      setToast({ open: true, message: t('common.duplicate') + ' ✓', severity: 'success' });
      setTimeout(() => navigate(`/invoices/${newId}`), 800);
    } catch (err: any) {
      setToast({ open: true, message: String(err), severity: 'error' });
    }
  };

  const subtotal = items.reduce((sum, i) => sum + i.amount, 0);
  const discountAmount = subtotal * (discountPercent / 100);
  const total = subtotal - discountAmount;

  return (
    <Box sx={{ maxWidth: 1100 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => {
          if (isDirty) {
            setDiscardDialog(true);
          } else {
            navigate('/invoices');
          }
        }}>
          {t('common.back')}
        </Button>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>
          {isNew ? t('invoices.new') : `${t('invoices.number')}: ${existingInvoice?.invoice_number || ''}`}
        </Typography>
        {existingInvoice && (
          <>
            <Button startIcon={<PrintIcon />} onClick={handlePrint}>
              {t('common.print')}
            </Button>
            <Button startIcon={<ContentCopyIcon />} onClick={handleDuplicate}>
              {t('common.duplicate')}
            </Button>
            <Button startIcon={<PictureAsPdfIcon />} onClick={() => handleExportPDF(false)}>
              {t('common.preview')}
            </Button>
            <Button startIcon={<PictureAsPdfIcon />} onClick={() => handleExportPDF(true)}>
              {t('invoices.exportPdf')}
            </Button>
          </>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Left column: metadata */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper sx={{ p: 2 }}>
            <TextField
              fullWidth
              label={t('invoices.number')}
              value={invoiceNumber || ''}
              onChange={e => { setInvoiceNumber(e.target.value); setInvoiceNumberError(''); invoiceNumberEdited.current = true; }}
              size="small"
              sx={{ mb: 2 }}
              error={!!invoiceNumberError}
              helperText={invoiceNumberError || ''}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>{t('invoices.customer')}</Typography>
            <Autocomplete
              options={customers}
              getOptionLabel={opt => opt.name}
              value={customers.find(c => c.id === customerId) || null}
              onChange={(_, v) => setCustomerId(v?.id || null)}
              renderInput={params => <TextField {...params} label={t('invoices.selectCustomer')} required />}
              size="small"
              sx={{ mb: 2 }}
            />

            <TextField fullWidth label={t('invoices.date')} type="date" size="small"
              value={issueDate} onChange={e => setIssueDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }} sx={{ mb: 2 }} />

            <TextField fullWidth label={t('invoices.dueDate')} type="date" size="small"
              value={dueDate} onChange={e => setDueDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }} sx={{ mb: 2 }} />

            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>{t('invoices.status')}</InputLabel>
              <Select value={status} label={t('invoices.status')} onChange={e => setStatus(e.target.value)}>
                <MenuItem value="draft">{t('invoices.draft')}</MenuItem>
                <MenuItem value="sent">{t('invoices.sent')}</MenuItem>
                <MenuItem value="paid">{t('invoices.paid')}</MenuItem>
                <MenuItem value="cancelled">{t('invoices.cancelled')}</MenuItem>
              </Select>
            </FormControl>

            <TextField fullWidth label={t('invoices.paymentTerms')} size="small"
              value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)}
              helperText={t('wizard.paymentTermsHelp')}
              sx={{ mb: 2 }} />

            <TextField fullWidth label={t('invoices.discount')} type="number" size="small"
              value={discountPercent} onChange={e => setDiscountPercent(parseFloat(e.target.value) || 0)}
              slotProps={{ htmlInput: { min: 0, max: 100 } }} />

            <TextField fullWidth label={t('invoices.notes')} size="small" multiline rows={3}
              value={notes} onChange={e => setNotes(e.target.value)} sx={{ mt: 2 }} />
          </Paper>
        </Grid>

        {/* Right column: items */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <InvoiceItemsTable
              items={items}
              onChange={setItems}
              customerId={customerId}
              readOnly={!isNew && !existingInvoice}
            />
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Box sx={{ textAlign: 'right', minWidth: 250 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('invoices.subtotal')}: {subtotal.toFixed(2)} HKD
                </Typography>
                {discountPercent > 0 && (
                  <Typography variant="body2" color="error">
                    {t('invoices.discount')} ({discountPercent}%): -{discountAmount.toFixed(2)} HKD
                  </Typography>
                )}
                <Divider sx={{ my: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {t('invoices.total')}: {total.toFixed(2)} HKD
                </Typography>
              </Box>
            </Box>
          </Paper>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
            {isNew && (
              <Button variant="contained" startIcon={<SaveIcon />}
                onClick={() => handleSave('draft')}
                disabled={saving || !customerId}>
                {t('invoices.saveDraft')}
              </Button>
            )}
            {(isNew || existingInvoice) && (
              <Button variant="contained" color="success" startIcon={<SaveIcon />}
                onClick={() => {
                  setPendingSaveStatus(status);
                  setReviewDialog(true);
                }}
                disabled={saving || (!customerId && isNew)}>
                {t('common.save')}
              </Button>
            )}
          </Box>
        </Grid>
      </Grid>

      <ConfirmDialog
        open={discardDialog}
        title={t('common.confirm')}
        message={t('invoices.unsavedChanges')}
        confirmLabel={t('common.discard')}
        cancelLabel={t('common.cancel')}
        confirmColor="warning"
        onConfirm={() => {
          setDiscardDialog(false);
          navigate('/invoices');
        }}
        onCancel={() => setDiscardDialog(false)}
      />

      {/* Review Dialog */}
      <Dialog open={reviewDialog} onClose={() => setReviewDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('common.review') || 'Review'}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>{t('invoices.customer')}:</strong> {customers.find(c => c.id === customerId)?.name || '-'}
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>{t('invoices.date')}:</strong> {issueDate}
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>{t('invoices.dueDate')}:</strong> {dueDate}
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>{t('invoices.status')}:</strong> {t(`invoices.${pendingSaveStatus}`)}
          </Typography>
          <Divider sx={{ my: 1 }} />
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>{t('invoices.items')}:</strong> {items.length}
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>{t('invoices.subtotal')}:</strong> {subtotal.toFixed(2)} HKD
          </Typography>
          {discountPercent > 0 && (
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>{t('invoices.discount')}:</strong> {discountPercent}% (-{discountAmount.toFixed(2)} HKD)
            </Typography>
          )}
          <Divider sx={{ my: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {t('invoices.total')}: {total.toFixed(2)} HKD
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialog(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" color="primary" onClick={() => {
            setReviewDialog(false);
            handleSave(pendingSaveStatus);
          }}>
            {t('common.confirmSave') || 'Confirm & Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={3000}
        onClose={() => setToast(t => ({ ...t, open: false }))}>
        <Alert severity={toast.severity} variant="filled">{toast.message}</Alert>
      </Snackbar>

      <PDFPreviewDialog
        open={!!previewPdfData}
        onClose={() => setPreviewPdfData(null)}
        pdfData={previewPdfData}
        fileName={existingInvoice ? `${existingInvoice.invoice_number}.pdf` : 'invoice.pdf'}
      />
    </Box>
  );
}
