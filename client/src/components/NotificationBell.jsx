import React, { useEffect, useState } from 'react';
import { Button } from '@mui/material';
import { Badge, IconButton, Popover, List, ListItem, Typography, Box, Divider } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { commentService } from '../services/commentService';

export const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);

  const fetchNotifications = async () => {
    try {
      const data = await commentService.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkRead = async (id) => {
    try {
      await commentService.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const open = Boolean(anchorEl);
  const popoverId = open ? 'notification-popover' : undefined;
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      <IconButton onClick={handleClick} sx={{ color: 'var(--text-muted)' }}>
        <Badge badgeContent={unreadCount} color="secondary">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Popover
        id={popoverId}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        slotProps={{
          paper: {
            sx: {
              width: 320,
              maxHeight: 400,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
              mt: 1,
            }
          }
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Notifications</Typography>
          {unreadCount > 0 && (
            <Typography variant="caption" color="var(--accent-secondary)">
              {unreadCount} unread
            </Typography>
          )}
        </Box>
        <Divider sx={{ borderColor: 'var(--border-color)' }} />
        {notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="var(--text-muted)">
              No notifications yet
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0, overflow: 'auto', maxHeight: 320 }}>
            {notifications.map((n) => (
              <React.Fragment key={n._id}>
                <ListItem
                  sx={{
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    backgroundColor: n.read ? 'transparent' : 'rgba(99, 102, 241, 0.05)',
                    p: 2,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    }
                  }}
                  onClick={() => !n.read && handleMarkRead(n._id)}
                >
                  <Typography variant="body2" sx={{ mb: 1, color: n.read ? 'var(--text-muted)' : '#fff' }}>
                    {n.message}
                  </Typography>
                  <Typography variant="caption" color="var(--text-muted)" sx={{ mt: 0.5 }}>
                    {new Date(n.createdAt).toLocaleDateString()}
                  </Typography>
                  {n.type === 'INVITE' && n.token && (
                    <Button
                      variant="contained"
                      size="small"
                      sx={{ mt: 1, backgroundColor: 'var(--accent-primary)', color: '#fff' }}
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          await commentService.acceptInvite(n.token);
                          // Refresh notifications list (the accepted notification will be gone)
                          fetchNotifications();
                        } catch (err) {
                          console.error('Failed to accept invite:', err);
                        }
                      }}
                    >
                      Accept
                    </Button>
                  )}
                </ListItem>
                <Divider sx={{ borderColor: 'var(--border-color)' }} />
              </React.Fragment>
            ))}
          </List>
        )}
      </Popover>
    </>
  );
};
export default NotificationBell;
