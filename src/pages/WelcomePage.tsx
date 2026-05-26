import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Typography, Container, Paper, Stack, List, ListItemButton, ListItemIcon, ListItemText, Divider, Snackbar, Alert } from '@mui/material';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { useAppContext } from '../contexts/AppContext';

const RECENT_KEY = 'recent-archives';
const MAX_RECENT = 5;

function getRecentArchives(): string[] {
  try {
    const stored = localStorage.getItem(RECENT_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

function addRecentArchive(path: string): void {
  const list = getRecentArchives().filter(p => p !== path);
  list.unshift(path);
  localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, MAX_RECENT)));
}

export default function WelcomePage() {
  const { t } = useTranslation();
  const { setDbPath, setDbOpen, setSettingsComplete } = useAppContext();
  const [recent, setRecent] = useState<string[]>([]);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'error' }>({ open: false, message: '', severity: 'error' as const });

  useEffect(() => {
    setRecent(getRecentArchives());
  }, []);

  const openDb = async (filePath?: string) => {
    let path = filePath;
    if (!path) {
      const result = await window.api.dialogOpenFile();
      if (result.canceled || !result.filePaths?.[0]) return;
      path = result.filePaths[0];
    }

    const dbResult = await window.api.dbOpen(path);
    if (dbResult.success) {
      addRecentArchive(path);
      setDbPath(path);
      setDbOpen(true);
      const hasSettings = await window.api.settingsHas();
      setSettingsComplete(hasSettings);
    } else {
      setToast({ open: true, message: t('common.error') + ': ' + dbResult.error, severity: 'error' });
    }
  };

  const handleCreateDb = async () => {
    const result = await window.api.dialogSaveFile('mio-archivio.hkinv');
    if (result.canceled || !result.filePath) return;

    const dbResult = await window.api.dbCreate(result.filePath);
    if (dbResult.success) {
      addRecentArchive(result.filePath);
      setDbPath(result.filePath);
      setDbOpen(true);
      const hasSettings = await window.api.settingsHas();
      setSettingsComplete(hasSettings);
    } else {
      setToast({ open: true, message: t('common.error') + ': ' + dbResult.error, severity: 'error' });
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

        <Stack spacing={2} direction="row" sx={{ justifyContent: 'center' }}>
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
            onClick={() => openDb()}
            sx={{ px: 4, py: 1.5 }}
          >
            {t('welcome.openDb')}
          </Button>
          <Button
            variant="text"
            size="large"
            sx={{ px: 4, py: 1.5 }}
          >
            {t('welcome.importDb')}
          </Button>
        </Stack>

        {recent.length > 0 && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, textAlign: 'left' }}>
              {t('welcome.lastOpened')}
            </Typography>
            <List dense>
              {recent.map((p, i) => (
                <ListItemButton key={i} onClick={() => openDb(p)} sx={{ borderRadius: 1 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <InsertDriveFileIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={p.split('\\').pop() || p}
                    secondary={p}
                    slotProps={{ primary: { variant: 'body2', noWrap: true }, secondary: { variant: 'caption', noWrap: true } }}
                  />
                </ListItemButton>
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
