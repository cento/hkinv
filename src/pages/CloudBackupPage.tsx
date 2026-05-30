import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Button, Paper, List, ListItem,
  ListItemIcon, ListItemText, Divider,
} from '@mui/material';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';
import { configureBackupLocation, getStoredBackupFileName, clearStoredBackupHandle, supportsFSA, saveHKINVFile, downloadBlob } from '../database/fsa';
import { getDatabase } from '../database/connection';
import { getLastBackupTime, isBackupConfigured } from '../database/backup';

export default function CloudBackupPage() {
  const { t } = useTranslation();
  const [backupName, setBackupName] = useState<string | null>(null);
  const [backupTime, setBackupTime] = useState<Date | null>(null);
  const [configured, setConfigured] = useState(false);
  const [, setToast] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  useEffect(() => {
    setBackupName(getStoredBackupFileName());
    setBackupTime(getLastBackupTime());
    setConfigured(isBackupConfigured());
  }, []);

  const handleSetup = async () => {
    const ok = await configureBackupLocation();
    if (ok) {
      setBackupName(getStoredBackupFileName());
      setConfigured(true);
      setToast({ open: true, message: t('welcome.backupConfigured'), severity: 'success' });
    }
  };

  const handleExportForCloud = async () => {
    try {
      const db = getDatabase();
      const data = new Uint8Array(db.export());
      const suggestedName = backupName || `hkinv-backup-${new Date().toISOString().split('T')[0]}.hkinv`;

      if (supportsFSA()) {
        const handle = await saveHKINVFile(data.buffer, suggestedName);
        if (handle) {
          setToast({ open: true, message: t('common.save') + ' ✓', severity: 'success' });
          return;
        }
      }

      const blob = new Blob([data], { type: 'application/octet-stream' });
      downloadBlob(blob, suggestedName);
      setToast({ open: true, message: t('common.save') + ' ✓', severity: 'success' });
    } catch (err: any) {
      setToast({ open: true, message: String(err), severity: 'error' });
    }
  };

  return (
    <Box sx={{ maxWidth: 800 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>{t('cloudBackup.title') || 'Cloud Backup'}</Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>{t('cloudBackup.backupFile') || 'Backup file'}</Typography>
        <List dense>
          <ListItem>
            <ListItemIcon><InfoIcon fontSize="small" /></ListItemIcon>
            <ListItemText
              primary={t('cloudBackup.howTo') || 'How to back up to Google Drive'}
              secondary={t('cloudBackup.howToDesc') || 'Click "Save to Drive" below, then choose "Google Drive" from the file picker. Your database will be saved as a .hkinv file.'}
            />
          </ListItem>
          <ListItem>
            <ListItemIcon><CheckCircleIcon fontSize="small" color="success" /></ListItemIcon>
            <ListItemText
              primary={t('cloudBackup.autoBackup') || 'Automatic backup'}
              secondary={configured
                ? t('cloudBackup.configuredTo', { name: backupName || 'configured' })
                : (t('cloudBackup.notConfigured') || 'Not configured')}
            />
          </ListItem>
          {backupTime && (
            <ListItem>
              <ListItemIcon><CheckCircleIcon fontSize="small" color="info" /></ListItemIcon>
              <ListItemText
                primary={t('cloudBackup.lastBackup') || 'Last backup'}
                secondary={backupTime.toLocaleString()}
              />
            </ListItem>
          )}
        </List>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button variant="contained" startIcon={<FolderOpenIcon />} onClick={handleSetup}>
            {configured ? (t('cloudBackup.changeLocation') || 'Change location') : (t('cloudBackup.setupBackup') || 'Set up backup')}
          </Button>
          <Button variant="outlined" startIcon={<SaveAltIcon />} onClick={handleExportForCloud}>
            {t('cloudBackup.saveToDrive') || 'Save to Drive'}
          </Button>
          {configured && (
            <Button variant="text" color="error" onClick={() => {
              clearStoredBackupHandle();
              setConfigured(false);
              setBackupName(null);
              setToast({ open: true, message: t('cloudBackup.removed') || 'Backup location removed', severity: 'success' });
            }}>
              {t('cloudBackup.remove') || 'Remove backup'}
            </Button>
          )}
        </Box>

        <Box sx={{ mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {t('cloudBackup.driveNote') || '💡 Tip: If you have Google Drive for Desktop installed, it appears as a folder in the Windows file picker. Save your .hkinv file there and it syncs automatically.'}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
