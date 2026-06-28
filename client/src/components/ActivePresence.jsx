import React from 'react';
import { Box, Avatar, AvatarGroup, Tooltip } from '@mui/material';

export const ActivePresence = ({ presence }) => {
  const uniqueUsers = Array.from(new Map(presence.map(p => [p.userId, p])).values());

  const getInitials = (name) => {
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 32, height: 32, fontSize: '12px', border: '2px solid var(--bg-secondary) !important' } }}>
        {uniqueUsers.map((user) => (
          <Tooltip title={user.username} key={user.userId}>
            <Avatar sx={{ bgcolor: user.avatarColor || 'var(--accent-primary)' }}>
              {getInitials(user.username)}
            </Avatar>
          </Tooltip>
        ))}
      </AvatarGroup>
    </Box>
  );
};
