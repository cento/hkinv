import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Typography, Container, Paper, Stack, Snackbar, Alert, Divider, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import BackupIcon from '@mui/icons-material/Backup';
import { useAppContext } from '../contexts/AppContext';
import { createDatabase, importDatabase, openDatabase } from '../database/connection';
import { hasExistingDB } from '../database/opfs';
import { openHKINVFile, configureBackupLocation, storeBackupHandle, getStoredBackupFileName } from '../database/fsa';
import { hasSettings } from '../database/settings';
import { runMigrations } from '../database/migrations';
import { getDatabase } from '../database/connection';
import { startBackupTimer } from '../database/backup';

const RECENT_KEY = 'recent-archives';
const MAX_RECENT = 5;

function getRecentFiles(): { name: string; lastOpened: string }[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
  } catch { return []; }
}

function addRecentFile(name: string): void {
  const list = getRecentFiles().filter(r => r.name !== name);
  list.unshift({ name, lastOpened: new Date().toISOString() });
  localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, MAX_RECENT)));
}

export default function WelcomePage() {
  const { t } = useTranslation();
  const { setDbPath, setDbOpen, setSettingsComplete } = useAppContext();
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const [hasDB, setHasDB] = useState(false);
  const [recent, setRecent] = useState<{ name: string; lastOpened: string }[]>([]);
  const [activeArchive, setActiveArchive] = useState<string | null>(null);

  useEffect(() => {
    hasExistingDB().then(setHasDB);
    setRecent(getRecentFiles());
    setActiveArchive(getStoredBackupFileName());
  }, []);

  const afterDbOpen = (fileName?: string) => {
    const db = getDatabase();
    runMigrations(db);
    if (fileName) {
      addRecentFile(fileName);
      setRecent(getRecentFiles());
    }
    setDbPath(fileName || 'hkinv');
    setDbOpen(true);
    const complete = hasSettings();
    setSettingsComplete(complete);
  };

  const handleCreateDb = async () => {
    try {
      await createDatabase();
      afterDbOpen();
    } catch (err: any) {
      setToast({ open: true, message: t('common.error') + ': ' + String(err), severity: 'error' });
    }
  };

  const handleOpenDb = async () => {
    try {
      const result = await openHKINVFile();
      if (!result) return;
      await importDatabase(result.data);
      let fileName = 'archive.hkinv';
      if (result.handle) {
        const file = await result.handle.getFile();
        fileName = file.name;
        await storeBackupHandle(result.handle);
        startBackupTimer();
      }
      afterDbOpen(fileName);
    } catch (err: any) {
      setToast({ open: true, message: t('common.error') + ': ' + String(err), severity: 'error' });
    }
  };

  const handleOpenExisting = async () => {
    try {
      await openDatabase();
      const backupName = getStoredBackupFileName();
      afterDbOpen(backupName || undefined);
    } catch (err: any) {
      setToast({ open: true, message: t('common.error') + ': ' + String(err), severity: 'error' });
    }
  };

  const handleConfigureBackup = async () => {
    const ok = await configureBackupLocation();
    if (ok) {
      startBackupTimer();
      setToast({ open: true, message: 'Backup location configured ✓', severity: 'success' });
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 6, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
          {t('app.title')}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
          {t('app.subtitle')}
        </Typography>

        <Stack spacing={2}>
          <Button
            variant="contained"
            size="large"
            startIcon={<CreateNewFolderIcon />}
            onClick={handleCreateDb}
            sx={{ px: 4, py: 1.5 }}
          >
            {t('welcome.newDb')}
          </Button>
          <Button
            variant="outlined"
            size="large"
            startIcon={<FolderOpenIcon />}
            onClick={handleOpenDb}
            sx={{ px: 4, py: 1.5 }}
          >
            {t('welcome.openDb')}
          </Button>
          {hasDB && (
            <Button
              variant="outlined"
              size="large"
              startIcon={<InsertDriveFileIcon />}
              onClick={handleOpenExisting}
              sx={{ px: 4, py: 1.5, textTransform: 'none' }}
              color="inherit"
            >
              Continue with{activeArchive ? ` ${activeArchive}` : ' existing archive'}
            </Button>
          )}
        </Stack>

        {hasDB && (
          <Button
            variant="text"
            size="small"
            startIcon={<BackupIcon />}
            onClick={handleConfigureBackup}
            sx={{ mt: 2, opacity: 0.7 }}
          >
            Set backup location
          </Button>
        )}

        {recent.length > 0 && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, textAlign: 'left' }}>
              {t('welcome.lastOpened')}
            </Typography>
            <List dense>
              {recent.map((r, i) => (
                <ListItem key={i} sx={{ borderRadius: 1 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <InsertDriveFileIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={r.name}
                    secondary={new Date(r.lastOpened).toLocaleString()}
                    slotProps={{ primary: { variant: 'body2', noWrap: true }, secondary: { variant: 'caption' } }}
                  />
                </ListItem>
              ))}
            </List>
          </>
        )}

        <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
          {t('welcome.createNew')}
        </Typography>
      </Paper>

      <Snackbar open={toast.open} autoHideDuration={4000}
        onClose={() => setToast(t => ({ ...t, open: false }))}>
        <Alert severity={toast.severity} variant="filled">{toast.message}</Alert>
      </Snackbar>
    </Container>
  );
}
