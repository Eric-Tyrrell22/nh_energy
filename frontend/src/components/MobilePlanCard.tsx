// frontend/src/components/MobilePlanCard.tsx
import React, { useState } from 'react'; // Import useState
import type { EnergyPlan } from '../types';
import { Card, CardContent, CardActions, Typography, Button, Chip, Box, IconButton, Tooltip, Grid } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';

// Icons
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import OfflineBoltIcon from '@mui/icons-material/OfflineBolt';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import GavelIcon from '@mui/icons-material/Gavel';
import LinkIcon from '@mui/icons-material/Link';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import RequestQuoteOutlinedIcon from '@mui/icons-material/RequestQuoteOutlined';

interface MobilePlanCardProps {
  plan: EnergyPlan;
}

const formatDateForCard = (date: Date | null): string => {
  if (!date) return 'N/A';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const MobilePlanCard: React.FC<MobilePlanCardProps> = ({ plan }) => {
  const theme = useTheme();
  const [commentsTooltipOpen, setCommentsTooltipOpen] = useState(false); // State for the tooltip

  const handleCommentsTooltipToggle = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation(); // Prevent event from bubbling to the card if it had a click listener
    setCommentsTooltipOpen((prev) => !prev);
  };

  const handleCommentsTooltipClose = () => {
    setCommentsTooltipOpen(false);
  };

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
        justifyContent: plan.comments || plan.link ? 'space-between' : 'flex-end', 
        alignItems: 'center',
        px: 2, 
        py: 1, // Added some vertical padding for better spacing
        backgroundColor: alpha(theme.palette.grey[50], 0.3),
        borderTop: `1px solid ${theme.palette.divider}`
      }}>
        {plan.comments ? ( // Ensure plan.comments is not just empty string but actually has content
          <Tooltip
            title={<div style={{ whiteSpace: 'pre-line', fontSize: '0.8rem', padding: '4px' }}>{plan.comments}</div>}
            arrow
            open={commentsTooltipOpen}
            onClose={handleCommentsTooltipClose}
						leaveTouchDelay={15000}
            // Optional: if you want to disable hover/focus/touch listeners if click is primary
            // disableHoverListener 
            // disableFocusListener
            // disableTouchListener // Keep this false or remove to allow tap-away to close
          >
            <IconButton
              size="small"
              aria-label="plan comments"
              onClick={handleCommentsTooltipToggle} // Toggle on click
            >
              <InfoOutlinedIcon fontSize="small"/>
            </IconButton>
          </Tooltip>
        ) : (
          // Optional: Render a placeholder or nothing if no comments
          <Box sx={{ width: '40px' }} /> // Placeholder to keep alignment if link is present
        )}
        
        {plan.link && (
          <Button
            variant="contained"
            size="small"
            href={plan.link}
            target="_blank"
            rel="noopener noreferrer"
            startIcon={<LinkIcon />}
            sx={{ py: 0.5, px: 1.5, fontSize: '0.8rem' }} // textTransform is already 'none' from theme
          >
            View Plan
          </Button>
        )}
      </CardActions>
    </Card>
  );
};

export default MobilePlanCard;
