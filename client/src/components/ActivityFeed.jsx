import React, { useEffect, useState } from 'react';
import { Box, Typography, List, Card, Avatar, Divider } from '@mui/material';
import { commentService } from '../services/commentService';

export const ActivityFeed = ({ documentId }) => {
  const [activities, setActivities] = useState([]);

  const fetchActivities = async () => {
    try {
      const data = await commentService.getActivityLog(documentId);
      setActivities(data);
    } catch (err) {
      console.error('Failed to load activity stream:', err);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [documentId]);

  const getInitials = (name) => name.slice(0, 2).toUpperCase();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 2, boxSizing: 'border-box' }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Activity Log</Typography>
      <Divider sx={{ borderColor: 'var(--border-color)', mb: 2 }} />

      <Box sx={{ flex: 1, overflowY: 'auto', pr: 1 }}>
        {activities.length === 0 ? (
          <Typography variant="body2" color="var(--text-muted)" sx={{ textAlign: 'center', mt: 4 }}>
            No activities recorded
          </Typography>
        ) : (
          <List sx={{ p: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {activities.map((act) => (
              <Card
                key={act._id}
                sx={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  boxShadow: 'none',
                  p: 1.5,
                }}
              >
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                  <Avatar sx={{ width: 20, height: 20, bgcolor: act.user?.avatarColor, fontSize: '9px', fontWeight: 600 }}>
                    {getInitials(act.user?.username || 'U')}
                  </Avatar>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>{act.user?.username}</Typography>
                </Box>
                <Typography variant="body2" sx={{ pl: 0.5, mb: 1, color: '#f1f5f9' }}>
                  {act.details}
                </Typography>
                <Typography variant="caption" color="var(--text-muted)" sx={{ pl: 0.5 }}>
                  {new Date(act.createdAt).toLocaleString()}
                </Typography>
              </Card>
            ))}
          </List>
        )}
      </Box>
    </Box>
  );
};
