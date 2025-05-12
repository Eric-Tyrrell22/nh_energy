// frontend/src/App.tsx
import React from 'react';
import { Routes, Route, useParams, Link as RouterLink } from 'react-router-dom';
import { Container, Typography, List, ListItem, ListItemText, Paper, IconButton, AppBar, Toolbar } from '@mui/material';
import EnergyPlanExplorerPage from './components/EnergyPlanExplorerPage';
import HomeIcon from '@mui/icons-material/Home';
import ElectricalServicesIcon from '@mui/icons-material/ElectricalServices';

// Define available providers here
// The key is used in the URL, the name for display, and file for the JSON data.
const availableProviders = [
  { key: 'Eversource', name: 'Eversource', file: 'Eversource.json' },
  { key: 'Liberty', name: 'Liberty', file: 'Liberty.json' }, // Example for another provider
  { key: 'NHEC', name: 'NHEC', file: 'NHEC.json' }, // Example for another provider
  { key: 'Unitil', name: 'Unitil', file: 'Unitil.json' }, // Example for another provider
  // Add more providers here
  // { key: 'another_provider', name: 'Another Provider Inc.', file: 'another_provider.json' },
];

function ProviderSelectionPage() {
  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Select Utility Provider
        </Typography>
        <List>
          {availableProviders.map((provider) => (
            <ListItem 
              button 
              component={RouterLink} 
              to={`/plans/${provider.key}`} 
              key={provider.key}
              sx={{ 
                border: '1px solid', 
                borderColor: 'divider', 
                borderRadius: 1, 
                mb: 1,
                '&:hover': { borderColor: 'primary.main', backgroundColor: 'action.hover' }
              }}
            >
              <ElectricalServicesIcon sx={{mr:2, color: 'primary.main'}} />
              <ListItemText primary={provider.name} secondary={`View plans for ${provider.name}`} />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Container>
  );
}

function EnergyPlanExplorerWrapper() {
  const { providerKey } = useParams<{ providerKey: string }>();
  const provider = availableProviders.find(p => p.key === providerKey);

  if (!provider) {
    return (
      <Container sx={{mt: 5}}>
        <Alert severity="error">
          Provider not found. Please select a provider from the <RouterLink to="/">homepage</RouterLink>.
        </Alert>
      </Container>
    );
  }
  
  const dataUrl = `${import.meta.env.BASE_URL}data/${provider.file}`;
  return <EnergyPlanExplorerPage providerDataUrl={dataUrl} providerName={provider.name} />;
}

function App() {
  return (
    <>
      <AppBar position="static" sx={{ mb: 2 }}>
        <Toolbar>
          <IconButton component={RouterLink} to="/" edge="start" color="inherit" aria-label="home" sx={{ mr: 2 }}>
            <HomeIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Utility Plan Finder
          </Typography>
        </Toolbar>
      </AppBar>
      <Routes>
        <Route path="/" element={<ProviderSelectionPage />} />
        <Route path="/plans/:providerKey" element={<EnergyPlanExplorerWrapper />} />
      </Routes>
    </>
  );
}

export default App;
