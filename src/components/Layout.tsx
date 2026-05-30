import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Snackbar,
  Alert,
} from '@mui/material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PeopleIcon from '@mui/icons-material/People';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MenuIcon from '@mui/icons-material/Menu';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import BackupIcon from '@mui/icons-material/Backup';
import SaveIcon from '@mui/icons-material/Save';
import { useAppContext } from '../contexts/AppContext';
import { changeLanguage } from '../i18n/index';
import { isBackupConfigured, getBackupFileName, getLastBackupTime, triggerBackup } from '../database/backup';
import { configureBackupLocation } from '../database/fsa';

const DRAWER_WIDTH = 240;

interface LayoutProps {
  children: React.ReactNode;
}

function BackupIndicator() {
  const { t } = useTranslation();
  const configured = isBackupConfigured();
  const fileName = getBackupFileName();
  const lastBackup = getLastBackupTime();
  const { state } = useAppContext();

  const displayPath = fileName || state.dbPath || '';

  const title = configured
    ? `${t('layout.backupEnabled')}${fileName ? ` (${fileName})` : ''}${lastBackup ? ` — ${lastBackup.toLocaleTimeString()}` : ''}`
    : t('layout.backupNotConfigured');

  const handleBackupNow = async () => {
    let result = await triggerBackup(true);
    if (!result) {
      const ok = await configureBackupLocation();
      if (ok) {
        result = await triggerBackup(true);
      }
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      {displayPath && (
        <Typography variant="caption" sx={{ opacity: 0.7, mr: 1 }} noWrap>
          {displayPath}
        </Typography>
      )}
      {configured && (
        <Tooltip title={title}>
          <IconButton
            size="small"
            color="success"
            onClick={handleBackupNow}
            sx={{ opacity: 0.8 }}
            aria-label={title}
          >
            <BackupIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      <Tooltip title={t('layout.saveToFile')}>
        <IconButton size="small" color="inherit" onClick={handleBackupNow} sx={{ opacity: 0.7 }}>
          <SaveIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

export default function Layout({ children }: LayoutProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { state, setLanguage, toggleDarkMode } = useAppContext();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [backupToast, setBackupToast] = React.useState<{ open: boolean; message: string; severity: 'success' | 'info' | 'error' }>({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { success: boolean; manual: boolean };
      if (detail.success) {
        const label = detail.manual ? t('layout.saved') : t('layout.autoBackupDone');
        setBackupToast({ open: true, message: label + ' ✓', severity: 'success' });
      } else if (detail.manual) {
        setBackupToast({ open: true, message: t('layout.backupNotConfigured'), severity: 'info' });
      }
    };
    window.addEventListener('hkinv:backup', handler);
    return () => window.removeEventListener('hkinv:backup', handler);
  }, []);

  const menuItems = [
    { text: t('nav.dashboard'), icon: <DashboardIcon />, path: '/dashboard' },
    { text: t('nav.invoices'), icon: <ReceiptLongIcon />, path: '/invoices' },
    { text: t('nav.customers'), icon: <PeopleIcon />, path: '/customers' },
    { text: t('nav.serviceTypes'), icon: <LocalOfferIcon />, path: '/service-types' },
    { text: t('nav.taxReports'), icon: <AssessmentIcon />, path: '/tax-reports' },
    { text: t('nav.settings'), icon: <SettingsIcon />, path: '/settings' },
  ];

  const handleLangChange = (_: React.MouseEvent<HTMLElement>, newLang: string | null) => {
    if (newLang) {
      changeLanguage(newLang);
      setLanguage(newLang);
    }
  };

  const drawer = (
    <Box>
      <Toolbar>
        <Typography variant="h6" noWrap sx={{ fontWeight: 700 }}>
          HK Inv
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map(item => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname.startsWith(item.path)}
              onClick={() => {
                navigate(item.path);
                setMobileOpen(false);
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
        <ToggleButtonGroup
          value={i18n.language}
          exclusive
          onChange={handleLangChange}
          size="small"
        >
          <ToggleButton value="it">IT</ToggleButton>
          <ToggleButton value="en">EN</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <Box sx={{ p: '0 16px 16px', display: 'flex', justifyContent: 'center' }}>
        <IconButton onClick={toggleDarkMode} size="small" color="inherit" aria-label={t('settings.darkMode')}>
          {state.isDarkMode ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
        </IconButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <Box component="a" href="#main-content" sx={{
        position: 'absolute', left: -9999, zIndex: 9999,
        '&:focus': { left: 16, top: 80, bgcolor: 'background.paper', p: 1 },
      }}>
        {t('common.skipToContent') || 'Skip to content'}
      </Box>

      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { sm: `${DRAWER_WIDTH}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen(!mobileOpen)}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
            {t('app.title')}
          </Typography>
          {state.isDbOpen && <BackupIndicator />}
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        id="main-content"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: 8,
        }}
      >
        {children}
      </Box>

      <Snackbar
        open={backupToast.open}
        autoHideDuration={3000}
        onClose={() => setBackupToast(t => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={backupToast.severity} variant="filled" sx={{ minWidth: 200 }}>
          {backupToast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
