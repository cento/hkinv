import { createTheme } from '@mui/material/styles';

export function getTheme(darkMode: boolean) {
  return createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#1a73e8',
        light: '#4791db',
        dark: '#0d47a1',
      },
      secondary: {
        main: '#00bcd4',
        light: '#4dd0e1',
        dark: '#008394',
      },
      background: darkMode
        ? { default: '#121212', paper: '#1e1e1e' }
        : { default: '#f5f5f5', paper: '#ffffff' },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h4: { fontWeight: 600 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
          },
        },
      },
      MuiDataGrid: {
        styleOverrides: {
          root: {
            border: 'none',
          },
        },
      },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
  });
}

const theme = getTheme(false);
export default theme;