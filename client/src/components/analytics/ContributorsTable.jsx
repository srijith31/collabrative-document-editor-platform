import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Avatar, Box, Typography } from '@mui/material';

export const ContributorsTable = ({ contributors }) => {
  if (!contributors || contributors.length === 0) {
    return (
      <Box sx={{ py: 6, textAlign: 'center', color: 'var(--text-muted)' }}>
        <Typography variant="body2">No contributors logged yet.</Typography>
      </Box>
    );
  }

  return (
    <TableContainer sx={{ maxHeight: 380, overflowY: 'auto' }}>
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontWeight: 600 }}>Rank</TableCell>
            <TableCell sx={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontWeight: 600 }}>User</TableCell>
            <TableCell sx={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontWeight: 600 }} align="right">Edits</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {contributors.map((contrib, index) => {
            const username = contrib.user?.username || 'Unknown User';
            const userInitials = username.slice(0, 2).toUpperCase();
            
            return (
              <TableRow
                key={contrib._id || index}
                sx={{
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.02)' },
                  '& td': { borderBottom: '1px solid var(--border-color)' }
                }}
              >
                <TableCell sx={{ fontWeight: 600, color: index === 0 ? '#ffb74d' : index === 1 ? '#b0bec5' : index === 2 ? '#bcaaa4' : 'var(--text-muted)' }}>
                  #{index + 1}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar
                      sx={{
                        bgcolor: contrib.user?.avatarColor || 'var(--accent-primary)',
                        width: 28,
                        height: 28,
                        fontSize: '11px',
                        fontWeight: 600
                      }}
                    >
                      {userInitials}
                    </Avatar>
                    <Typography variant="body2" sx={{ color: '#f1f5f9', fontWeight: 500 }}>
                      {username}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: 'var(--accent-secondary)' }}>
                  {contrib.edits}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ContributorsTable;
