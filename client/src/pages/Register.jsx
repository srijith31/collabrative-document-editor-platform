import React, { useState } from 'react';
import { Box, Card, TextField, Button, Typography, Link, Alert, CircularProgress, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logoTransparent from '../assets/logo_transparent.png';

export const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await register(username, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f0c20 0%, #060608 100%)',
        position: 'relative',
        overflow: 'hidden',
        px: 2,
        '&::before': {
          content: '""',
          position: 'absolute',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(138,43,226,0.35) 0%, rgba(99,102,241,0) 70%)',
          top: '10%',
          left: '10%',
          filter: 'blur(40px)',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, rgba(138,43,226,0) 70%)',
          bottom: '10%',
          right: '10%',
          filter: 'blur(50px)',
        }
      }}
    >
      <Container maxWidth="xs" sx={{ zIndex: 1 }}>
        <Card
          className="glass-panel"
          sx={{
            p: 4,
            background: 'rgba(18, 18, 23, 0.65)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.47)',
          }}
        >
          <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Box
              component="img"
              src={logoTransparent}
              alt="CollabDoc Logo"
              sx={{
                height: 70,
                width: 'auto',
                objectFit: 'contain',
                cursor: 'pointer'
              }}
              onClick={() => navigate('/')}
            />
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5" sx={{ mb: 0.5, letterSpacing: '-0.5px', fontWeight: 700 }}>
                Create Account
              </Typography>
              <Typography variant="body2" sx={{ color: 'var(--text-muted)' }}>
                Join to collaborate on documents in real-time
              </Typography>
            </Box>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <TextField
              label="Username"
              variant="outlined"
              fullWidth
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                }
              }}
            />
            <TextField
              label="Email Address"
              variant="outlined"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                }
              }}
            />
            <TextField
              label="Password"
              type="password"
              variant="outlined"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                }
              }}
            />
            <TextField
              label="Confirm Password"
              type="password"
              variant="outlined"
              fullWidth
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                }
              }}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={submitting}
              sx={{
                py: 1.5,
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '15px',
                background: 'linear-gradient(90deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                boxShadow: '0 4px 15px var(--accent-glow)',
                textTransform: 'none',
                '&:hover': {
                  background: 'linear-gradient(90deg, var(--accent-secondary) 0%, var(--accent-primary) 100%)',
                }
              }}
            >
              {submitting ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Sign Up'}
            </Button>
          </form>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: 'var(--text-muted)' }}>
              Already have an account?{' '}
              <Link
                onClick={() => navigate('/login')}
                sx={{
                  color: 'var(--accent-secondary)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' }
                }}
              >
                Sign In
              </Link>
            </Typography>
          </Box>
        </Card>
      </Container>
    </Box>
  );
};
export default Register;
