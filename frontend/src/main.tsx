// frontend/src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css'; // You might want to clear this out or keep minimal resets
import { ThemeProvider, createTheme, alpha } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// More polished theme
const theme = createTheme({
  palette: {
    mode: 'light', // Explicitly light mode
    primary: {
      main: '#00796b', // A calm teal
      light: '#48a999',
      dark: '#004c40',
    },
    secondary: {
      main: '#fbc02d', // A contrasting yellow/gold for accents if needed
    },
    background: {
      default: '#f4f6f8', // Slightly off-white background
      paper: '#ffffff',   // Paper elements will be white
    },
    text: {
      primary: '#263238', // Dark grey for primary text (good contrast)
      secondary: '#546e7a', // Lighter grey for secondary text
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h3: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8, // Slightly softer corners for paper
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none', // More modern button text
        }
      }
    },
    MuiTableSortLabel: {
        styleOverrides: {
            root: {
                '&.Mui-active': {
                    color: '#00796b', // Primary color for active sort label
                },
                '& .MuiTableSortLabel-icon': {
                    '&.Mui-active': {
                        color: '#00796b',
                    },
                },
            },
        },
    },
    MuiSlider: {
        styleOverrides: {
            root: {
                color: '#00796b', // Primary color for slider
            }
        }
    },
    MuiCheckbox: {
        styleOverrides: {
            root: {
                color: '#00796b', // Primary color for checkbox
                '&.Mui-checked': {
                    color: '#00796b',
                },
            }
        }
    },
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* Normalize CSS and apply theme background */}
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);
