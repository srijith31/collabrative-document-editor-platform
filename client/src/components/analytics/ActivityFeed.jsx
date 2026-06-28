import React from 'react';
import { Box, Typography, Avatar, List, ListItem, ListItemAvatar, ListItemText } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CommentIcon from '@mui/icons-material/Comment';
import CreateIcon from '@mui/icons-material/Create';
import BackupIcon from '@mui/icons-material/Backup';
import ShareIcon from '@mui/icons-material/Share';
import LightbulbIcon from '@mui/icons-material/Lightbulb';

export const ActivityFeed = ({ activities }) => {
  const getActionIcon = (actionType) => {
    switch (actionType) {
      case 'CREATE':
        return <CreateIcon sx={{ fontSize: 16, color: '#4caf50' }} />;
      case 'EDIT':
        return <EditIcon sx={{ fontSize: 16, color: '#2196f3' }} />;
      case 'COMMENT':
        return <CommentIcon sx={{ fontSize: 16, color: '#ff9800' }} />;
      case 'SUGGESTION':
        return <LightbulbIcon sx={{ fontSize: 16, color: '#e91e63' }} />;
      case 'SHARE':
        return <ShareIcon sx={{ fontSize: 16, color: '#9c27b0' }} />;
      case 'VERSION_RESTORE':
        return <BackupIcon sx={{ fontSize: 16, color: '#009688' }} />;
      default:
        return <EditIcon sx={{ fontSize: 16, color: '#94a3b8' }} />;
    }
  };

  const formatActivityText = (act) => {
    const username = act.user?.username || 'Someone';
    const docTitle = act.documentId?.title || 'Untitled Document';
    const details = act.details || '';

    switch (act.actionType) {
      case 'CREATE':
        return (
          <>
            <strong>{username}</strong> created <span style={{ color: 'var(--accent-secondary)' }}>"{docTitle}"</span>
          </>
        );
      case 'EDIT':
        return (
          <>
            <strong>{username}</strong> edited <span style={{ color: 'var(--accent-secondary)' }}>"{docTitle}"</span>
          </>
        );
      case 'COMMENT':
        return (
          <>
            <strong>{username}</strong> added a comment on <span style={{ color: 'var(--accent-secondary)' }}>"{docTitle}"</span>
          </>
        );
      case 'SUGGESTION':
        return (
          <>
            <strong>{username}</strong> {details.toLowerCase() || 'proposed an edit'} on <span style={{ color: 'var(--accent-secondary)' }}>"{docTitle}"</span>
          </>
        );
      case 'SHARE':
        return (
          <>
            <strong>{username}</strong> {details.toLowerCase() || 'shared the document'}
          </>
        );
      case 'VERSION_RESTORE':
        return (
          <>
            <strong>{username}</strong> {details.toLowerCase() || 'restored a version'} of <span style={{ color: 'var(--accent-secondary)' }}>"{docTitle}"</span>
          </>
        );
      default:
        return (
          <>
            <strong>{username}</strong> performed an action on <span style={{ color: 'var(--accent-secondary)' }}>"{docTitle}"</span>
          </>
        );
    }
  };

  const getRelativeTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (!activities || activities.length === 0) {
    return (
      <Box sx={{ py: 6, textAlign: 'center', color: 'var(--text-muted)' }}>
        <Typography variant="body2">No recent activity found.</Typography>
      </Box>
    );
  }

  return (
    <List sx={{ p: 0, maxHeight: 380, overflowY: 'auto' }}>
      {activities.map((act) => (
        <ListItem
          key={act._id}
          sx={{
            px: 2,
            py: 1.5,
            borderBottom: '1px solid var(--border-color)',
            transition: 'background-color 0.2s',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
            },
            '&:last-child': {
              borderBottom: 'none',
            }
          }}
        >
          <ListItemAvatar sx={{ minWidth: 48, position: 'relative' }}>
            <Avatar
              sx={{
                bgcolor: act.user?.avatarColor || 'var(--accent-primary)',
                width: 32,
                height: 32,
                fontSize: '12px',
                fontWeight: 600
              }}
            >
              {(act.user?.username || 'U').slice(0, 2).toUpperCase()}
            </Avatar>
            <Box
              sx={{
                position: 'absolute',
                bottom: 8,
                right: 12,
                bgcolor: 'var(--bg-secondary)',
                borderRadius: '50%',
                width: 18,
                height: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--border-color)'
              }}
            >
              {getActionIcon(act.actionType)}
            </Box>
          </ListItemAvatar>
          <ListItemText
            primary={
              <Typography variant="body2" sx={{ color: '#f1f5f9' }}>
                {formatActivityText(act)}
              </Typography>
            }
            secondary={
              <Typography variant="caption" sx={{ color: 'var(--text-muted)' }}>
                {getRelativeTime(act.createdAt)}
              </Typography>
            }
          />
        </ListItem>
      ))}
    </List>
  );
};

export default ActivityFeed;
