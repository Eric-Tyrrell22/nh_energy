// frontend/src/components/MobilePlanCard.tsx
import React from 'react';
import type { EnergyPlan } from '../types';
import { Card, CardContent, CardActions, Typography, Button, Chip, Box, IconButton, Tooltip, Grid } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';

// Icons for visual cues
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import OfflineBoltIcon from '@mui/icons-material/OfflineBolt';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import GavelIcon from '@mui/icons-material/Gavel'; // Represents "type" or rules
import LinkIcon from '@mui/icons-material/Link';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import RequestQuoteOutlinedIcon from '@mui/icons-material/RequestQuoteOutlined'; // For monthly charge

interface MobilePlanCardProps {
  plan: EnergyPlan;
}

const formatDateForCard = (date: Date | null): string => {
  if (!date) return 'N/A';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const MobilePlanCard: React.FC<MobilePlanCardProps> = ({ plan }) => {
  const theme = useTheme();

  return (
    <Card sx={{ mb: 2, boxShadow: 3, '&:hover': { boxShadow: 7, transform: 'translateY(-2px)' }, transition: 'all 0.2s ease-in-out' }}>
      <CardContent sx={{ pb: 1 }}>
        <Typography variant="h6" component="div" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.dark' }}>
          {plan.supplier_name}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom sx={{ mt: -1, mb: 2 }}>
          {plan.plan_name}
        </Typography>

        <Grid container spacing={1.5} alignItems="stretch">
          {/* Price */}
          <Grid item xs={6} sm={4} sx={{ display: 'flex', alignItems: 'center' }}>
            <AttachMoneyIcon color="action" sx={{ mr: 0.75, fontSize: '1.2rem' }} />
            <Box>
              <Typography variant="caption" display="block" color="text.secondary">Price/kWh</Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {plan.price_per_kwh === null ? 'N/A' : `$${Number(plan.price_per_kwh).toFixed(4)}`}
              </Typography>
            </Box>
          </Grid>

          {/* Renewable */}
          <Grid item xs={6} sm={4} sx={{ display: 'flex', alignItems: 'center' }}>
            <OfflineBoltIcon color="action" sx={{ mr: 0.75, fontSize: '1.2rem' }} />
            <Box>
              <Typography variant="caption" display="block" color="text.secondary">Renewable</Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {`${Number(plan.percent_renewable).toFixed(0)}%`}
              </Typography>
            </Box>
          </Grid>

          {/* Term */}
          <Grid item xs={6} sm={4} sx={{ display: 'flex', alignItems: 'center' }}>
            <EventRepeatIcon color="action" sx={{ mr: 0.75, fontSize: '1.2rem' }} />
            <Box>
              <Typography variant="caption" display="block" color="text.secondary">Term</Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {plan.rate_is_good_for_months > 0 ? `${plan.rate_is_good_for_months} mo` : (plan.rate_is_good_for || 'N/A')}
              </Typography>
            </Box>
          </Grid>
          
          {/* Type */}
           <Grid item xs={6} sm={4} sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
             <GavelIcon color="action" sx={{ mr: 0.75, fontSize: '1.2rem' }} />
             <Box>
                <Typography variant="caption" display="block" color="text.secondary">Type</Typography>
                <Chip
                    label={plan.pricing_type}
                    size="small"
                    color={plan.pricing_type === "Fixed" ? "primary" : plan.pricing_type === "Variable" ? "secondary" : "default"}
                    variant="outlined"
                    sx={{ height: '22px', fontSize: '0.75rem', fontWeight: 'medium' }}
                />
             </Box>
          </Grid>

          {/* Cancellation Fee */}
          <Grid item xs={6} sm={4} sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            {plan.has_cancellation_fee ? <HighlightOffIcon color="error" sx={{ mr: 0.75, fontSize: '1.2rem' }} /> : <CheckCircleOutlineIcon color="success" sx={{ mr: 0.75, fontSize: '1.2rem' }} />}
             <Box>
                <Typography variant="caption" display="block" color="text.secondary">Cancel Fee</Typography>
                <Typography variant="body2" sx={{ fontWeight: 'medium', color: plan.has_cancellation_fee ? 'error.main' : 'success.main' }}>
                    {plan.has_cancellation_fee ? 'Yes' : 'No'}
                </Typography>
             </Box>
          </Grid>
          
          {/* Monthly Charge */}
          <Grid item xs={6} sm={4} sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <RequestQuoteOutlinedIcon color="action" sx={{ mr: 0.75, fontSize: '1.2rem' }} />
             <Box>
                <Typography variant="caption" display="block" color="text.secondary">Monthly Fee</Typography>
                <Typography variant="body2" sx={{ fontWeight: 'medium', color: plan.is_monthly_charge ? 'warning.dark' : 'text.primary' }}>
                    {plan.is_monthly_charge ? 'Yes' : 'No'}
                </Typography>
             </Box>
          </Grid>
        </Grid>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'right', mt: 1.5, fontStyle: 'italic' }}>
            Updated: {formatDateForCard(plan.last_updated)}
        </Typography>
      </CardContent>
      <CardActions sx={{ 
        justifyContent: plan.comments ? 'space-between' : 'flex-end', 
        pt: 0.5, 
        pb: 1.5, 
        px: 2, 
        backgroundColor: alpha(theme.palette.grey[50], 0.3),
        borderTop: `1px solid ${theme.palette.divider}`
      }}>
        {plan.comments && (
          <Tooltip title={<div style={{ whiteSpace: 'pre-line', fontSize: '0.8rem', padding: '4px' }}>{plan.comments}</div>} arrow>
            <IconButton size="small" aria-label="plan comments">
              <InfoOutlinedIcon fontSize="small"/>
            </IconButton>
          </Tooltip>
        )}
        
        {plan.link && (
          <Button
            variant="contained"
            size="small"
            href={plan.link}
            target="_blank"
            rel="noopener noreferrer"
            startIcon={<LinkIcon />}
            sx={{ py: 0.5, px: 1.5, fontSize: '0.8rem', textTransform: 'none' }}
          >
            View Plan
          </Button>
        )}
      </CardActions>
    </Card>
  );
};

export default MobilePlanCard;
