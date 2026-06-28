import React, { useState, useEffect } from 'react';
import { Box, Typography, List, ListItem, ListItemAvatar, ListItemText, Avatar, Chip, Badge } from '@mui/material';

export const CollaboratorsPanel = ({ collaborators }) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getInitials = (name) => name.slice(0, 2).toUpperCase();

  const collaboratorList = Object.values(collaborators);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 2, boxSizing: 'border-box' }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Active Collaborators</Typography>
      <Box sx={{ flex: 1, overflowY: 'auto', pr: 1 }}>
        {collaboratorList.length === 0 ? (
          <Typography variant="body2" color="var(--text-muted)" sx={{ textAlign: 'center', mt: 4 }}>
            No collaborators active
          </Typography>
        ) : (
          <List sx={{ p: 0, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {collaboratorList.map((collab) => {
              // Idle calculation: inactive for more than 15 seconds
              const isIdle = now - (collab.lastActive || 0) > 15000;
              const statusDot = isIdle ? '🟡' : '🟢';
              const statusText = isIdle ? 'Idle' : 'Active';

              let cursorInfo = 'No selection';
              if (collab.range) {
                if (collab.range.length > 0) {
                  cursorInfo = `Selecting index ${collab.range.index} - ${collab.range.index + collab.range.length}`;
                } else {
                  cursorInfo = `Cursor at index ${collab.range.index}`;
                }
              }

              return (
                <ListItem
                  key={collab.socketId}
                  sx={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    px: 2,
                    py: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                  }}
                >
                  <ListItemAvatar sx={{ minWidth: 'auto' }}>
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      badgeContent={
                        <Box sx={{ fontSize: '10px', width: 12, height: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {statusDot}
                        </Box>
                      }
                    >
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: collab.avatarColor || 'var(--accent-primary)',
                          fontSize: '13px',
                          fontWeight: 600,
                        }}
                      >
                        {getInitials(collab.username || 'U')}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#f1f5f9' }}>
                          {collab.username}
                        </Typography>
                        <Chip
                          label={statusText}
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: '9px',
                            fontWeight: 600,
                            bgcolor: isIdle ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                            color: isIdle ? '#f59e0b' : '#10b981',
                            border: `1px solid ${isIdle ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)'}`,
                          }}
                        />
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" color="var(--text-muted)" sx={{ display: 'block', mt: 0.5 }}>
                        {cursorInfo}
                      </Typography>
                    }
                    sx={{ m: 0 }}
                  />
                </ListItem>
              );
            })}
          </List>
        )}
      </Box>
    </Box>
  );
};
export default CollaboratorsPanel;
