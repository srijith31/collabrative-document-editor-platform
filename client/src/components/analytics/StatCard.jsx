import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

export const StatCard = ({ title, value, icon, color }) => {
  return (
    <Card
      className="glass-panel"
      sx={{
        background: 'rgba(18, 18, 23, 0.55)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        transition: 'transform 0.3s, box-shadow 0.3s',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: `0 8px 30px ${color || 'rgba(99, 102, 241, 0.15)'}`,
          borderColor: color || 'var(--accent-secondary)',
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '4px',
          height: '100%',
          backgroundColor: color || 'var(--accent-secondary)',
        }
      }}
    >
      <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="subtitle2" sx={{ color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', mb: 1 }}>
              {title}
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, color: '#f1f5f9' }}>
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 50,
              height: 50,
              borderRadius: '12px',
              backgroundColor: `${color || 'rgba(99, 102, 241, 0.1)'}15`, // append transparency
              color: color || 'var(--accent-secondary)',
              border: `1px solid ${color}30`
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatCard;
