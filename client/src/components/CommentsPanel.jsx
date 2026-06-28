import React, { useEffect, useState } from 'react';
import { Box, Typography, TextField, Button, List, Card, Avatar, Divider, IconButton, Alert } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { commentService } from '../services/commentService';

export const CommentsPanel = ({ documentId, userRole, currentSelection, selectedText }) => {
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [replyTexts, setReplyTexts] = useState({});
  const [error, setError] = useState(null);

  const fetchComments = async () => {
    try {
      const data = await commentService.getComments(documentId);
      setComments(data);
    } catch (err) {
      console.error('Failed to load comments:', err);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [documentId]);

  const handleCreateComment = async (e) => {
    e.preventDefault();
    if (!newCommentText) return;
    
    const range = currentSelection || { index: 0, length: 0 };

    try {
      const newComment = await commentService.createComment(documentId, newCommentText, range);
      setComments(prev => [...prev, newComment]);
      setNewCommentText('');
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post comment.');
    }
  };

  const handleReplySubmit = async (commentId) => {
    const text = replyTexts[commentId];
    if (!text) return;
    try {
      const updatedComment = await commentService.replyComment(documentId, commentId, text);
      setComments(prev => prev.map(c => c._id === commentId ? updatedComment : c));
      setReplyTexts(prev => ({ ...prev, [commentId]: '' }));
    } catch (err) {
      console.error('Failed to reply:', err);
    }
  };

  const handleResolveComment = async (commentId) => {
    try {
      const resolved = await commentService.resolveComment(documentId, commentId);
      setComments(prev => prev.map(c => c._id === commentId ? resolved : c));
    } catch (err) {
      console.error('Failed to resolve comment:', err);
    }
  };

  const getInitials = (name) => name.slice(0, 2).toUpperCase();

  const isCommenter = ['OWNER', 'EDITOR', 'COMMENTER'].includes(userRole);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 2, boxSizing: 'border-box' }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Comments</Typography>

      {isCommenter && (
        <Box sx={{ mb: 3 }}>
          {selectedText ? (
            <Typography variant="caption" color="var(--accent-secondary)" sx={{ mb: 1, display: 'block' }}>
              Commenting on: "{selectedText.length > 30 ? selectedText.slice(0, 30) + '...' : selectedText}"
            </Typography>
          ) : (
            <Typography variant="caption" color="var(--text-muted)" sx={{ mb: 1, display: 'block' }}>
              Select text in the editor to attach comment.
            </Typography>
          )}
          <form onSubmit={handleCreateComment}>
            <TextField
              placeholder="Add a comment..."
              size="small"
              fullWidth
              multiline
              rows={2}
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', mb: 1 } }}
            />
            <Button
              type="submit"
              variant="contained"
              size="small"
              fullWidth
              sx={{ textTransform: 'none', background: 'var(--accent-primary)', borderRadius: '8px' }}
            >
              Comment
            </Button>
          </form>
          {error && <Alert severity="error" sx={{ mt: 1, py: 0, borderRadius: '8px' }}>{error}</Alert>}
        </Box>
      )}

      <Divider sx={{ borderColor: 'var(--border-color)', mb: 2 }} />

      <Box sx={{ flex: 1, overflowY: 'auto', pr: 1 }}>
        {comments.length === 0 ? (
          <Typography variant="body2" color="var(--text-muted)" sx={{ textAlign: 'center', mt: 4 }}>
            No comments yet
          </Typography>
        ) : (
          <List sx={{ p: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {comments.map((comment) => (
              <Card
                key={comment._id}
                sx={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  boxShadow: 'none',
                  p: 1.5,
                  opacity: comment.resolved ? 0.6 : 1,
                }}
              >
                <Box sx={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1, width: '100%' }}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Avatar sx={{ width: 24, height: 24, bgcolor: comment.author?.avatarColor, fontSize: '10px', fontWeight: 600 }}>
                      {getInitials(comment.author?.username || 'U')}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.1 }}>{comment.author?.username}</Typography>
                      {comment.section && (
                        <Typography variant="caption" sx={{ color: 'var(--accent-secondary)', fontSize: '10px', display: 'block', mt: 0.2 }}>
                          Section: {comment.section.charAt(0).toUpperCase() + comment.section.slice(1)}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  {!comment.resolved && (['OWNER', 'EDITOR'].includes(userRole) || userRole === 'COMMENTER') && (
                    <IconButton size="small" onClick={() => handleResolveComment(comment._id)} sx={{ color: 'var(--text-muted)', '&:hover': { color: 'var(--accent-secondary)' } }}>
                      <CheckCircleIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>

                <Typography variant="body2" sx={{ mb: 1.5, pl: 0.5, wordBreak: 'break-word' }}>
                  {comment.text}
                </Typography>

                {comment.resolved && (
                  <Typography variant="caption" color="var(--accent-secondary)" sx={{ pl: 0.5, mb: 1.5, display: 'block' }}>
                    Resolved by {comment.resolvedBy?.username || 'Editor'}
                  </Typography>
                )}

                {comment.replies && comment.replies.length > 0 && (
                  <Box sx={{ pl: 2, borderLeft: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 1, mb: 1.5 }}>
                    {comment.replies.map((reply) => (
                      <Box key={reply._id}>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.5 }}>
                          <Avatar sx={{ width: 18, height: 18, bgcolor: reply.author?.avatarColor, fontSize: '8px', fontWeight: 600 }}>
                            {getInitials(reply.author?.username || 'U')}
                          </Avatar>
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>{reply.author?.username}</Typography>
                        </Box>
                        <Typography variant="caption" sx={{ pl: 0.5, display: 'block', wordBreak: 'break-word' }}>
                          {reply.text}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}

                {!comment.resolved && isCommenter && (
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <TextField
                      placeholder="Reply..."
                      size="small"
                      fullWidth
                      value={replyTexts[comment._id] || ''}
                      onChange={(e) => setReplyTexts(prev => ({ ...prev, [comment._id]: e.target.value }))}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px' } }}
                    />
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleReplySubmit(comment._id)}
                      sx={{ textTransform: 'none', background: 'var(--accent-secondary)', borderRadius: '6px' }}
                    >
                      Reply
                    </Button>
                  </Box>
                )}
              </Card>
            ))}
          </List>
        )}
      </Box>
    </Box>
  );
};
export default CommentsPanel;
