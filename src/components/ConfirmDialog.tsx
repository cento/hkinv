import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  Button, Box, Typography
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import InboxIcon from '@mui/icons-material/Inbox';

interface Props {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: 'error' | 'primary' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
}

export function EmptyState(props: React.HTMLAttributes<HTMLDivElement> & { message?: string; actionLabel?: string; onAction?: () => void }) {
  const { message, actionLabel, onAction, ...divProps } = props;
  return (
    <Box {...divProps} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', p: 4 }}>
      <InboxIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        {message}
      </Typography>
      {actionLabel && onAction && (
        <Button variant="outlined" size="small" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  confirmColor = 'error',
  onConfirm,
  onCancel,
}: Props) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>{title || t('common.delete')}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>{cancelLabel || t('common.cancel')}</Button>
        <Button color={confirmColor} variant="contained" onClick={onConfirm}>
          {confirmLabel || t('common.delete')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
