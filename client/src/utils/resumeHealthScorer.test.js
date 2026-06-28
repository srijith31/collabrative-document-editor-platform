import { describe, it, expect, vi } from 'vitest';
import { runHealthCheck } from './resumeHealthScorer';

describe('Resume Health Scorer Unit Tests', () => {
  const getBaseData = () => ({
    personalInfo: {
      fullName: 'John Doe',
      email: 'john.doe@example.com',
      phone: '1234567890',
      github: 'https://github.com/johndoe',
      linkedin: 'https://linkedin.com/in/johndoe',
      portfolio: 'https://johndoe.dev'
    },
    summary: 'Results-driven software engineer with over 5 years of experience building secure web applications. Proficient in full-stack development, database schema design, and cloud deployments. Passionate about writing clean code, implementing scalable backend APIs, optimizing server performance, collaborating with cross-functional agile teams, solving complex architectural problems in cloud environments, and continuously learning new technologies to deliver high-quality products.',
    skills: {
      languages: ['JavaScript', 'Python', 'Go']
    },
    experience: [
      {
        id: 'exp1',
        role: 'Senior Software Engineer',
        company: 'Tech Corp',
        startDate: '2022-01',
        endDate: 'Present',
        description: 'Designed and developed high-throughput APIs. Improved API latency by 40% and mentored 4 junior devs.'
      }
    ],
    projects: [
      {
        id: 'proj1',
        projectName: 'E-commerce API',
        technologies: 'Node.js, Express, PostgreSQL',
        description: 'Engineered a RESTful e-commerce backend from scratch. Handled over 1000 orders daily.'
      }
    ],
    certifications: [
      {
        id: 'cert1',
        name: 'AWS Certified Solutions Architect',
        issuer: 'Amazon Web Services',
        date: '2024'
      }
    ],
    achievements: [
      {
        id: 'ach1',
        text: 'Reduced database queries lookup time by 50% using Redis caching layers.'
      }
    ]
  });

  it('should calculate a score of 100/100 for a complete profile', () => {
    const resumeData = getBaseData();
    // For 100 score, we need:
    // Contact: 10
    // Summary >= 50 words: 10
    // Skills >= 3: 15
    // Projects >= 2: 20
    // Experience >= 2: 20
    // Certs >= 1: 10
    // Achievements >= 1: 10
    // Github & Linkedin: 5
    // Add extra items to hit requirements:
    resumeData.projects.push({
      id: 'proj2',
      projectName: 'Chat System',
      technologies: 'Socket.io, React',
      description: 'Built a real-time messaging application with 500 active users.'
    });
    resumeData.experience.push({
      id: 'exp2',
      role: 'Software Engineer',
      company: 'App Studio',
      startDate: '2020-01',
      endDate: '2022-01',
      description: 'Developed mobile applications and maintained databases.'
    });

    const report = runHealthCheck(resumeData);
    expect(report.score).toBe(100);
    expect(report.scoreLabel).toBe('Excellent');
    expect(report.scoreColor).toBe('#10b981'); // Green
    expect(report.errors.length).toBe(0);
    expect(report.readiness.percent).toBe(100);
  });

  it('should deduct score and add critical errors when sections are missing', () => {
    const emptyData = {
      personalInfo: {},
      summary: '',
      skills: {},
      experience: [],
      projects: [],
      certifications: [],
      achievements: []
    };

    const report = runHealthCheck(emptyData);

    expect(report.score).toBe(0);
    expect(report.scoreLabel).toBe('Poor');
    expect(report.scoreColor).toBe('#ef4444'); // Red

    const errorLabels = report.errors.map(e => e.label);
    expect(errorLabels).toContain('Professional Summary Missing');
    expect(errorLabels).toContain('Technical Skills Missing');
    expect(errorLabels).toContain('Projects Missing');
    expect(errorLabels).toContain('Experience Missing');
    expect(errorLabels).toContain('Contact Information Incomplete');
  });

  it('should trigger warnings for short summary, invalid URLs, and page height limits', () => {
    const resumeData = getBaseData();
    
    // Short summary (< 50 words)
    resumeData.summary = 'Short summary here.';
    // Invalid Github and Portfolio URLs
    resumeData.personalInfo.github = 'not_a_valid_url';
    resumeData.personalInfo.portfolio = 'http://bad-link'; // valid pattern but let's test a really malformed one
    resumeData.personalInfo.linkedin = 'http://invalid-linkedin-link^'; // malformed link

    // Exceeds 2 page items limit check (> 7 total items)
    // base has: 1 exp, 1 proj, 1 cert, 1 ach = 4 items
    // Let's add 4 more items (total 8) to exceed 7
    resumeData.experience.push({ id: 'exp2', role: 'Dev', company: 'X' });
    resumeData.experience.push({ id: 'exp3', role: 'Dev', company: 'Y' });
    resumeData.projects.push({ id: 'proj2', projectName: 'P2' });
    resumeData.projects.push({ id: 'proj3', projectName: 'P3' });

    const report = runHealthCheck(resumeData);

    const warningsList = report.warnings.map(w => w.label);
    expect(warningsList.some(w => w.includes('Professional Summary Too Short'))).toBe(true);
    expect(warningsList).toContain('GitHub Link has invalid format');
    expect(warningsList).toContain('LinkedIn Link has invalid format');
    expect(warningsList).toContain('Resume Exceeds 2 Pages (reduce bullet counts or section items)');
  });

  it('should detect when no quantifiable metrics are present', () => {
    const resumeData = getBaseData();
    // Remove numbers from achievements and experience
    resumeData.achievements[0].text = 'Reduced database queries lookup time using Redis caching layers.';
    resumeData.experience[0].description = 'Designed and developed high-throughput APIs. Improved API latency and mentored junior devs.';

    const report = runHealthCheck(resumeData);
    const warningsList = report.warnings.map(w => w.label);
    expect(warningsList).toContain('No Quantifiable Achievements Found (include metrics like % or numbers)');
  });

  it('should detect a generic/weak project description', () => {
    const resumeData = getBaseData();
    resumeData.projects[0].description = 'Created a website.';

    const report = runHealthCheck(resumeData);
    const warningsList = report.warnings.map(w => w.label);
    expect(warningsList).toContain('Project Description Too Generic ("E-commerce API")');
  });

  it('should calculate recruiter readiness checklists and percentages properly', () => {
    const resumeData = getBaseData();
    // Missing achievements & certs
    resumeData.certifications = [];
    resumeData.achievements = [];

    const report = runHealthCheck(resumeData);
    expect(report.readiness.percent).toBe(60); // 3 out of 5 items passed (Contact, Skills, Projects)
    
    const contactItem = report.readiness.items.find(i => i.label === 'Contact Information');
    expect(contactItem.passed).toBe(true);

    const certItem = report.readiness.items.find(i => i.label === 'Certifications');
    expect(certItem.passed).toBe(false);
  });

  it('should wire action callbacks correctly', () => {
    const resumeData = {
      personalInfo: {},
      summary: '',
      skills: {},
      experience: [],
      projects: [],
      certifications: [],
      achievements: []
    };

    const handleAISummaryGenerate = vi.fn();
    const handleGenerateAchievements = vi.fn();
    const handleAddMockCertifications = vi.fn();

    const report = runHealthCheck(resumeData, {
      handleAISummaryGenerate,
      handleGenerateAchievements,
      handleAddMockCertifications
    });

    // Invoke Fix Summary Action
    const summaryError = report.errors.find(e => e.label === 'Professional Summary Missing');
    expect(summaryError.action).toBeDefined();
    summaryError.action();
    expect(handleAISummaryGenerate).toHaveBeenCalledTimes(1);

    // Invoke Add Mock Cert Action
    const certWarning = report.warnings.find(w => w.label === 'No Certifications Found');
    expect(certWarning.action).toBeDefined();
    certWarning.action();
    expect(handleAddMockCertifications).toHaveBeenCalledTimes(1);

    // Invoke Generate Achievements Action
    const achWarning = report.warnings.find(w => w.label === 'No Achievements Found');
    expect(achWarning.action).toBeDefined();
    achWarning.action();
    expect(handleGenerateAchievements).toHaveBeenCalledTimes(1);
  });
});
