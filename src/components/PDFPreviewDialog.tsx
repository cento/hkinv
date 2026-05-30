import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { downloadBlob } from '../database/fsa';

interface Props {
  open: boolean;
  onClose: () => void;
  pdfData: string | null;
  fileName?: string;
}

export default function PDFPreviewDialog({ open, onClose, pdfData, fileName }: Props) {
  const { t } = useTranslation();

  const handleDownload = () => {
    if (!pdfData) return;
    const byteString = atob(pdfData.split(',')[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: 'application/pdf' });
    downloadBlob(blob, fileName || 'invoice.pdf');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>{t('invoices.exportPdf')}</DialogTitle>
      <DialogContent sx={{ height: '70vh', p: 0 }}>
        {pdfData ? (
          <iframe
            src={pdfData}
            title="PDF Preview"
            width="100%"
            height="100%"
            style={{ border: 'none' }}
          />
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            {t('common.loading')}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.close')}</Button>
        <Button variant="contained" onClick={handleDownload} disabled={!pdfData}>
          {t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
