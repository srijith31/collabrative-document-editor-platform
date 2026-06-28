export const runHealthCheck = (resumeData = {}, actions = {}) => {
  const {
    personalInfo = {},
    summary = '',
    education = [],
    skills = {},
    experience = [],
    projects = [],
    certifications = [],
    achievements = []
  } = resumeData;

  const {
    handleAISummaryGenerate = () => {},
    handleGenerateAchievements = () => {},
    handleAIProjectGenerate = () => {},
    handleAddMockCertifications = () => {}
  } = actions;

  const errors = [];
  const warnings = [];
  const suggestions = [];

  // --- 1. CRITICAL ERRORS ---
  if (!summary) {
    errors.push({
      label: 'Professional Summary Missing',
      actionLabel: 'Fix with AI',
      action: () => handleAISummaryGenerate()
    });
  }
  const skillsCount = Object.values(skills || {}).flat().filter(Boolean).length;
  if (skillsCount === 0) {
    errors.push({
      label: 'Technical Skills Missing'
    });
  }
  if (!projects || projects.length === 0) {
    errors.push({
      label: 'Projects Missing'
    });
  }
  if (!experience || experience.length === 0) {
    errors.push({
      label: 'Experience Missing'
    });
  }
  if (!personalInfo?.fullName || !personalInfo?.email || !personalInfo?.phone) {
    errors.push({
      label: 'Contact Information Incomplete'
    });
  }

  // --- 2. IMPORTANT WARNINGS ---
  if (!certifications || certifications.length === 0) {
    warnings.push({
      label: 'No Certifications Found',
      actionLabel: 'Add Mock Cert',
      action: () => handleAddMockCertifications()
    });
  }
  if (!achievements || achievements.length === 0) {
    warnings.push({
      label: 'No Achievements Found',
      actionLabel: 'Generate Achievements',
      action: () => handleGenerateAchievements()
    });
  }
  if (!personalInfo?.github) {
    warnings.push({
      label: 'GitHub Profile Missing'
    });
  }
  if (!personalInfo?.linkedin) {
    warnings.push({
      label: 'LinkedIn Profile Missing'
    });
  }
  if (!personalInfo?.portfolio) {
    warnings.push({
      label: 'Portfolio Website Missing'
    });
  }
  const summaryWords = summary ? summary.split(/\s+/).filter(Boolean).length : 0;
  if (summary && summaryWords < 50) {
    warnings.push({
      label: `Professional Summary Too Short (${summaryWords} words)`,
      actionLabel: 'Fix with AI',
      action: () => handleAISummaryGenerate()
    });
  }
  if (skillsCount > 0 && skillsCount < 3) {
    warnings.push({
      label: 'Less Than 3 Skills Listed'
    });
  }

  // Number matching checks for quantifiable metrics
  const achievementsText = (achievements || []).map(a => a.text).join(' ');
  const expDescriptionsText = (experience || []).map(e => e.description).join(' ');
  const hasQuantifiableMetrics = /\b\d+%?\b/.test(achievementsText + ' ' + expDescriptionsText);
  if (!hasQuantifiableMetrics && (achievements.length > 0 || experience.length > 0)) {
    warnings.push({
      label: 'No Quantifiable Achievements Found (include metrics like % or numbers)'
    });
  }

  // Weak project descriptions warning
  (projects || []).forEach(proj => {
    const projDesc = proj.description || '';
    const words = projDesc.split(/\s+/).filter(Boolean).length;
    if (projDesc.trim().toLowerCase() === 'created a website.') {
      warnings.push({
        label: `Project Description Too Generic ("${proj.projectName || 'Project'}")`,
        actionLabel: 'Enhance Description',
        action: () => handleAIProjectGenerate(proj.id || proj._id, proj.projectName, proj.technologies)
      });
    } else {
      const isWeak = words > 0 && (words < 12 || /website|app|created|built/i.test(projDesc) && !/\d+/.test(projDesc));
      if (isWeak) {
        warnings.push({
          label: `Weak Project Description ("${proj.projectName || 'Project'}")`,
          actionLabel: 'Enhance Description',
          action: () => handleAIProjectGenerate(proj.id || proj._id, proj.projectName, proj.technologies)
        });
      }
    }
  });

  // Exceeds 2 Pages Warning
  const totalItemsCount = (experience?.length || 0) + (projects?.length || 0) + (certifications?.length || 0) + (achievements?.length || 0);
  if (totalItemsCount > 7) {
    warnings.push({
      label: 'Resume Exceeds 2 Pages (reduce bullet counts or section items)'
    });
  }

  // Link URL checks
  const isUrlInvalid = (url) => {
    if (!url) return false;
    return !/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(url);
  };
  if (personalInfo.github && isUrlInvalid(personalInfo.github)) {
    warnings.push({ label: 'GitHub Link has invalid format' });
  }
  if (personalInfo.linkedin && isUrlInvalid(personalInfo.linkedin)) {
    warnings.push({ label: 'LinkedIn Link has invalid format' });
  }
  if (personalInfo.portfolio && isUrlInvalid(personalInfo.portfolio)) {
    warnings.push({ label: 'Portfolio Link has invalid format' });
  }

  // --- 3. SUGGESTIONS ---
  if (!certifications || certifications.length === 0) {
    suggestions.push({ label: 'Add Relevant Certifications to validate your skill set.' });
  }
  
  const hasInternship = (experience || []).some(e => /intern/i.test(e.role || ''));
  if (!hasInternship && experience.length > 0) {
    suggestions.push({ label: 'Add Internship Experience under Work Experience to highlight developer training.' });
  }

  const hasOpenSource = (experience || []).some(e => /open source|open-source|github/i.test(e.description || '')) || 
                         (projects || []).some(p => /open source|open-source|github/i.test(p.projectName || '') || /open source|open-source|github/i.test(p.description || ''));
  if (!hasOpenSource) {
    suggestions.push({ label: 'Add Open Source Contributions references to highlight team projects.' });
  }

  const hasLeadership = (experience || []).some(e => /lead|mentor|manage|led|mentored|managed/i.test((e.role || '') + ' ' + (e.description || '')));
  if (!hasLeadership) {
    suggestions.push({ label: 'Add Leadership Experience (e.g. lead developer, captain, mentor) to showcase soft skills.' });
  }

  const projMetricsCount = (projects || []).some(p => /\d+/.test(p.description || ''));
  if (!projMetricsCount && projects.length > 0) {
    suggestions.push({ label: 'Include Project Metrics (e.g., performance improvements, active users).' });
  }

  const hasCodingProfiles = /leetcode|hackerrank|salesforce|codeforces/i.test(personalInfo.portfolio || '');
  if (!hasCodingProfiles) {
    suggestions.push({ label: 'Add Coding Profiles (LeetCode, HackerRank, Salesforce) to highlight problem solving.' });
  }

  // --- 4. SCORE CALCULATIONS ---
  let score = 0;
  
  // Contact details: 10 pts
  if (personalInfo.fullName && personalInfo.email && personalInfo.phone) {
    score += 10;
  } else if (personalInfo.fullName && (personalInfo.email || personalInfo.phone)) {
    score += 5;
  }

  // Summary: 10 pts
  if (summary && summaryWords >= 50) {
    score += 10;
  } else if (summary) {
    score += 5;
  }

  // Skills: 15 pts
  if (skillsCount >= 3) {
    score += 15;
  } else if (skillsCount > 0) {
    score += 7;
  }

  // Projects: 20 pts
  if (projects.length >= 2) {
    score += 20;
  } else if (projects.length === 1) {
    score += 10;
  }

  // Experience: 20 pts
  if (experience.length >= 2) {
    score += 20;
  } else if (experience.length === 1) {
    score += 10;
  }

  // Certifications: 10 pts
  if (certifications.length >= 1) {
    score += 10;
  }

  // Achievements: 10 pts
  if (achievements.length >= 1) {
    score += 10;
  }

  // GitHub / LinkedIn: 5 pts
  if (personalInfo.github) score += 2.5;
  if (personalInfo.linkedin) score += 2.5;

  // Color and Label
  let scoreColor = '#ef4444';
  let scoreLabel = 'Poor';
  if (score >= 90) {
    scoreColor = '#10b981';
    scoreLabel = 'Excellent';
  } else if (score >= 75) {
    scoreColor = '#3b82f6';
    scoreLabel = 'Good';
  } else if (score >= 60) {
    scoreColor = '#f59e0b';
    scoreLabel = 'Needs Improvement';
  }

  // Readiness items
  const readinessItems = [
    { label: 'Contact Information', passed: !!(personalInfo.fullName && personalInfo.email && personalInfo.phone) },
    { label: 'Technical Skills Tags (>= 3)', passed: skillsCount >= 3 },
    { label: 'Projects (>= 1)', passed: projects.length >= 1 },
    { label: 'Certifications', passed: certifications.length >= 1 },
    { label: 'Achievements', passed: achievements.length >= 1 }
  ];
  const passedCount = readinessItems.filter(i => i.passed).length;
  const readinessPercent = passedCount * 20;

  return {
    score,
    scoreColor,
    scoreLabel,
    errors,
    warnings,
    suggestions,
    readiness: {
      percent: readinessPercent,
      items: readinessItems
    }
  };
};
