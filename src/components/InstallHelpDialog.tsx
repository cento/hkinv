import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import GetAppIcon from "@mui/icons-material/GetApp";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import CheckIcon from "@mui/icons-material/Check";

interface InstallHelpDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function InstallHelpDialog({
  open,
  onClose,
}: InstallHelpDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Install HK Invoice Manager</DialogTitle>
      <DialogContent>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Install this app for quick access and a dedicated window without
          browser tabs.
        </Typography>

        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          Google Chrome (Desktop):
        </Typography>
        <List dense>
          <ListItem>
            <ListItemIcon>
              <MoreVertIcon />
            </ListItemIcon>
            <ListItemText primary="1. Click the ⋮ menu (three dots) in the top-right corner" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <GetAppIcon />
            </ListItemIcon>
            <ListItemText
              primary='2. Select "Cast, save, and share" → "Install page as app..."'
              secondary="(or 'Install HK Invoice Manager...' if available)"
            />
          </ListItem>
        </List>

        <Typography variant="subtitle2" sx={{ mb: 1, mt: 2, fontWeight: 600 }}>
          Google Chrome (Android):
        </Typography>
        <List dense>
          <ListItem>
            <ListItemIcon>
              <MoreVertIcon />
            </ListItemIcon>
            <ListItemText primary='1. Tap ⋮ → "Add to Home screen"' />
          </ListItem>
        </List>

        <Typography variant="subtitle2" sx={{ mb: 1, mt: 2, fontWeight: 600 }}>
          Microsoft Edge:
        </Typography>
        <List dense>
          <ListItem>
            <ListItemIcon>
              <MoreVertIcon />
            </ListItemIcon>
            <ListItemText primary='1. Click "..." → "Apps" → "Install this site as an app"' />
          </ListItem>
        </List>

        <Typography variant="subtitle2" sx={{ mb: 1, mt: 2, fontWeight: 600 }}>
          Safari (macOS):
        </Typography>
        <List dense>
          <ListItem>
            <ListItemIcon>
              <CheckIcon />
            </ListItemIcon>
            <ListItemText primary='1. File → "Add to Dock..."' />
          </ListItem>
        </List>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 2, display: "block" }}
        >
          Note: If none of these options appear, make sure you're using a
          Chromium-based browser (Chrome / Edge) and the app is served over
          HTTPS.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
