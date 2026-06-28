import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Box, Typography } from '@mui/material';

export const DocumentsChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <Box sx={{ py: 8, textAlign: 'center', color: 'var(--text-muted)' }}>
        <Typography variant="body2">No monthly creation data available.</Typography>
      </Box>
    );
  }

  // Custom tooltips to match dark theme aesthetics
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            background: 'rgba(18, 18, 23, 0.9)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            p: 1.5,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#f1f5f9', mb: 0.5 }}>
            {label}
          </Typography>
          <Typography variant="caption" sx={{ color: 'var(--accent-secondary)', fontWeight: 600 }}>
            Created: {payload[0].value} {payload[0].value === 1 ? 'document' : 'documents'}
          </Typography>
        </Box>
      );
    }
    return null;
  };

  return (
    <Box sx={{ width: '100%', height: 320 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{
            top: 10,
            right: 15,
            left: -20,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="colorDocs" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8a2be2" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f1f29" vertical={false} />
          <XAxis
            dataKey="name"
            stroke="#94a3b8"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            stroke="#94a3b8"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#8a2be2"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorDocs)"
            activeDot={{ r: 6, stroke: '#6366f1', strokeWidth: 2, fill: '#0b0b0e' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default DocumentsChart;
