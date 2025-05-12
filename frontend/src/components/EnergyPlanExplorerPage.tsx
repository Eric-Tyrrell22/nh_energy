// frontend/src/components/EnergyPlanExplorerPage.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { RawEnergyPlan, EnergyPlan, Order, SortableKey, HeadCell, Filters } from '../types';
import { useTheme, alpha } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Virtuoso, TableVirtuoso } from 'react-virtuoso';

// MUI Components
import {
  Container, Typography, Box, Grid, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TableSortLabel,
  TextField, Select, MenuItem, FormControl, InputLabel, Slider, Button, IconButton,
  Tooltip, Chip, Collapse
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LinkIcon from '@mui/icons-material/Link';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

import MobilePlanCard from './MobilePlanCard'; // Assuming MobilePlanCard.tsx is in the same components folder

// Helper Functions
const parseRateGoodFor = (rateString?: string | null): number => {
  if (!rateString) return 0;
  const match = rateString.match(/(\d+)\s*months?/i);
  return match ? parseInt(match[1], 10) : 0;
};

const formatDate = (date: Date | null): string => {
  if (!date) return 'N/A';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

// Constants and Configurations
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
        <IconButton size="small" aria-label="plan comments"><InfoOutlinedIcon fontSize="small" /></IconButton>
      </Tooltip>
    ) : '-'
  },
  {
    id: 'link', label: 'Link', numeric: false, sortable: false, minWidth: 100, align: 'center',
    render: (value, plan) => plan.link ? (
      <Button variant="outlined" size="small" href={plan.link} target="_blank" rel="noopener noreferrer" startIcon={<LinkIcon />}
        sx={{ py: 0.2, px: 1, fontSize: '0.75rem', textTransform: 'none' }}
      >Visit</Button>
    ) : '-'
  },
];

const RENEWABLE_FILTER_DEBOUNCE_MS = 300;

const initialFilters: Filters = {
  supplier_name: '',
  pricing_type: '',
  percent_renewable: [0, 100],
  has_cancellation_fee: '',
  is_monthly_charge: '',
};

const MuiTableComponents = (theme: Theme): VirtuosoTableComponents<EnergyPlan, unknown> => ({
    Scroller: React.forwardRef<HTMLDivElement>((props, ref) => (
      <TableContainer component={Paper} {...props} ref={ref} elevation={3} sx={{ width: '100%', ...props.sx }} />
    )),
    Table: (props) => (
      <Table {...props} sx={{ borderCollapse: 'separate', minWidth: 900, width: '100%', tableLayout: 'auto', ...props.sx }} size="medium" />
    ),
    TableHead: React.forwardRef<HTMLTableSectionElement>((props, ref) => <TableHead {...props} ref={ref} />),
    TableRow: React.forwardRef<HTMLTableRowElement, { item?: EnergyPlan; context?: unknown }>(({item: _item, context: _ctx, ...props }, ref) => (
        <TableRow
            hover
            ref={ref}
            {...props}
            sx={{
                '&:nth-of-type(odd)': { backgroundColor: alpha(theme.palette.action.hover, 0.03) },
                '&:nth-of-type(even)': { backgroundColor: theme.palette.background.paper },
                ...props.sx
            }}
        />
    )),
});

interface EnergyPlanExplorerPageProps {
  providerDataUrl: string;
  providerName?: string; // Optional: for display purposes
}

