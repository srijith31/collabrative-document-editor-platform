import React, { useEffect, useState } from 'react';
import { Box, Typography, TextField, Button, List, Card, Avatar, Divider, Alert } from '@mui/material';
import { commentService } from '../services/commentService';

export const VersionHistory = ({ documentId, userRole, onRestore }) => {
  const [versions, setVersions] = useState([]);
  const [newVersionName, setNewVersionName] = useState('');
  const [error, setError] = useState(null);

  const fetchVersions = async () => {
    try {
      const data = await commentService.getVersions(documentId);
      setVersions(data);
    } catch (err) {
      console.error('Failed to load version snapshots:', err);
    }
  };

  useEffect(() => {
    fetchVersions();
  }, [documentId]);

  const handleSaveSnapshot = async (e) => {
    e.preventDefault();
    try {
      const newVersion = await commentService.createVersion(documentId, newVersionName || undefined);
      setVersions(prev => [newVersion, ...prev]);
      setNewVersionName('');
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save snapshot.');
    }
  };

  const handleRestoreVersion = async (versionId) => {
    if (!window.confirm('This will replace the current document content. Do you want to proceed?')) return;
    try {
      const data = await commentService.restoreVersion(documentId, versionId);
      onRestore(data.content);
      fetchVersions();
    } catch (err) {
      console.error('Failed to restore version:', err);
    }
  };

  const getInitials = (name) => name.slice(0, 2).toUpperCase();

  const isEditor = ['OWNER', 'EDITOR'].includes(userRole);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 2, boxSizing: 'border-box' }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Version History</Typography>

      {isEditor && (
        <Box sx={{ mb: 3 }}>
          <form onSubmit={handleSaveSnapshot}>
            <TextField
              placeholder="Snapshot name (optional)..."
              size="small"
              fullWidth
              value={newVersionName}
              onChange={(e) => setNewVersionName(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', mb: 1 } }}
            />
            <Button
              type="submit"
              variant="contained"
              size="small"
              fullWidth
              sx={{ textTransform: 'none', background: 'var(--accent-primary)', borderRadius: '8px' }}
            >
              Save Snapshot
            </Button>
          </form>
          {error && <Alert severity="error" sx={{ mt: 1, py: 0, borderRadius: '8px' }}>{error}</Alert>}
        </Box>
      )}

      <Divider sx={{ borderColor: 'var(--border-color)', mb: 2 }} />

      <Box sx={{ flex: 1, overflowY: 'auto', pr: 1 }}>
        {versions.length === 0 ? (
          <Typography variant="body2" color="var(--text-muted)" sx={{ textAlign: 'center', mt: 4 }}>
            No snapshots saved yet
          </Typography>
        ) : (
          <List sx={{ p: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {versions.map((v) => (
              <Card
                key={v._id}
                sx={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  boxShadow: 'none',
                  p: 1.5,
                }}
              >
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1.5 }}>
                  <Avatar sx={{ width: 24, height: 24, bgcolor: v.createdBy?.avatarColor, fontSize: '10px', fontWeight: 600 }}>
                    {getInitials(v.createdBy?.username || 'U')}
                  </Avatar>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{v.createdBy?.username}</Typography>
                </Box>

                <Typography variant="body2" sx={{ mb: 1.5, fontWeight: 500 }}>
                  {v.name}
                </Typography>

                <Box sx={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" color="var(--text-muted)">
                    {new Date(v.createdAt).toLocaleString()}
                  </Typography>
                  {isEditor && (
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => handleRestoreVersion(v._id)}
                      sx={{ textTransform: 'none', background: 'var(--accent-secondary)', fontSize: '11px', borderRadius: '6px' }}
                    >
                      Restore
                    </Button>
                  )}
                </Box>
              </Card>
            ))}
          </List>
        )}
      </Box>
    </Box>
  );
};
export default VersionHistory;
