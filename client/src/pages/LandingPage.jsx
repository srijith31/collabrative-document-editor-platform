import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Button, Grid, Card, CardContent, Avatar, AvatarGroup, Chip, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PeopleIcon from '@mui/icons-material/People';
import HistoryIcon from '@mui/icons-material/History';
import SecurityIcon from '@mui/icons-material/Security';
import CodeIcon from '@mui/icons-material/Code';
import CommentIcon from '@mui/icons-material/Comment';
import DynamicFeedIcon from '@mui/icons-material/DynamicFeed';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SearchIcon from '@mui/icons-material/Search';
import logoIcon from '../assets/logo_icon.png';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';

export const LandingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [typingText, setTypingText] = useState('☐ Add PDF Export...');
  const [cursorIndex, setCursorIndex] = useState(0);

  const [contactOpen, setContactOpen] = useState(false);

  // Auto-typing animation for the hero mockup editor
  useEffect(() => {
    const text = '☐ Add PDF Export  (Owner: @Srijith, Priority: 🔴 High, Tags: #Frontend)';
    let i = 0;
    const interval = setInterval(() => {
      setTypingText(text.substring(0, i + 1));
      setCursorIndex(i + 1);
      i++;
      if (i >= text.length) {
        setTimeout(() => {
          i = 0;
        }, 3500); // Pause before restarting
      }
    }, 80);

    return () => clearInterval(interval);
  }, []);

  const handleNavToApp = (action) => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate(action === 'signup' ? '/register' : '/login');
    }
  };

  const features = [
    {
      category: 'Collaboration',
      items: [
        { title: 'Real-time Editing', desc: 'Sync document changes instantly across all clients using optimized operational transformations.', icon: <CodeIcon /> },
        { title: 'Live Cursor Tracking', desc: 'See where your team members are looking and typing with visual cursor carets.', icon: <PeopleIcon /> },
        { title: 'Presence Indicators', desc: 'Know who is active or idle in the document with status colors (🟢/🟡).', icon: <PeopleIcon /> }
      ]
    },
    {
      category: 'Review Workflow',
      items: [
        { title: 'Comments Feed', desc: 'Discuss specific lines, add replies, and resolve queries without leaving the editor.', icon: <CommentIcon /> },
        { title: 'Inline Suggestions', desc: 'Propose edits that editors can review, accept, or reject with a single click.', icon: <DynamicFeedIcon /> },
        { title: 'Version History', desc: 'Automatically snapshot versions, browse snapshots, and restore content at any time.', icon: <HistoryIcon /> }
      ]
    },
    {
      category: 'Security & Permissions',
      items: [
        { title: 'JWT Authentication', desc: 'Secure register and login with password hashing and robust token auth.', icon: <SecurityIcon /> },
        { title: 'Role-Based Access', desc: 'Define permissions for OWNER, EDITOR, COMMENTER, or VIEWER.', icon: <SecurityIcon /> },
        { title: 'Secure Invitation Links', desc: 'Generate single-use or target-email invitation codes for controlled sharing.', icon: <SecurityIcon /> }
      ]
    },
    {
      category: 'Productivity & Insights',
      items: [
        { title: 'Find & Replace', desc: 'A desktop-grade search tool inside the editor supporting batch edits.', icon: <SearchIcon /> },
        { title: 'Analytics Dashboard', desc: 'Track document creation, recent edits, and overall workspace insights.', icon: <AssessmentIcon /> },
        { title: 'Activity Tracking & Leaderboard', desc: 'View granular logs of edits, comments, resolves, and see top contributors.', icon: <AssessmentIcon /> }
      ]
    }
  ];

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #09090b 0%, #020205 100%)', color: '#e2e8f0', overflowX: 'hidden' }}>
      
      {/* 1. Navigation Bar */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 1100,
          background: 'rgba(9, 9, 11, 0.8)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #1f1f29',
          py: 2,
        }}
      >
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
            <Typography variant="subtitle1" sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>
              CollabDoc Editor
            </Typography>
          </Box>

          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 4 }}>
            <LinkAnchor href="#features">Features</LinkAnchor>
            <LinkAnchor href="#how-it-works">How It Works</LinkAnchor>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {user ? (
              <>
                <Button onClick={() => navigate('/dashboard')} size="small" variant="outlined" sx={{ textTransform: 'none', borderRadius: '8px', borderColor: 'var(--border-color)', color: '#fff' }}>
                  Dashboard
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => handleNavToApp('login')} size="small" sx={{ textTransform: 'none', color: 'var(--text-muted)' }}>
                  Login
                </Button>
                <Button
                  onClick={() => handleNavToApp('signup')}
                  variant="contained"
                  size="small"
                  sx={{
                    textTransform: 'none',
                    borderRadius: '8px',
                    background: 'linear-gradient(90deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                    boxShadow: '0 4px 15px var(--accent-glow)',
                    '&:hover': {
                      background: 'linear-gradient(90deg, var(--accent-secondary) 0%, var(--accent-primary) 100%)',
                    }
                  }}
                >
                  Sign Up
                </Button>
              </>
            )}
          </Box>
        </Container>
      </Box>

      {/* 2. Hero Section */}
      <Container maxWidth="lg" sx={{ pt: { xs: 8, md: 14 }, pb: 8 }}>
        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box sx={{ maxWidth: 540 }}>
              <Chip
                label="Real-time Collaboration Platform"
                size="small"
                sx={{
                  bgcolor: 'rgba(99, 102, 241, 0.1)',
                  color: 'var(--accent-secondary)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  fontWeight: 600,
                  mb: 3,
                }}
              />
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 800,
                  letterSpacing: '-1.5px',
                  lineHeight: 1.15,
                  background: 'linear-gradient(135deg, #fff 30%, #a5b4fc 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 3
                }}
              >
                Collaborate on Documents in Real Time
              </Typography>
              <Typography variant="body1" sx={{ color: 'var(--text-muted)', fontSize: '17px', lineHeight: 1.6, mb: 4 }}>
                Create, edit, comment, review, and share documents with your team using live collaboration, version history, suggestions, and analytics.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  onClick={() => handleNavToApp('signup')}
                  variant="contained"
                  endIcon={<ArrowForwardIcon />}
                  sx={{
                    py: 1.5,
                    px: 3.5,
                    borderRadius: '10px',
                    fontWeight: 600,
                    textTransform: 'none',
                    background: 'linear-gradient(90deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                    boxShadow: '0 4px 20px var(--accent-glow)',
                    '&:hover': {
                      background: 'linear-gradient(90deg, var(--accent-secondary) 0%, var(--accent-primary) 100%)',
                    }
                  }}
                >
                  Get Started
                </Button>
                <Button
                  component="a"
                  href="#how-it-works"
                  variant="outlined"
                  startIcon={<PlayArrowIcon />}
                  sx={{
                    py: 1.5,
                    px: 3.5,
                    borderRadius: '10px',
                    fontWeight: 600,
                    textTransform: 'none',
                    borderColor: 'var(--border-color)',
                    color: '#fff',
                    '&:hover': {
                      background: 'rgba(255,255,255,0.03)',
                      borderColor: 'rgba(255,255,255,0.3)',
                    }
                  }}
                >
                  Watch Demo
                </Button>
              </Box>
            </Box>
          </Grid>

          {/* Hero Visual Mockup */}
          <Grid item xs={12} md={6}>
            <Box
              className="glass-panel"
              sx={{
                background: 'rgba(18, 18, 23, 0.45)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5), 0 0 40px rgba(138,43,226,0.05)',
                overflow: 'hidden',
                position: 'relative',
                height: 400,
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Mockup Editor Header */}
              <Box sx={{ borderBottom: '1px solid #1f1f29', py: 1.5, px: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(18,18,23,0.8)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#f44336' }} />
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#ffeb3b' }} />
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#4caf50' }} />
                  <Typography variant="caption" sx={{ fontWeight: 600, ml: 1, color: '#f1f5f9' }}>
                    📝 Weekly Product Meeting
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Typography variant="caption" sx={{ color: 'var(--text-muted)', fontSize: '11px', display: { xs: 'none', sm: 'inline' } }}>
                    Attendees: 5
                  </Typography>
                  <AvatarGroup max={5} sx={{ '& .MuiAvatar-root': { width: 24, height: 24, fontSize: '10px', border: '1px solid #121217 !important' } }}>
                    <Avatar sx={{ bgcolor: '#ec4899' }}>SS</Avatar>
                    <Avatar sx={{ bgcolor: '#06b6d4' }}>RH</Avatar>
                    <Avatar sx={{ bgcolor: '#10b981' }}>PR</Avatar>
                    <Avatar sx={{ bgcolor: '#8b5cf6' }}>JD</Avatar>
                    <Avatar sx={{ bgcolor: '#f59e0b' }}>AN</Avatar>
                  </AvatarGroup>
                </Box>
              </Box>

              {/* Mockup Editor Content area */}
              <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {/* Editor Content */}
                <Box sx={{ flex: 1, p: 3, fontSize: '13px', lineHeight: 1.7, position: 'relative', overflowY: 'auto' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#fff' }}>
                    Weekly Product Review
                  </Typography>
                  <Typography variant="body2" color="var(--text-muted)" sx={{ mb: 2, fontSize: '12px' }}>
                    <strong>Next Meeting:</strong> June 20, 2026 | 11:00 AM
                  </Typography>
                  
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'var(--accent-secondary)', mb: 1, textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>
                    Action Items
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span style={{ color: '#10b981', fontWeight: 'bold' }}>☑</span>
                      <Typography variant="body2" sx={{ fontSize: '13px', color: '#cbd5e1' }}>
                        Analytics Dashboard  <span style={{ color: 'var(--accent-primary)', fontSize: '12px' }}>@Rahul</span>  <span style={{ color: '#f59e0b', fontSize: '11px', padding: '1px 5px', borderRadius: '3px', background: 'rgba(245,158,11,0.1)' }}>🟡 Medium</span> <span style={{ color: '#06b6d4', fontSize: '11px' }}>#Backend</span>
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span style={{ color: '#10b981', fontWeight: 'bold' }}>☑</span>
                      <Typography variant="body2" sx={{ fontSize: '13px', color: '#cbd5e1' }}>
                        Version History  <span style={{ color: 'var(--accent-primary)', fontSize: '12px' }}>@Priya</span>  <span style={{ color: '#10b981', fontSize: '11px', padding: '1px 5px', borderRadius: '3px', background: 'rgba(16,185,129,0.1)' }}>🟢 Low</span> <span style={{ color: '#ec4899', fontSize: '11px' }}>#Frontend</span>
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, position: 'relative' }}>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#cbd5e1', fontSize: '13px' }}>
                      {typingText}
                    </Typography>
                    {/* Mock Cursor Caret */}
                    <Box
                      sx={{
                        width: '2px',
                        height: '16px',
                        bgcolor: '#6366f1',
                        display: 'inline-block',
                        animation: 'blink 1s infinite',
                        position: 'relative',
                        ml: 0.5,
                        '@keyframes blink': {
                          '0%, 100%': { opacity: 1 },
                          '50%': { opacity: 0 }
                        }
                      }}
                    >
                      <Box
                        sx={{
                          position: 'absolute',
                          top: -16,
                          left: 0,
                          bgcolor: '#6366f1',
                          color: '#fff',
                          fontSize: '8px',
                          px: 0.5,
                          py: 0.2,
                          borderRadius: '2px',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Srijith
                      </Box>
                    </Box>
                  </Box>
                </Box>

                {/* Mockup Comments panel */}
                <Box sx={{ width: 185, borderLeft: '1px solid #1f1f29', p: 1.5, background: 'rgba(18, 18, 23, 0.2)', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'var(--text-muted)' }}>
                    Comments (1)
                  </Typography>
                  <Box sx={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.15)', p: 1, borderRadius: '6px' }}>
                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', mb: 0.5 }}>
                      <Avatar sx={{ width: 14, height: 14, bgcolor: '#06b6d4', fontSize: '7px' }}>RH</Avatar>
                      <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '9px' }}>Rahul</Typography>
                    </Box>
                    <Typography variant="caption" sx={{ fontSize: '9px', color: '#e2e8f0', display: 'block', mb: 0.5 }}>
                      Can we add contributor charts?
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', pl: 1, borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
                      <Avatar sx={{ width: 12, height: 12, bgcolor: '#10b981', fontSize: '6px' }}>PR</Avatar>
                      <Typography variant="caption" sx={{ fontSize: '8px', color: 'var(--text-muted)' }}>Priya: Good idea!</Typography>
                    </Box>
                  </Box>

                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'var(--text-muted)' }}>
                    Suggestions (1)
                  </Typography>
                  <Box sx={{ background: 'rgba(236, 72, 153, 0.05)', border: '1px solid rgba(236, 72, 153, 0.15)', p: 1, borderRadius: '6px' }}>
                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', mb: 0.5 }}>
                      <Avatar sx={{ width: 14, height: 14, bgcolor: '#ec4899', fontSize: '7px' }}>PR</Avatar>
                      <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '9px' }}>Priya</Typography>
                    </Box>
                    <Typography variant="caption" sx={{ fontSize: '8px', textDecoration: 'line-through', color: '#f44336' }}>
                      Add PDF export
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '8px', color: '#10b981', display: 'block', fontWeight: 600 }}>
                      Add PDF and DOCX export
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* 3. Features Section */}
      <Container id="features" maxWidth="lg" sx={{ py: 12 }}>
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '-1px', mb: 2 }}>
            All the Features You Need
          </Typography>
          <Typography variant="body1" color="var(--text-muted)" sx={{ maxWidth: 600, mx: 'auto' }}>
            Everything your team needs for seamless document collaboration, review, and insights — all in one place.
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {features.map((cat, idx) => (
            <Grid item xs={12} md={6} key={idx}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'var(--accent-secondary)', textTransform: 'uppercase', tracking: 1 }}>
                  {cat.category}
                </Typography>
              </Box>
              <Grid container spacing={3}>
                {cat.items.map((item, key) => (
                  <Grid item xs={12} key={key}>
                    <Card
                      className="glass-panel"
                      sx={{
                        background: 'rgba(255, 255, 255, 0.01)',
                        border: '1px solid var(--border-color)',
                        '&:hover': {
                          background: 'rgba(99, 102, 241, 0.02)',
                          borderColor: 'rgba(99, 102, 241, 0.15)',
                        }
                      }}
                    >
                      <CardContent sx={{ display: 'flex', gap: 2.5, alignItems: 'flex-start', p: 3 }}>
                        <Box sx={{ p: 1, borderRadius: '8px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-secondary)', display: 'flex' }}>
                          {item.icon}
                        </Box>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5, color: '#f1f5f9' }}>
                            {item.title}
                          </Typography>
                          <Typography variant="body2" color="var(--text-muted)" sx={{ lineHeight: 1.5 }}>
                            {item.desc}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* 4. How It Works Section */}
      <Box id="how-it-works" sx={{ borderY: '1px solid #1f1f29', py: 12, background: 'rgba(18, 18, 23, 0.15)' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
              How It Works
            </Typography>
            <Typography variant="body1" color="var(--text-muted)" sx={{ maxWidth: 500, mx: 'auto' }}>
              Get started collaborating in just a few simple steps.
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {[
              { step: '01', title: 'Create a Document', desc: 'Choose a Blank Document or initialize using one of the professional SaaS templates.' },
              { step: '02', title: 'Invite Collaborators', desc: 'Generate a secure invite link or add collaborators via their email addresses with specific roles.' },
              { step: '03', title: 'Work in Real Time', desc: 'Write simultaneously, track typing cursors, and make suggestions or write comments.' },
              { step: '04', title: 'Track and Restore', desc: 'Analyze changes in activity, review revisions in snapshot archives, and restore historical snapshots.' }
            ].map((s, idx) => (
              <Grid item xs={12} sm={6} md={3} key={idx}>
                <Card
                  className="glass-panel"
                  sx={{
                    background: 'rgba(255,255,255,0.01)',
                    position: 'relative',
                    height: '100%',
                    '&:hover': {
                      borderColor: 'var(--accent-secondary)',
                      boxShadow: '0 4px 15px rgba(99, 102, 241, 0.05)'
                    }
                  }}
                >
                  <CardContent sx={{ p: 4, pt: 6 }}>
                    <Typography
                      variant="h2"
                      sx={{
                        fontWeight: 900,
                        position: 'absolute',
                        top: 10,
                        right: 20,
                        opacity: 0.08,
                        background: 'linear-gradient(135deg, #fff 0%, #a5b4fc 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      {s.step}
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, color: '#f1f5f9' }}>
                      {s.title}
                    </Typography>
                    <Typography variant="body2" color="var(--text-muted)" sx={{ lineHeight: 1.6 }}>
                      {s.desc}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* 5. Footer */}
      <Box sx={{ py: 6, borderTop: '1px solid #1f1f29', background: '#07070a' }}>
        <Container maxWidth="lg" sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              component="img"
              src={logoIcon}
              alt="CollabDoc Logo"
              sx={{
                height: 36,
                width: 'auto',
                objectFit: 'contain'
              }}
            />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#f1f5f9' }}>
                CollabDoc Editor
              </Typography>
              <Typography variant="caption" color="var(--text-muted)">
                A premium real-time multiplayer document editor.
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 3, fontSize: '13px' }}>
            <Box
              onClick={() => setContactOpen(true)}
              sx={{
                color: 'var(--text-muted)',
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'color 0.2s',
                '&:hover': {
                  color: '#fff'
                }
              }}
            >
              Contact Us
            </Box>
          </Box>
          <Typography variant="caption" color="var(--text-muted)">
            © {new Date().getFullYear()} CollabDoc. All rights reserved.
          </Typography>
        </Container>
      </Box>

      {/* Contact Info Dialog */}
      <Dialog
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        slotProps={{
          paper: {
            sx: {
              background: 'rgba(18, 18, 23, 0.95)',
              backdropFilter: 'blur(16px)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              p: 3,
              color: '#f1f5f9',
              boxShadow: '0 24px 64px rgba(0, 0, 0, 0.7)',
              maxWidth: 400,
              width: '100%'
            }
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: '24px', pb: 1, textAlign: 'center', background: 'linear-gradient(135deg, #fff 0%, #a5b4fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Contact Us
        </DialogTitle>
        <DialogContent sx={{ mt: 1 }}>
          <Typography variant="body1" sx={{ color: 'var(--text-muted)', mb: 4, textAlign: 'center', fontWeight: 500 }}>
            Feel free to contact us!
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Email */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1, borderRadius: '8px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-secondary)', display: 'flex' }}>
                <EmailIcon fontSize="medium" />
              </Box>
              <Box>
                <Typography variant="caption" color="var(--text-muted)" sx={{ display: 'block', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
                  Email Address
                </Typography>
                <Typography
                  component="a"
                  href="mailto:srijithnakka@gmail.com"
                  variant="body2"
                  sx={{
                    color: '#fff',
                    textDecoration: 'none',
                    fontWeight: 600,
                    '&:hover': { color: 'var(--accent-secondary)', textDecoration: 'underline' }
                  }}
                >
                  srijithnakka@gmail.com
                </Typography>
              </Box>
            </Box>

            {/* Phone */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1, borderRadius: '8px', background: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4', display: 'flex' }}>
                <PhoneIcon fontSize="medium" />
              </Box>
              <Box>
                <Typography variant="caption" color="var(--text-muted)" sx={{ display: 'block', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
                  Phone Number
                </Typography>
                <Typography
                  component="a"
                  href="tel:+918328449388"
                  variant="body2"
                  sx={{
                    color: '#fff',
                    textDecoration: 'none',
                    fontWeight: 600,
                    '&:hover': { color: '#06b6d4', textDecoration: 'underline' }
                  }}
                >
                  +91 8328449388
                </Typography>
              </Box>
            </Box>

            {/* Location */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1, borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex' }}>
                <LocationOnIcon fontSize="medium" />
              </Box>
              <Box>
                <Typography variant="caption" color="var(--text-muted)" sx={{ display: 'block', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
                  Location
                </Typography>
                <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600 }}>
                  Hyderabad, Telangana, India
                </Typography>
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'center', mt: 1 }}>
          <Button
            onClick={() => setContactOpen(false)}
            variant="contained"
            sx={{
              textTransform: 'none',
              borderRadius: '8px',
              background: 'linear-gradient(90deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
              boxShadow: '0 4px 15px var(--accent-glow)',
              px: 4,
              fontWeight: 600,
              '&:hover': {
                background: 'linear-gradient(90deg, var(--accent-secondary) 0%, var(--accent-primary) 100%)',
              }
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

// Anchor link component
const LinkAnchor = ({ href, children }) => (
  <Box
    component="a"
    href={href}
    sx={{
      color: 'var(--text-muted)',
      textDecoration: 'none',
      fontSize: '14px',
      fontWeight: 500,
      transition: 'color 0.2s',
      '&:hover': {
        color: '#fff'
      }
    }}
  >
    {children}
  </Box>
);

export default LandingPage;