function EnergyPlanExplorerPage({ providerDataUrl, providerName }: EnergyPlanExplorerPageProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const tableComponents = useMemo(() => MuiTableComponents(theme), [theme]);

  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const [allPlans, setAllPlans] = useState<EnergyPlan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [primaryOrderBy, setPrimaryOrderBy] = useState<SortableKey>('price_per_kwh');
  const [primaryOrder, setPrimaryOrder] = useState<Order>('asc');

  const secondaryOrderBy: SortableKey = 'price_per_kwh'; // Hardcoded secondary sort
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [uiRenewableFilter, setUiRenewableFilter] = useState<number[]>(initialFilters.percent_renewable);

  useEffect(() => {
    const fetchPlans = async () => {
      if (!providerDataUrl) {
        setError("Provider data URL not specified.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      setAllPlans([]); // Clear previous plans
      try {
        const response = await fetch(providerDataUrl);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status} for ${providerDataUrl}`);
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
          link: plan.link || undefined,
        }));
        setAllPlans(processedData);
      } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
      finally { setLoading(false); }
    };
    fetchPlans();
  }, [providerDataUrl]); // Re-fetch if providerDataUrl changes

  const handleFilterChange = useCallback(<K extends keyof Filters>(filterName: K, value: Filters[K]) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (uiRenewableFilter[0] !== filters.percent_renewable[0] || uiRenewableFilter[1] !== filters.percent_renewable[1]) {
        handleFilterChange('percent_renewable', uiRenewableFilter);
      }
    }, RENEWABLE_FILTER_DEBOUNCE_MS);
    return () => clearTimeout(handler);
  }, [uiRenewableFilter, filters.percent_renewable, handleFilterChange]);

  const handleRenewableSliderChange = (_: Event, newValue: number | number[]) => {
    setUiRenewableFilter(newValue as number[]);
  };

  const clearFilters = useCallback(() => {
    setFilters(initialFilters);
    setUiRenewableFilter(initialFilters.percent_renewable);
    if (!filtersExpanded) setFiltersExpanded(true);
  }, [filtersExpanded]);

  const handleRequestSort = useCallback((property: SortableKey) => {
    const isCurrentPrimary = primaryOrderBy === property;
    if (isCurrentPrimary) {
      setPrimaryOrder(prevOrder => (prevOrder === 'asc' ? 'desc' : 'asc'));
    } else {
      setPrimaryOrderBy(property);
      if (property === 'price_per_kwh' || property === 'rate_is_good_for_months') {
        setPrimaryOrder('asc');
      } else if (property === 'percent_renewable') {
        setPrimaryOrder('desc');
      } else {
        setPrimaryOrder('asc');
      }
    }
  }, [primaryOrderBy]);

  const filteredAndSortedPlans = useMemo(() => {
    let currentPlans = [...allPlans];
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

    return currentPlans.sort((a, b) => {
      let valA_primary_any: any = a[primaryOrderBy];
      let valB_primary_any: any = b[primaryOrderBy];
      const isPrimaryAsc = primaryOrder === 'asc';

      if (primaryOrderBy === 'price_per_kwh') {
          valA_primary_any = valA_primary_any === null ? (isPrimaryAsc ? Infinity : -Infinity) : valA_primary_any;
          valB_primary_any = valB_primary_any === null ? (isPrimaryAsc ? Infinity : -Infinity) : valB_primary_any;
      } else if (primaryOrderBy === 'percent_renewable' || primaryOrderBy === 'rate_is_good_for_months'){
          valA_primary_any = valA_primary_any === null ? (isPrimaryAsc ? -Infinity : Infinity) : valA_primary_any; // Treat null as lowest for asc
          valB_primary_any = valB_primary_any === null ? (isPrimaryAsc ? -Infinity : Infinity) : valB_primary_any;
      } else if (primaryOrderBy === 'last_updated') {
          valA_primary_any = (valA_primary_any as Date | null)?.getTime() ?? (isPrimaryAsc ? -Infinity : Infinity);
          valB_primary_any = (valB_primary_any as Date | null)?.getTime() ?? (isPrimaryAsc ? -Infinity : Infinity);
      } else if (typeof valA_primary_any === 'string' && typeof valB_primary_any === 'string') {
          valA_primary_any = valA_primary_any.toLowerCase();
          valB_primary_any = valB_primary_any.toLowerCase();
      }

      let primaryComparison = 0;
      if (valA_primary_any < valB_primary_any) primaryComparison = -1;
      else if (valA_primary_any > valB_primary_any) primaryComparison = 1;
      
      if (!isPrimaryAsc) primaryComparison *= -1;

      if (primaryComparison !== 0) return primaryComparison;

      if (!isMobile && secondaryOrderBy) {
        let valA_secondary_any: any = a[secondaryOrderBy];
        let valB_secondary_any: any = b[secondaryOrderBy];
        // Assuming secondary sort for price_per_kwh is always ascending and nulls are highest
        valA_secondary_any = valA_secondary_any === null ? Infinity : valA_secondary_any;
        valB_secondary_any = valB_secondary_any === null ? Infinity : valB_secondary_any;
        
        if (valA_secondary_any < valB_secondary_any) return -1; 
        if (valA_secondary_any > valB_secondary_any) return 1;  
      }
      return 0;
    });
  }, [allPlans, primaryOrder, primaryOrderBy, filters, secondaryOrderBy, isMobile]);

  const NoPlansMessage = () => (
    <Box sx={{ textAlign: 'center', py: 10 }}>
        <Typography variant="h6" color="textSecondary" gutterBottom>
            No plans match your criteria.
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
            Try adjusting your filters or view all plans for {providerName || 'this provider'}.
        </Typography>
        <Button variant="outlined" onClick={clearFilters}>
            Clear All Filters
        </Button>
    </Box>
  );

  const fixedHeaderContent = useCallback(() => (
    <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.light, 0.2), zIndex: 1, position: 'sticky', top: 0 }}>
      {headCells.map((headCell) => (
        <TableCell
          key={headCell.id as string}
          align={headCell.align || (headCell.numeric ? 'right' : 'left')}
          padding="normal"
          sortDirection={headCell.sortable && primaryOrderBy === headCell.id ? primaryOrder : false}
          sx={{ fontWeight: 'bold', color: 'primary.dark', minWidth: headCell.minWidth, whiteSpace: 'nowrap' }}
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
  ), [primaryOrder, primaryOrderBy, handleRequestSort, theme]);

  const rowContent = useCallback((_index: number, plan: EnergyPlan) => (
    <>
      {headCells.map(cell => (
        <TableCell key={cell.id as string} align={cell.align || (cell.numeric ? 'right' : 'left')}>
            {cell.render ? cell.render(plan[cell.id as keyof EnergyPlan], plan, theme) : String(plan[cell.id as keyof EnergyPlan] ?? 'N/A')}
        </TableCell>
      ))}
    </>
  ), [theme]);

  const toggleFiltersExpanded = () => {
    setFiltersExpanded(prev => !prev);
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 100px)' }}><CircularProgress size={60} /><Typography variant="h6" sx={{ml: 2}}>Loading energy plans for {providerName || 'provider'}...</Typography></Box>;
  if (error) return <Container sx={{mt: 5}}><Alert severity="error" variant="filled">Failed to load plans: {error}</Alert></Container>;

  const pageTitle = providerName ? `${providerName} Energy Plans` : "Energy Plan Explorer";

  return (
    <Container maxWidth="100%" sx={{ py: 1 }}>
      <Typography variant={isMobile ? "h4" : "h3"} component="h1" gutterBottom align="center" sx={{ mb: 3, color: 'primary.dark', fontWeight: 'medium' }}>
        {pageTitle}
      </Typography>

      <Paper elevation={3} sx={{ p: {xs: 1.5, sm: 2.5}, mb: 3, backgroundColor: 'background.paper' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: filtersExpanded ? 2 : 0, cursor: 'pointer' }} onClick={toggleFiltersExpanded}>
          <Typography variant="h6" component="div" sx={{ display: 'flex', alignItems: 'center', color: 'primary.main' }}>
            <FilterListIcon sx={{ mr: 1 }} />
            Filter Options
          </Typography>
          <Box sx={{display: 'flex', alignItems: 'center'}}>
            {filtersExpanded && (
                 <Button variant="outlined" color="primary" startIcon={<ClearAllIcon />} onClick={(e) => { e.stopPropagation(); clearFilters();}} size="small" sx={{mr: 1}}>
                    Clear Filters
                </Button>
            )}
            <IconButton size="small" aria-label={filtersExpanded ? "collapse filters" : "expand filters"}>
                {filtersExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        </Box>
        <Collapse in={filtersExpanded} timeout="auto" unmountOnExit>
          <Grid container spacing={2.5} alignItems="flex-end" sx={{ pt: 2 }}>
            <Grid item xs={12} sm={6} md={3} lg={2}>
                <TextField
                fullWidth label="Supplier Name" variant="outlined" size="small"
                value={filters.supplier_name}
                onChange={(e) => handleFilterChange('supplier_name', e.target.value)}
                />
            </Grid>
            <Grid item xs={12} sm={6} md={2} lg={2}>
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
            <Grid item xs={12} sm={12} md={4} lg={3} sx={{ px: { xs: 2, sm: 2} }}>
                <Typography gutterBottom variant="caption" sx={{ display: 'block', color: 'text.secondary', mb: -0.5, ml: 0.5 }}>
                    Renewable % ({uiRenewableFilter[0]}% - {uiRenewableFilter[1]}%)
                </Typography>
                <Slider
                value={uiRenewableFilter}
                onChange={handleRenewableSliderChange}
                valueLabelDisplay="auto"
                min={0} max={100} size="small"
                marks={[{value: 0, label: '0%'}, {value: 50, label: '50%'}, {value: 100, label: '100%'}]}
                sx={{mt: 0.5}}
                />
            </Grid>
            <Grid item xs={12} sm={6} md={3} lg={2}>
                <FormControl fullWidth variant="outlined" size="small">
                <InputLabel>Cancel Fee</InputLabel>
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
            <Grid item xs={12} sm={6} md={12} lg={3} > {/* Corrected Grid md value from 12 to a more reasonable one if needed, kept 12 as per original structure */}
                <FormControl fullWidth variant="outlined" size="small">
                <InputLabel>Monthly Charge</InputLabel>
                <Select
                    value={filters.is_monthly_charge}
                    onChange={(e) => handleFilterChange('is_monthly_charge', e.target.value as Filters['is_monthly_charge'])}
                    label="Monthly Charge"
                >
                    <MenuItem value=""><em>Any</em></MenuItem>
                    <MenuItem value="true">Yes</MenuItem>
                    <MenuItem value="false">No</MenuItem>
                </Select>
                </FormControl>
            </Grid>
          </Grid>
        </Collapse>
      </Paper>

      <Box>
        {filteredAndSortedPlans.length === 0 && !loading ? (
          <NoPlansMessage />
        ) : isMobile ? (
          <Virtuoso
            useWindowScroll
            style={{height: 'auto'}} // Let content flow
            data={filteredAndSortedPlans}
            itemContent={(_index, plan) => <MobilePlanCard plan={plan} />}
            overscan={200} // Adjust based on card height
          />
        ) : (
          <TableVirtuoso
            style={{ height: 'calc(100vh - 320px)' }} // Adjusted height slightly for typical title + filter section
            data={filteredAndSortedPlans}
            components={tableComponents}
            fixedHeaderContent={fixedHeaderContent}
            itemContent={rowContent}
            overscan={10}
          />
        )}
      </Box>
    </Container>
  );
}

export default EnergyPlanExplorerPage;
