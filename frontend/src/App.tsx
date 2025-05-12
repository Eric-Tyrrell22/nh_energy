// frontend/src/App.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { RawEnergyPlan, EnergyPlan } from './types';
import { useTheme, alpha } from '@mui/material/styles';

// MUI Components
import {
  Container, Typography, Box, Grid, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TableSortLabel,
  TextField, Select, MenuItem, FormControl, InputLabel, Slider, Button, IconButton,
  Tooltip, Chip
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

// Helper to parse "X months" into a number
const parseRateGoodFor = (rateString?: string | null): number => {
  if (!rateString) return 0;
  const match = rateString.match(/(\d+)\s*months?/i);
  return match ? parseInt(match[1], 10) : 0;
};

const formatDate = (date: Date | null): string => {
  if (!date) return 'N/A';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

type Order = 'asc' | 'desc';
type SortableKey = keyof Pick<EnergyPlan, 'price_per_kwh' | 'percent_renewable' | 'supplier_name' | 'rate_is_good_for_months' | 'last_updated'>;

interface HeadCell {
  id: SortableKey | keyof EnergyPlan; // Allow non-sortable keys for non-sortable columns
  label: string;
  numeric: boolean;
  sortable: boolean;
  minWidth?: number;
  align?: 'left' | 'right' | 'center';
  render?: (value: any, plan: EnergyPlan) => React.ReactNode;
}

const headCells: readonly HeadCell[] = [
  { id: 'supplier_name', numeric: false, label: 'Supplier', sortable: true, minWidth: 170 },
  { id: 'plan_name', numeric: false, label: 'Plan Name', sortable: false, minWidth: 200 },
  {
    id: 'price_per_kwh', numeric: true, label: 'Price/kWh', sortable: true, minWidth: 120, align: 'right',
    render: (value) => value === null ? 'N/A' : `$${Number(value).toFixed(4)}`
  },
  {
    id: 'pricing_type', numeric: false, label: 'Type', sortable: false, minWidth: 100,
    render: (value) => <Chip label={value} size="small" color={value === "Fixed" ? "primary" : value === "Variable" ? "secondary" : "default"} variant="outlined" />
  },
  {
    id: 'percent_renewable', numeric: true, label: 'Renewable', sortable: true, minWidth: 120, align: 'right',
    render: (value) => `${Number(value).toFixed(1)}%`
  },
  {
    id: 'rate_is_good_for_months', numeric: true, label: 'Term', sortable: true, minWidth: 100, align: 'right',
    render: (value, plan) => value > 0 ? `${value} mo` : (plan.rate_is_good_for || 'N/A')
  },
  {
    id: 'has_cancellation_fee', numeric: false, label: 'Cancel Fee', sortable: false, minWidth: 100, align: 'center',
    render: (value) => value ? 'Yes' : 'No'
  },
  {
    id: 'last_updated', numeric: false, label: 'Updated', sortable: true, minWidth: 120,
    render: (value) => formatDate(value as Date | null)
  },
  {
    id: 'comments', numeric: false, label: 'Details', sortable: false, minWidth: 80, align: 'center',
    render: (value, plan) => plan.comments ? (
      <Tooltip title={<div style={{ whiteSpace: 'pre-line' }}>{plan.comments}</div>} arrow>
        <IconButton size="small"><InfoOutlinedIcon fontSize="small" /></IconButton>
      </Tooltip>
    ) : '-'
  },
];

interface Filters {
  supplier_name: string;
  pricing_type: '' | 'Fixed' | 'Variable';
  percent_renewable: number[];
  has_cancellation_fee: '' | 'true' | 'false';
  is_monthly_charge: '' | 'true' | 'false';
}

const initialFilters: Filters = {
  supplier_name: '',
  pricing_type: '',
  percent_renewable: [0, 100],
  has_cancellation_fee: '',
  is_monthly_charge: '',
};

function App() {
  const theme = useTheme();
  const [allPlans, setAllPlans] = useState<EnergyPlan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Sorting State
  const [primaryOrderBy, setPrimaryOrderBy] = useState<SortableKey>('percent_renewable');
  const [primaryOrder, setPrimaryOrder] = useState<Order>('desc');
  const secondaryOrderBy: keyof Pick<EnergyPlan, 'price_per_kwh'> = 'price_per_kwh'; // Always price
  const secondaryOrder: Order = 'asc'; // Always ascending for price

  const [filters, setFilters] = useState<Filters>(initialFilters);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}data/supplier_data.json`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const rawData: RawEnergyPlan[] = await response.json();
        const processedData: EnergyPlan[] = rawData.map((plan, index) => ({
          supplier_name: plan.supplier_name || `Unknown Supplier ${index + 1}`,
          plan_name: plan.plan_name || `Unnamed Plan ${index + 1}`,
          price_per_kwh: plan.price_per_kwh === undefined ? null : plan.price_per_kwh,
          last_updated: plan.last_updated ? new Date(plan.last_updated) : null,
          pricing_type: (plan.pricing_type === "Fixed" || plan.pricing_type === "Variable") ? plan.pricing_type : "Unknown",
          is_monthly_charge: plan.is_monthly_charge ?? false,
          is_intro_price: plan.is_intro_price ?? false,
          has_cancellation_fee: plan.has_cancellation_fee ?? false,
          percent_renewable: plan.percent_renewable ?? 0,
          rate_is_good_for: plan.rate_is_good_for || '',
          rate_is_good_for_months: parseRateGoodFor(plan.rate_is_good_for),
          rate_end: plan.rate_end || '',
          comments: plan.comments || '',
        }));
        setAllPlans(processedData);
      } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
      finally { setLoading(false); }
    };
    fetchPlans();
  }, []);

  const handleFilterChange = useCallback(<K extends keyof Filters>(filterName: K, value: Filters[K]) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  const handleRequestSort = (property: SortableKey) => {
    const isCurrentPrimary = primaryOrderBy === property;
    if (isCurrentPrimary) {
      setPrimaryOrder(primaryOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setPrimaryOrderBy(property);
      // Default sort direction when changing column
      if (property === 'price_per_kwh' || property === 'rate_is_good_for_months') {
        setPrimaryOrder('asc');
      } else if (property === 'percent_renewable') {
        setPrimaryOrder('desc');
      } else { // supplier_name, last_updated
        setPrimaryOrder('asc');
      }
    }
  };

  const filteredAndSortedPlans = useMemo(() => {
    let currentPlans = [...allPlans];

    // Filtering logic (same as before)
    if (filters.supplier_name) {
      currentPlans = currentPlans.filter(plan =>
        plan.supplier_name.toLowerCase().includes(filters.supplier_name.toLowerCase())
      );
    }
    if (filters.pricing_type) {
      currentPlans = currentPlans.filter(plan => plan.pricing_type === filters.pricing_type);
    }
    currentPlans = currentPlans.filter(plan =>
      plan.percent_renewable >= filters.percent_renewable[0] && plan.percent_renewable <= filters.percent_renewable[1]
    );
    if (filters.has_cancellation_fee) {
      currentPlans = currentPlans.filter(plan => String(plan.has_cancellation_fee) === filters.has_cancellation_fee);
    }
    if (filters.is_monthly_charge) {
      currentPlans = currentPlans.filter(plan => String(plan.is_monthly_charge) === filters.is_monthly_charge);
    }

    // Multi-level Sorting
    return currentPlans.sort((a, b) => {
      // Primary Sort
      let valA_primary = a[primaryOrderBy];
      let valB_primary = b[primaryOrderBy];

      // Handle nulls and types for primary sort key
      if (primaryOrderBy === 'price_per_kwh' || primaryOrderBy === 'percent_renewable' || primaryOrderBy === 'rate_is_good_for_months') {
        // For numeric sorts, treat nulls as lowest or highest based on typical preference
        // Price: null is "bad" (high). Renewable: null (defaulted to 0) is low. Term: null (0) is low.
        const isAsc = primaryOrder === 'asc';
        if (primaryOrderBy === 'price_per_kwh') {
            valA_primary = valA_primary === null ? (isAsc ? Infinity : -Infinity) : valA_primary;
            valB_primary = valB_primary === null ? (isAsc ? Infinity : -Infinity) : valB_primary;
        } else { // percent_renewable, rate_is_good_for_months (already defaulted if null)
            valA_primary = valA_primary === null ? (isAsc ? -Infinity : Infinity) : valA_primary;
            valB_primary = valB_primary === null ? (isAsc ? -Infinity : Infinity) : valB_primary;
        }
      } else if (primaryOrderBy === 'last_updated') {
        const isAsc = primaryOrder === 'asc';
        valA_primary = valA_primary === null ? (isAsc ? new Date(0) : new Date('9999-12-31')) : valA_primary;
        valB_primary = valB_primary === null ? (isAsc ? new Date(0) : new Date('9999-12-31')) : valB_primary;
      } else if (typeof valA_primary === 'string' && typeof valB_primary === 'string') {
        valA_primary = valA_primary.toLowerCase();
        valB_primary = valB_primary.toLowerCase();
      }

      let primaryComparison = 0;
      if (valA_primary < valB_primary) primaryComparison = -1;
      if (valA_primary > valB_primary) primaryComparison = 1;
      if (primaryOrder === 'desc') primaryComparison *= -1;

      if (primaryComparison !== 0) {
        return primaryComparison;
      }

      // Secondary Sort (always by price_per_kwh, ascending)
      let valA_secondary = a[secondaryOrderBy];
      let valB_secondary = b[secondaryOrderBy];

      // Price: null is "bad" (high), so Infinity for ascending sort
      valA_secondary = valA_secondary === null ? Infinity : valA_secondary;
      valB_secondary = valB_secondary === null ? Infinity : valB_secondary;
      
      if (valA_secondary < valB_secondary) return -1; // secondaryOrder is 'asc'
      if (valA_secondary > valB_secondary) return 1;  // secondaryOrder is 'asc'
      
      return 0;
    });
  }, [allPlans, primaryOrder, primaryOrderBy, filters, secondaryOrderBy, secondaryOrder]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress size={60} /><Typography sx={{ml: 2}}>Loading plans...</Typography></Box>;
  if (error) return <Container sx={{mt: 5}}><Alert severity="error" variant="filled">Failed to load plans: {error}</Alert></Container>;

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Typography variant="h3" component="h1" gutterBottom align="center" sx={{ mb: 3, color: 'primary.dark' }}>
        Energy Plan Explorer
      </Typography>

      <Paper elevation={3} sx={{ p: 2.5, mb: 3, backgroundColor: 'background.paper' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="div" sx={{ display: 'flex', alignItems: 'center', color: 'primary.main' }}>
            <FilterListIcon sx={{ mr: 1 }} />
            Filter Options
          </Typography>
          <Button variant="outlined" color="primary" startIcon={<ClearAllIcon />} onClick={clearFilters} size="small">
            Clear All Filters
          </Button>
        </Box>
        <Grid container spacing={2.5} alignItems="flex-end">
          <Grid
						item 
						size={{ xs: 12, sm: 6, md: 2.5, lg: 2}}
					>
            <TextField
              fullWidth
              label="Supplier Name"
              variant="outlined"
              size="small"
              value={filters.supplier_name}
              onChange={(e) => handleFilterChange('supplier_name', e.target.value)}
            />
          </Grid>
          <Grid
						item
						size={{ xs: 12, sm: 6, md: 2.5, lg: 2}}
					> {/* Pricing Type */}
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel>Type</InputLabel> 
              <Select
                value={filters.pricing_type}
                onChange={(e) => handleFilterChange('pricing_type', e.target.value as Filters['pricing_type'])}
                label="Type"
              >
                <MenuItem value=""><em>All Types</em></MenuItem>
                <MenuItem value="Fixed">Fixed</MenuItem>
                <MenuItem value="Variable">Variable</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid
            item
						size={{ xs: 12, sm: 6, md: 2.5, lg: 2}}
			    > {/* Renewable % */}
            <Typography gutterBottom variant="caption" sx={{ display: 'block', color: 'text.secondary', mb: -0.5 }}>
                Renewable % ({filters.percent_renewable[0]}% - {filters.percent_renewable[1]}%)
            </Typography>
            <Slider
              value={filters.percent_renewable}
              onChange={(_, newValue) => handleFilterChange('percent_renewable', newValue as number[])}
              valueLabelDisplay="auto"
              min={0}
              max={100}
              size="small"
              marks={[{value: 0, label: '0%'}, {value: 50, label: '50%'}, {value: 100, label: '100%'}]}
            />
          </Grid>
          <Grid
            item 
						size={{ xs: 12, sm: 6, md: 2.5, lg: 2}}
          > {/* Cancellation Fee */}
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel>Cancel Fee</InputLabel> {/* CHANGED */}
              <Select
                value={filters.has_cancellation_fee}
                onChange={(e) => handleFilterChange('has_cancellation_fee', e.target.value as Filters['has_cancellation_fee'])}
                label="Cancel Fee"
              >
                <MenuItem value=""><em>Any</em></MenuItem>
                <MenuItem value="true">Yes</MenuItem>
                <MenuItem value="false">No</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid
            item 
						size={{ xs: 12, sm: 6, md: 2.5, lg: 2}}
          > 
             <FormControl fullWidth variant="outlined" size="small">
              <InputLabel>Mo. Charge</InputLabel> {/* CHANGED */}
              <Select
                value={filters.is_monthly_charge}
                onChange={(e) => handleFilterChange('is_monthly_charge', e.target.value as Filters['is_monthly_charge'])}
                label="Mo. Charge"
              >
                <MenuItem value=""><em>Any</em></MenuItem>
                <MenuItem value="true">Yes</MenuItem>
                <MenuItem value="false">No</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper} elevation={3}>
        <Table sx={{ minWidth: 900 }} aria-labelledby="tableTitle" size="medium">
          <TableHead sx={{ backgroundColor: alpha(theme.palette.primary.light, 0.1)}}>
            <TableRow>
              {headCells.map((headCell) => (
                <TableCell
                  key={headCell.id}
                  align={headCell.align || (headCell.numeric ? 'right' : 'left')}
                  padding="normal"
                  sortDirection={headCell.sortable && primaryOrderBy === headCell.id ? primaryOrder : false}
                  sx={{ fontWeight: 'bold', color: 'primary.dark', minWidth: headCell.minWidth }}
                >
                  {headCell.sortable ? (
                    <TableSortLabel
                      active={primaryOrderBy === headCell.id}
                      direction={primaryOrderBy === headCell.id ? primaryOrder : 'asc'}
                      onClick={() => headCell.sortable && handleRequestSort(headCell.id as SortableKey)}
                    >
                      {headCell.label}
                      {primaryOrderBy === headCell.id ? <Box component="span" sx={visuallyHidden}>{primaryOrder === 'desc' ? 'sorted descending' : 'sorted ascending'}</Box> : null}
                    </TableSortLabel>
                  ) : (
                    headCell.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAndSortedPlans.map((plan, index) => (
              <TableRow
                hover
                key={`${plan.supplier_name}-${plan.plan_name}-${index}-${plan.price_per_kwh}`}
                sx={{ '&:nth-of-type(odd)': { backgroundColor: alpha(theme.palette.action.hover, 0.3) } }}
              >
                {headCells.map(cell => (
                    <TableCell key={cell.id as string} align={cell.align || (cell.numeric ? 'right' : 'left')}>
                        {cell.render ? cell.render(plan[cell.id as keyof EnergyPlan], plan) : String(plan[cell.id as keyof EnergyPlan] ?? 'N/A')}
                    </TableCell>
                ))}
              </TableRow>
            ))}
            {filteredAndSortedPlans.length === 0 && (
                <TableRow>
                    <TableCell colSpan={headCells.length} align="center" sx={{py: 5}}>
                        <Typography variant="subtitle1" color="textSecondary">No plans match your current filter criteria.</Typography>
                        <Button variant="text" onClick={clearFilters} sx={{mt:1}}>Clear Filters to see all plans</Button>
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}

export default App;
