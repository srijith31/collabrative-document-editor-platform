import React, { useEffect, useState } from 'react';
import { Box, Typography, TextField, Button, List, Card, Avatar, Divider, Alert } from '@mui/material';
import { commentService } from '../services/commentService';

export const SuggestionsPanel = ({
  documentId,
  userRole,
  currentSelection,
  selectedText,
  onAccept,
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [suggestedText, setSuggestedText] = useState('');
  const [error, setError] = useState(null);

  const fetchSuggestions = async () => {
    try {
      const data = await commentService.getSuggestions(documentId);
      setSuggestions(data);
    } catch (err) {
      console.error('Failed to load suggestions:', err);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, [documentId]);

  const handleCreateSuggestion = async (e) => {
    e.preventDefault();
    if (!suggestedText) return;
    if (!currentSelection || currentSelection.length === 0) {
      setError('Please select some text in the editor to suggest a replacement.');
      return;
    }

    try {
      const newSuggestion = await commentService.createSuggestion(
        documentId,
        selectedText,
        suggestedText,
        currentSelection
      );
      setSuggestions(prev => [newSuggestion, ...prev]);
      setSuggestedText('');
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit suggestion.');
    }
  };

  const handleAcceptSuggestion = async (suggestion) => {
    try {
      onAccept(suggestion);
      setSuggestions(prev => prev.map(s => s._id === suggestion._id ? { ...s, status: 'ACCEPTED' } : s));
    } catch (err) {
      console.error('Failed to accept suggestion:', err);
    }
  };

  const handleRejectSuggestion = async (suggestionId) => {
    try {
      await commentService.rejectSuggestion(documentId, suggestionId);
      setSuggestions(prev => prev.map(s => s._id === suggestionId ? { ...s, status: 'REJECTED' } : s));
    } catch (err) {
      console.error('Failed to reject suggestion:', err);
    }
  };

  const getInitials = (name) => name.slice(0, 2).toUpperCase();

  const isCommenter = ['OWNER', 'EDITOR', 'COMMENTER'].includes(userRole);
  const isEditor = ['OWNER', 'EDITOR'].includes(userRole);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 2, boxSizing: 'border-box' }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Suggestions</Typography>

      {isCommenter && (
        <Box sx={{ mb: 3 }}>
          {selectedText ? (
            <Typography variant="caption" color="var(--accent-secondary)" sx={{ mb: 1, display: 'block' }}>
              Replace: "{selectedText.length > 30 ? selectedText.slice(0, 30) + '...' : selectedText}"
            </Typography>
          ) : (
            <Typography variant="caption" color="var(--text-muted)" sx={{ mb: 1, display: 'block' }}>
              Select text in the editor to suggest a change.
            </Typography>
          )}
          <form onSubmit={handleCreateSuggestion}>
            <TextField
              placeholder="Suggest replacement text..."
              size="small"
              fullWidth
              value={suggestedText}
              onChange={(e) => setSuggestedText(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', mb: 1 } }}
            />
            <Button
              type="submit"
              variant="contained"
              size="small"
              fullWidth
              disabled={!selectedText}
              sx={{ textTransform: 'none', background: 'var(--accent-primary)', borderRadius: '8px' }}
            >
              Suggest Edit
            </Button>
          </form>
          {error && <Alert severity="error" sx={{ mt: 1, py: 0, borderRadius: '8px' }}>{error}</Alert>}
        </Box>
      )}

      <Divider sx={{ borderColor: 'var(--border-color)', mb: 2 }} />

      <Box sx={{ flex: 1, overflowY: 'auto', pr: 1 }}>
        {suggestions.length === 0 ? (
          <Typography variant="body2" color="var(--text-muted)" sx={{ textAlign: 'center', mt: 4 }}>
            No suggestions yet
          </Typography>
        ) : (
          <List sx={{ p: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {suggestions.map((s) => (
              <Card
                key={s._id}
                sx={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  boxShadow: 'none',
                  p: 1.5,
                }}
              >
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1.5 }}>
                  <Avatar sx={{ width: 24, height: 24, bgcolor: s.createdBy?.avatarColor, fontSize: '10px', fontWeight: 600 }}>
                    {getInitials(s.createdBy?.username || 'U')}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.1 }}>{s.createdBy?.username}</Typography>
                    {s.section && (
                      <Typography variant="caption" sx={{ color: 'var(--accent-secondary)', fontSize: '10px', display: 'block', mt: 0.2 }}>
                        Section: {s.section.charAt(0).toUpperCase() + s.section.slice(1)} {s.fieldName ? `(${s.fieldName})` : ''}
                      </Typography>
                    )}
                  </Box>
                </Box>

                <Box sx={{ mb: 2, pl: 0.5 }}>
                  <Typography variant="caption" color="var(--text-muted)" sx={{ textDecoration: 'line-through', display: 'block', mb: 0.5 }}>
                    Original: "{s.originalText}"
                  </Typography>
                  <Typography variant="body2" color="#4caf50" sx={{ fontWeight: 500 }}>
                    Suggested: "{s.suggestedText}"
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{
                    color: s.status === 'ACCEPTED' ? '#4caf50' : s.status === 'REJECTED' ? '#f44336' : '#ff9800',
                    fontWeight: 600,
                  }}>
                    {s.status}
                  </Typography>
                  
                  {s.status === 'PENDING' && isEditor && (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleRejectSuggestion(s._id)}
                        sx={{ textTransform: 'none', background: '#f44336', color: '#fff', fontSize: '11px', borderRadius: '6px', px: 1 }}
                      >
                        Reject
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleAcceptSuggestion(s)}
                        sx={{ textTransform: 'none', background: '#4caf50', color: '#fff', fontSize: '11px', borderRadius: '6px', px: 1 }}
                      >
                        Accept
                      </Button>
                    </Box>
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
export default SuggestionsPanel;
