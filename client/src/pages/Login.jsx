import React, { useState } from 'react';
import { Box, Card, TextField, Button, Typography, Link, Alert, CircularProgress, Container, Tabs, Tab } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import logoTransparent from '../assets/logo_transparent.png';

export const Login = () => {
  const { login, loginWithOTP } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loginMode, setLoginMode] = useState('password'); // 'password' or 'otp'
  const [otpRequested, setOtpRequested] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  const handleRequestOTP = async () => {
    if (!email) {
      setError('Please enter your email address first');
      return;
    }
    setError(null);
    setOtpLoading(true);
    try {
      await authService.requestOTP(email);
      setOtpRequested(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to request OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (loginMode === 'password') {
      if (!email || !password) {
        setError('Please fill in all fields');
        return;
      }
      setSubmitting(true);
      try {
        await login(email, password);
        navigate('/dashboard');
      } catch (err) {
        setError(err.response?.data?.message || 'Login failed. Please try again.');
      } finally {
        setSubmitting(false);
      }
    } else {
      if (!email || !otp) {
        setError('Please enter both email and OTP');
        return;
      }
      setSubmitting(true);
      try {
        await loginWithOTP(email, otp);
        navigate('/dashboard');
      } catch (err) {
        setError(err.response?.data?.message || 'OTP verification failed. Please try again.');
      } finally {
        setSubmitting(false);
      }
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
                Welcome Back
              </Typography>
              <Typography variant="body2" sx={{ color: 'var(--text-muted)' }}>
                Sign in to collaborate on documents in real-time
              </Typography>
            </Box>
          </Box>

          <Tabs
            value={loginMode}
            onChange={(_, val) => { setLoginMode(val); setError(null); }}
            centered
            sx={{
              mb: 3,
              '& .MuiTabs-indicator': { backgroundColor: 'var(--accent-secondary)' },
              '& .MuiTab-root': {
                color: 'var(--text-muted)',
                textTransform: 'none',
                fontWeight: 600,
                '&.Mui-selected': { color: '#fff' }
              }
            }}
          >
            <Tab label="Password" value="password" />
            <Tab label="OTP Login" value="otp" />
          </Tabs>

          {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <TextField
              label="Email Address"
              variant="outlined"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loginMode === 'otp' && otpRequested}
              sx={{
                mb: 2.5,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                }
              }}
            />
            {loginMode === 'password' ? (
              <TextField
                label="Password"
                type="password"
                variant="outlined"
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{
                  mb: 3.5,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '10px',
                  }
                }}
              />
            ) : (
              otpRequested && (
                <TextField
                  label="OTP (6-digit code)"
                  variant="outlined"
                  fullWidth
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  sx={{
                    mb: 3.5,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '10px',
                    }
                  }}
                />
              )
            )}

            {loginMode === 'otp' && !otpRequested ? (
              <Button
                type="button"
                onClick={handleRequestOTP}
                variant="contained"
                fullWidth
                disabled={otpLoading}
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
                {otpLoading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Send OTP'}
              </Button>
            ) : (
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
                {submitting ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : (loginMode === 'password' ? 'Sign In' : 'Verify & Login')}
              </Button>
            )}
          </form>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: 'var(--text-muted)' }}>
              Don't have an account?{' '}
              <Link
                onClick={() => navigate('/register')}
                sx={{
                  color: 'var(--accent-secondary)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' }
                }}
              >
                Sign Up
              </Link>
            </Typography>
          </Box>
        </Card>
      </Container>
    </Box>
  );
};
export default Login;
