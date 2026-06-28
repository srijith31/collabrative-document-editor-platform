import React, { useEffect, useState, useRef } from 'react';
import {
  Box, Container, Typography, Button, TextField, Select, MenuItem, Card, CardContent,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Avatar, CircularProgress, Alert, Tooltip, Tab, Tabs
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ShareIcon from '@mui/icons-material/Share';
import LogoutIcon from '@mui/icons-material/Logout';
import LinkIcon from '@mui/icons-material/Link';
import EventNoteIcon from '@mui/icons-material/EventNote';
import DescriptionIcon from '@mui/icons-material/Description';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ContactPageIcon from '@mui/icons-material/ContactPage';
import AssignmentIcon from '@mui/icons-material/Assignment';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { documentService } from '../services/documentService';
import { commentService } from '../services/commentService';
import { NotificationBell } from '../components/NotificationBell';
import templateService from '../services/templateService';
import logoIcon from '../assets/logo_icon.png';

export const Dashboard = () => {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [documents, setDocuments] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [activeTab, setActiveTab] = useState('recent');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  
  const [inviteToken, setInviteToken] = useState('');
  const [redeemError, setRedeemError] = useState(null);
  const [redeemLoading, setRedeemLoading] = useState(false);



  const [shareOpen, setShareOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [shareEmail, setShareEmail] = useState('');
  const [shareRole, setShareRole] = useState('VIEWER');
  const [shareLoading, setShareLoading] = useState(false);
  const [shareMessage, setShareMessage] = useState(null);
  const [shareLink, setShareLink] = useState(null);

  const [profileOpen, setProfileOpen] = useState(false);
  const [profileUsername, setProfileUsername] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [profileConfirmPassword, setProfileConfirmPassword] = useState('');
  const [profileAvatarColor, setProfileAvatarColor] = useState('');
  const [profileError, setProfileError] = useState(null);
  const [profileMessage, setProfileMessage] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const handleOpenProfile = () => {
    if (!user) return;
    setProfileUsername(user.username);
    setProfileEmail(user.email);
    setProfileAvatarColor(user.avatarColor || '#6366f1');
    setProfilePassword('');
    setProfileConfirmPassword('');
    setProfileError(null);
    setProfileMessage(null);
    setProfileOpen(true);
  };

  const handleProfileSubmit = async () => {
    if (!profileUsername) {
      setProfileError('Username cannot be empty');
      return;
    }
    if (profilePassword && profilePassword.length < 6) {
      setProfileError('Password must be at least 6 characters');
      return;
    }
    if (profilePassword !== profileConfirmPassword) {
      setProfileError('Passwords do not match');
      return;
    }

    setProfileLoading(true);
    setProfileError(null);
    setProfileMessage(null);

    try {
      await updateProfile({
        username: profileUsername,
        avatarColor: profileAvatarColor,
        ...(profilePassword ? { password: profilePassword } : {})
      });
      setProfileMessage('Profile updated successfully!');
      setProfilePassword('');
      setProfileConfirmPassword('');
      setTimeout(() => {
        setProfileOpen(false);
      }, 1500);
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      if (activeTab === 'pdf_templates') {
        const data = await templateService.getUserTemplates();
        setDocuments(data);
      } else {
        const data = await documentService.getDocuments(search, sort, activeTab);
        setDocuments(data);
      }
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const data = await documentService.getDocuments('', 'newest', 'templates');
      setTemplates(data.filter(t => t.title !== 'Academic Report Studio'));
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [search, sort, activeTab]);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleCreateDocument = async (templateId, type) => {
    try {
      const doc = await documentService.createDocument(templateId, type);
      navigate(`/document/${doc._id}`);
    } catch (err) {
      console.error('Failed to create document:', err);
    }
  };

  const handleToggleStar = async (id, e) => {
    e.stopPropagation();
    try {
      await documentService.toggleStar(id);
      setDocuments((prev) =>
        prev.map((doc) =>
          doc._id === id ? { ...doc, isStarred: !doc.isStarred } : doc
        )
      );
      if (activeTab === 'starred') {
        setDocuments((prev) => prev.filter((doc) => doc._id !== id));
      }
    } catch (err) {
      console.error('Failed to toggle star:', err);
    }
  };

  const handleDeleteDocument = async (id, isDocOwner, e) => {
    e.stopPropagation();
    const isTemplate = activeTab === 'pdf_templates';
    const confirmMessage = isTemplate 
      ? 'Are you sure you want to delete this template?' 
      : (isDocOwner 
        ? 'Are you sure you want to delete this document?' 
        : 'Are you sure you want to remove yourself from this document?');

    if (!window.confirm(confirmMessage)) return;
    try {
      if (isTemplate) {
        await templateService.deleteTemplate(id);
      } else {
        await documentService.deleteDocument(id);
      }
      setDocuments((prev) => prev.filter((doc) => doc._id !== id));
    } catch (err) {
      console.error(`Failed to delete ${isTemplate ? 'template' : 'document'}:`, err);
      alert(err.response?.data?.message || `Failed to delete ${isTemplate ? 'template' : 'document'}.`);
    }
  };

  const handleOpenShare = (id, e) => {
    e.stopPropagation();
    setSelectedDocId(id);
    setShareOpen(true);
    setShareMessage(null);
    setShareLink(null);
    setShareEmail('');
  };

  const handleShareSubmit = async () => {
    if (!selectedDocId || !shareEmail) return;
    setShareLoading(true);
    setShareMessage(null);
    setShareLink(null);
    try {
      const data = await commentService.createInvite(selectedDocId, shareEmail, shareRole);
      setShareMessage(`Invite sent successfully to ${shareEmail}!`);
      setShareLink(data.inviteLink);
      fetchDocuments();
    } catch (err) {
      setShareMessage(err.response?.data?.message || 'Failed to share document.');
    } finally {
      setShareLoading(false);
    }
  };

  const handleRedeemInvite = async (e) => {
    e.preventDefault();
    if (!inviteToken) return;
    setRedeemLoading(true);
    setRedeemError(null);
    try {
      const data = await commentService.acceptInvite(inviteToken);
      navigate(`/document/${data.documentId}`);
    } catch (err) {
      setRedeemError(err.response?.data?.message || 'Invalid or expired invitation token');
    } finally {
      setRedeemLoading(false);
    }
  };

  const getUserInitials = (username) => {
    if (!username || typeof username !== 'string') return 'U';
    return username.slice(0, 2).toUpperCase();
  };

  return (
    <Box sx={{ minHeight: '100vh', background: '#0b0b0e', pb: 8 }}>
      <Box sx={{ borderBottom: '1px solid var(--border-color)', py: 2, background: 'var(--bg-secondary)' }}>
        <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }} onClick={() => navigate('/')}>
            <Box
              component="img"
              src={logoIcon}
              alt="CollabDoc Logo"
              sx={{
                height: 32,
                width: 'auto',
                objectFit: 'contain'
              }}
            />
            <Typography variant="h5" sx={{ fontWeight: 700, background: 'linear-gradient(90deg, #8a2be2 0%, #6366f1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              CollabDoc Editor
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              onClick={() => navigate('/analytics')}
              variant="outlined"
              size="small"
              sx={{
                borderRadius: '8px',
                borderColor: 'var(--accent-secondary)',
                color: '#f1f5f9',
                textTransform: 'none',
                '&:hover': {
                  background: 'rgba(99, 102, 241, 0.1)',
                  borderColor: 'var(--accent-primary)'
                }
              }}
            >
              Analytics
            </Button>
            <NotificationBell />
            <Tooltip title="Profile Settings">
              <Avatar
                onClick={handleOpenProfile}
                sx={{
                  bgcolor: user?.avatarColor || 'var(--accent-primary)',
                  width: 36,
                  height: 36,
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'scale(1.1)' }
                }}
              >
                {user ? getUserInitials(user.username) : 'U'}
              </Avatar>
            </Tooltip>
            <IconButton onClick={logout} sx={{ color: 'var(--text-muted)' }}>
              <LogoutIcon />
            </IconButton>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mt: 5 }}>


        {/* Redeem Invite + Search/Sort sections */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, mb: 4 }}>
          <Box sx={{ flex: { xs: '1 1 100%', md: '0 0 40%' } }}>
            <Card className="glass-panel" sx={{ p: 3, background: 'rgba(18, 18, 23, 0.5)' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>Join via Invite Code</Typography>
              <form onSubmit={handleRedeemInvite}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    placeholder="Enter invite token code..."
                    size="small"
                    fullWidth
                    value={inviteToken}
                    onChange={(e) => setInviteToken(e.target.value)}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={redeemLoading}
                    sx={{ borderRadius: '8px', background: 'var(--accent-secondary)' }}
                  >
                    {redeemLoading ? <CircularProgress size={20} /> : 'Join'}
                  </Button>
                </Box>
              </form>
              {redeemError && <Alert severity="error" sx={{ mt: 2, borderRadius: '8px' }}>{redeemError}</Alert>}
            </Card>
          </Box>
          
          <Box sx={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
            <TextField
              placeholder="Search documents..."
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ width: 250, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            />
            <Select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              size="small"
              sx={{ width: 180, borderRadius: '8px' }}
            >
              <MenuItem value="newest">Newest Updated</MenuItem>
              <MenuItem value="oldest">Oldest Created</MenuItem>
              <MenuItem value="alphabetical">Alphabetical</MenuItem>
            </Select>
          </Box>
        </Box>

        {/* Template Gallery */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#f1f5f9' }}>
            Start a new document
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr', md: 'repeat(5, 1fr)' }, gap: 2 }}>
            {templates.map((tpl) => {
              let icon = <DescriptionIcon sx={{ fontSize: 28, color: '#94a3b8' }} />;
              let iconBg = 'rgba(255, 255, 255, 0.05)';

              if (tpl.title === 'Meeting Notes') {
                icon = <EventNoteIcon sx={{ fontSize: 28, color: '#6366f1' }} />;
                iconBg = 'rgba(99, 102, 241, 0.1)';
              } else if (tpl.title === 'Project Proposal') {
                icon = <AssignmentIcon sx={{ fontSize: 28, color: '#06b6d4' }} />;
                iconBg = 'rgba(6, 182, 212, 0.1)';
              } else if (tpl.title === 'Research Notes' || tpl.title === 'Sprint Planning') {
                icon = <AssessmentIcon sx={{ fontSize: 28, color: '#10b981' }} />;
                iconBg = 'rgba(16, 185, 129, 0.1)';
              } else if (tpl.title === 'Resume Builder' || tpl.title === 'Resume Template') {
                icon = <ContactPageIcon sx={{ fontSize: 28, color: '#ec4899' }} />;
                iconBg = 'rgba(236, 72, 153, 0.1)';
              } else if (tpl.title === 'Vardhaman College Report Builder' || tpl.type === 'COLLEGE_REPORT') {
                icon = <AssessmentIcon sx={{ fontSize: 28, color: '#a855f7' }} />;
                iconBg = 'rgba(168, 85, 247, 0.1)';
              } else if (tpl.title === 'Blank Document') {
                icon = <AddIcon sx={{ fontSize: 28, color: '#f59e0b' }} />;
                iconBg = 'rgba(245, 158, 11, 0.1)';
              }

              return (
                <Card
                  key={tpl._id}
                  className="glass-panel"
                  onClick={() => handleCreateDocument(tpl._id)}
                  sx={{
                    cursor: 'pointer',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-color)',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      borderColor: 'var(--accent-secondary)',
                      boxShadow: '0 8px 20px rgba(99, 102, 241, 0.1)',
                    }
                  }}
                >
                  <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2.5, textAlign: 'center' }}>
                    <Box sx={{ width: 48, height: 48, borderRadius: '50%', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.5 }}>
                      {icon}
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '12px' }}>
                      {tpl.title}
                    </Typography>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        </Box>

        {/* Dashboard Tabs */}
        <Box sx={{ borderBottom: '1px solid var(--border-color)', mb: 4 }}>
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            sx={{
              '& .MuiTabs-indicator': { backgroundColor: 'var(--accent-secondary)' },
              '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, color: 'var(--text-muted)', '&.Mui-selected': { color: '#fff' } }
            }}
          >
            <Tab label="Documents" value="documents" />
            <Tab label="Resumes" value="resumes" />
            <Tab label="College Reports" value="reports" />
            <Tab label="Shared with me" value="shared" />
            <Tab label="Starred" value="starred" />
            <Tab label="Recent" value="recent" />
          </Tabs>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress color="secondary" />
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 3 }}>
            {/* Create Card - Show on recent, documents, resumes, reports tabs */}
            {(activeTab === 'recent' || activeTab === 'documents' || activeTab === 'resumes' || activeTab === 'reports') && (
              <Card
                className="glass-panel"
                onClick={() => handleCreateDocument(undefined, activeTab === 'resumes' ? 'RESUME' : activeTab === 'reports' ? 'COLLEGE_REPORT' : 'DOCUMENT')}
                sx={{
                  height: 180,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  borderStyle: 'dashed',
                  borderWidth: '2px',
                  background: 'transparent',
                  borderColor: 'rgba(255, 255, 255, 0.15)',
                  '&:hover': {
                    borderColor: 'var(--accent-secondary)',
                    background: 'rgba(99, 102, 241, 0.03)',
                  }
                }}
              >
                <Box sx={{ textAlign: 'center' }}>
                  <AddIcon sx={{ fontSize: 40, color: 'var(--accent-secondary)', mb: 1 }} />
                  <Typography sx={{ fontWeight: 600 }}>
                    {activeTab === 'resumes' ? 'Create Blank Resume' : activeTab === 'reports' ? 'Create Blank Report' : 'Create Blank Document'}
                  </Typography>
                </Box>
              </Card>
            )}

            {/* Document Entries */}
            {documents.length === 0 ? (
              <Box sx={{ gridColumn: '1 / -1', textAlign: 'center', py: 6 }}>
                <Typography color="var(--text-muted)">
                  No {activeTab === 'pdf_templates' ? 'templates' : 'documents'} found
                </Typography>
              </Box>
            ) : (
              documents.map((doc) => {
                const isTemplate = activeTab === 'pdf_templates';
                const docOwnerId = typeof doc.owner === 'object' ? doc.owner?._id || doc.owner?.id : doc.owner;
                const currentUserId = user?._id || user?.id;
                const isOwner = isTemplate || (docOwnerId && currentUserId && docOwnerId.toString() === currentUserId.toString());
                return (
                  <Card
                    key={doc._id}
                    className="glass-panel"
                    onClick={() => navigate(isTemplate ? `/template-editor/${doc._id}` : `/document/${doc._id}`)}
                    sx={{
                      height: 180,
                      cursor: 'pointer',
                      background: 'rgba(18, 18, 23, 0.5)',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                      }
                    }}
                  >
                    <CardContent sx={{ height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography variant="h6" noWrap sx={{ fontWeight: 600, mb: 0.5 }}>
                            {isTemplate ? doc.name : doc.title}
                          </Typography>
                          <Typography variant="caption" color="var(--text-muted)">
                            {isTemplate ? `Sections: ${doc.sections?.length || 0}` : `Owner: ${doc.owner?.username || 'You'}`}
                          </Typography>
                        </Box>
                        {!isTemplate && (
                          <Tooltip title={doc.isStarred ? "Unstar" : "Star"}>
                            <IconButton onClick={(e) => handleToggleStar(doc._id, e)} sx={{ p: 0.5, ml: 1, color: doc.isStarred ? '#f59e0b' : 'var(--text-muted)' }}>
                              {doc.isStarred ? <StarIcon fontSize="small" /> : <StarBorderIcon fontSize="small" />}
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="var(--text-muted)">
                          {isTemplate 
                            ? `Created: ${new Date(doc.createdAt).toLocaleDateString()}`
                            : `Updated: ${new Date(doc.updatedAt).toLocaleDateString()}`
                          }
                        </Typography>
                        <Box>
                          {isTemplate ? (
                            <Tooltip title="Delete Template">
                              <IconButton onClick={(e) => handleDeleteDocument(doc._id, true, e)} sx={{ color: 'var(--text-muted)', '&:hover': { color: '#f44336' } }}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <>
                              {isOwner && (
                                <Tooltip title="Share Document">
                                  <IconButton onClick={(e) => handleOpenShare(doc._id, e)} sx={{ color: 'var(--text-muted)' }}>
                                    <ShareIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                              <Tooltip title={isOwner ? "Delete Document" : "Leave Document"}>
                                <IconButton onClick={(e) => handleDeleteDocument(doc._id, isOwner, e)} sx={{ color: 'var(--text-muted)', '&:hover': { color: '#f44336' } }}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </Box>
        )}
      </Container>

      {/* Share Document Dialog */}
      <Dialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        slotProps={{
          paper: {
            sx: {
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              width: 400,
            }
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Share Document</DialogTitle>
        <DialogContent>
          <TextField
            label="User Email Address"
            variant="outlined"
            fullWidth
            size="small"
            value={shareEmail}
            onChange={(e) => setShareEmail(e.target.value)}
            sx={{ mt: 1.5, mb: 2 }}
          />
          <Select
            value={shareRole}
            onChange={(e) => setShareRole(e.target.value)}
            fullWidth
            size="small"
            sx={{ mb: 2 }}
          >
            <MenuItem value="EDITOR">Editor (Can view and edit)</MenuItem>
            <MenuItem value="COMMENTER">Commenter (Can view, comment, and suggest)</MenuItem>
            <MenuItem value="VIEWER">Viewer (Can read only)</MenuItem>
          </Select>
          {shareMessage && (
            <Alert severity={shareMessage.includes('successfully') ? 'success' : 'error'} sx={{ mb: 2 }}>
              {shareMessage}
            </Alert>
          )}
          {shareLink && (
            <Box sx={{ p: 1.5, background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 1, wordBreak: 'break-all' }}>
              <LinkIcon sx={{ color: 'var(--accent-secondary)' }} />
              <Typography variant="caption" sx={{ userSelect: 'all' }}>
                Invite Link: {shareLink}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setShareOpen(false)} color="inherit" sx={{ textTransform: 'none' }}>
            Close
          </Button>
          <Button
            onClick={handleShareSubmit}
            variant="contained"
            disabled={shareLoading}
            sx={{ textTransform: 'none', background: 'var(--accent-primary)', '&:hover': { background: 'var(--accent-secondary)' } }}
          >
            {shareLoading ? <CircularProgress size={20} /> : 'Generate Invite Link'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Profile Settings Dialog */}
      <Dialog
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        slotProps={{
          paper: {
            sx: {
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              width: 420,
            }
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Profile Settings</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 1 }}>
              <Avatar sx={{ bgcolor: profileAvatarColor, width: 64, height: 64, fontSize: '24px', fontWeight: 600 }}>
                {profileUsername ? getUserInitials(profileUsername) : 'U'}
              </Avatar>
              <Typography variant="caption" color="var(--text-muted)">Avatar Preview</Typography>
            </Box>

            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Choose Avatar Color</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#009688', '#4caf50', '#ff9800', '#ff5722'].map((color) => (
                  <Box
                    key={color}
                    onClick={() => setProfileAvatarColor(color)}
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      bgcolor: color,
                      cursor: 'pointer',
                      border: profileAvatarColor === color ? '2px solid #fff' : '2px solid transparent',
                      boxShadow: profileAvatarColor === color ? '0 0 8px rgba(255,255,255,0.5)' : 'none',
                      transition: 'transform 0.1s',
                      '&:hover': { transform: 'scale(1.2)' }
                    }}
                  />
                ))}
              </Box>
            </Box>

            <TextField
              label="Username"
              variant="outlined"
              fullWidth
              size="small"
              value={profileUsername}
              onChange={(e) => setProfileUsername(e.target.value)}
            />

            <TextField
              label="Email Address"
              variant="outlined"
              fullWidth
              size="small"
              value={profileEmail}
              disabled
            />

            <TextField
              label="New Password (leave blank to keep current)"
              type="password"
              variant="outlined"
              fullWidth
              size="small"
              value={profilePassword}
              onChange={(e) => setProfilePassword(e.target.value)}
            />

            {profilePassword && (
              <TextField
                label="Confirm New Password"
                type="password"
                variant="outlined"
                fullWidth
                size="small"
                value={profileConfirmPassword}
                onChange={(e) => setProfileConfirmPassword(e.target.value)}
              />
            )}

            {profileError && <Alert severity="error" sx={{ borderRadius: '8px' }}>{profileError}</Alert>}
            {profileMessage && <Alert severity="success" sx={{ borderRadius: '8px' }}>{profileMessage}</Alert>}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setProfileOpen(false)} color="inherit" sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={handleProfileSubmit}
            variant="contained"
            disabled={profileLoading}
            sx={{ textTransform: 'none', background: 'var(--accent-primary)', '&:hover': { background: 'var(--accent-secondary)' } }}
          >
            {profileLoading ? <CircularProgress size={20} /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
export default Dashboard;
