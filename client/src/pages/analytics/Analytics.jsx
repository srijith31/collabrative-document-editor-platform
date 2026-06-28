import React, { useEffect, useState } from 'react';
import { Box, Container, Typography, Button, Card, CardContent, CircularProgress, Grid, IconButton, Tooltip, Avatar, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DescriptionIcon from '@mui/icons-material/Description';
import GroupIcon from '@mui/icons-material/Group';
import CommentIcon from '@mui/icons-material/Comment';
import AssistantIcon from '@mui/icons-material/Assistant';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { analyticsService } from '../../services/analyticsService';
import { NotificationBell } from '../../components/NotificationBell';
import { StatCard } from '../../components/analytics/StatCard';
import { DocumentsChart } from '../../components/analytics/DocumentsChart';
import { ActivityFeed } from '../../components/analytics/ActivityFeed';
import { ContributorsTable } from '../../components/analytics/ContributorsTable';

export const Analytics = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [documentStats, setDocumentStats] = useState([]);
  const [productivity, setProductivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalyticsData = async () => {
    try {
      const [statsRes, activitiesRes, monthlyRes, docStatsRes, productivityRes] = await Promise.all([
        analyticsService.getStats(),
        analyticsService.getRecentActivity(),
        analyticsService.getMonthlyCreation(),
        analyticsService.getDocumentStats(),
        analyticsService.getProductivity()
      ]);

      setStats(statsRes);
      setActivities(activitiesRes);
      setMonthlyData(monthlyRes);
      setDocumentStats(docStatsRes);
      setProductivity(productivityRes);
    } catch (error) {
      console.error('Failed to load analytics dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalyticsData();
  };

  const getUserInitials = (username) => {
    return username ? username.slice(0, 2).toUpperCase() : 'U';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0b0b0e' }}>
        <CircularProgress color="secondary" />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', background: '#0b0b0e', pb: 8 }}>
      {/* Header Bar */}
      <Box sx={{ borderBottom: '1px solid var(--border-color)', py: 2, background: 'var(--bg-secondary)' }}>
        <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/dashboard')}
              sx={{
                textTransform: 'none',
                color: 'var(--text-muted)',
                '&:hover': { color: '#f1f5f9' }
              }}
            >
              Dashboard
            </Button>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#f1f5f9', borderLeft: '1px solid var(--border-color)', pl: 2 }}>
              Analytics
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Tooltip title="Refresh Analytics Data">
              <IconButton onClick={handleRefresh} disabled={refreshing} sx={{ color: 'var(--text-muted)' }}>
                <RefreshIcon className={refreshing ? 'spin-anim' : ''} />
              </IconButton>
            </Tooltip>
            <NotificationBell />
            <Avatar
              sx={{
                bgcolor: user?.avatarColor || 'var(--accent-primary)',
                width: 36,
                height: 36,
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              {user ? getUserInitials(user.username) : 'U'}
            </Avatar>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mt: 5 }}>
        {/* Style block for animations */}
        <style>{`
          .spin-anim {
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>

        {/* Dashboard Title */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#f1f5f9', mb: 1 }}>
              Workspace Insights
            </Typography>
            <Typography variant="body2" color="var(--text-muted)">
              Overview of real-time metrics, documents progression, and user actions.
            </Typography>
          </Box>
        </Box>

        {/* Cards Row */}
        <Grid container spacing={3} sx={{ mb: 5 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Documents"
              value={stats?.totalDocuments ?? 0}
              icon={<DescriptionIcon />}
              color="#6366f1"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Active Collaborators"
              value={stats?.activeUsers ?? 0}
              icon={<GroupIcon />}
              color="#8a2be2"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Comments"
              value={stats?.totalComments ?? 0}
              icon={<CommentIcon />}
              color="#ff9800"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Suggestions"
              value={stats?.totalSuggestions ?? 0}
              icon={<AssistantIcon />}
              color="#e91e63"
            />
          </Grid>
        </Grid>

        {/* Main Grid Content */}
        <Grid container spacing={4}>
          {/* Left Side: Chart and Document Table */}
          <Grid item xs={12} lg={8} sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* Document Creation Chart */}
            <Card className="glass-panel" sx={{ background: 'rgba(18, 18, 23, 0.4)' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 3, color: '#f1f5f9' }}>
                  Documents Created Per Month
                </Typography>
                <DocumentsChart data={monthlyData} />
              </CardContent>
            </Card>

            {/* Collaboration Insights Table */}
            <Card className="glass-panel" sx={{ background: 'rgba(18, 18, 23, 0.4)' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 3, color: '#f1f5f9' }}>
                  Collaboration Insights (Per Document)
                </Typography>
                
                {documentStats.length === 0 ? (
                  <Box sx={{ py: 6, textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Typography variant="body2">No documents available.</Typography>
                  </Box>
                ) : (
                  <TableContainer sx={{ maxHeight: 350 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontWeight: 600 }}>Document Name</TableCell>
                          <TableCell align="center" sx={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontWeight: 600 }}>Editors</TableCell>
                          <TableCell align="center" sx={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontWeight: 600 }}>Comments</TableCell>
                          <TableCell align="center" sx={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontWeight: 600 }}>Suggestions</TableCell>
                          <TableCell align="center" sx={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontWeight: 600 }}>Versions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {documentStats.map((doc) => (
                          <TableRow
                            key={doc._id}
                            sx={{
                              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.02)' },
                              '& td': { borderBottom: '1px solid var(--border-color)' }
                            }}
                          >
                            <TableCell sx={{ color: '#f1f5f9', fontWeight: 500 }}>{doc.title}</TableCell>
                            <TableCell align="center" sx={{ color: 'var(--text-muted)' }}>{doc.editors}</TableCell>
                            <TableCell align="center" sx={{ color: 'var(--text-muted)' }}>{doc.comments}</TableCell>
                            <TableCell align="center" sx={{ color: 'var(--text-muted)' }}>{doc.suggestions}</TableCell>
                            <TableCell align="center" sx={{ color: 'var(--text-muted)' }}>{doc.versions}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Right Side: Productivity and Activity Feed */}
          <Grid item xs={12} lg={4} sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* Top Contributors Leaderboard */}
            <Card className="glass-panel" sx={{ background: 'rgba(18, 18, 23, 0.4)' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#f1f5f9' }}>
                  Top Contributors
                </Typography>
                <ContributorsTable contributors={productivity} />
              </CardContent>
            </Card>

            {/* Recent Activity Feed */}
            <Card className="glass-panel" sx={{ background: 'rgba(18, 18, 23, 0.4)' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#f1f5f9' }}>
                  Recent Activity
                </Typography>
                <ActivityFeed activities={activities} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Analytics;
