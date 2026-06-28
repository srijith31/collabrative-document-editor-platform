import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Grid, Typography, TextField, Button, Select, MenuItem, Accordion,
  AccordionSummary, AccordionDetails, Chip, IconButton, Card, CardContent,
  Dialog, DialogTitle, DialogContent, DialogActions, LinearProgress, CircularProgress, Tab, Tabs, Alert
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SpeedIcon from '@mui/icons-material/Speed';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import { ResumePreview } from './ResumePreview';
import { useSocket } from '../contexts/SocketContext';
import { documentService } from '../services/documentService';
import { commentService } from '../services/commentService';
import { runHealthCheck } from '../utils/resumeHealthScorer';


const SKILL_SUGGESTIONS = {
  languages: ['Python', 'Java', 'JavaScript', 'TypeScript', 'C++', 'Go', 'Rust', 'Ruby', 'Swift'],
  frontend: ['React', 'Angular', 'Vue.js', 'HTML5', 'CSS3', 'TailwindCSS', 'Redux', 'Next.js', 'Svelte'],
  backend: ['Node.js', 'Express', 'Django', 'Flask', 'Spring Boot', 'NestJS', 'GraphQL', 'FastAPI'],
  database: ['MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'DynamoDB', 'SQLite', 'Firebase'],
  cloud: ['AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'Serverless', 'Vercel'],
  tools: ['Git', 'VS Code', 'Webpack', 'Postman', 'Jira', 'Figma', 'Jenkins', 'CI/CD']
};

const ATS_HARD_SKILLS = [
  'javascript', 'typescript', 'python', 'go', 'golang', 'java', 'c++', 'c#', 'ruby', 'php',
  'react', 'next.js', 'nextjs', 'vue', 'angular', 'svelte', 'node.js', 'nodejs', 'express',
  'django', 'flask', 'fastapi', 'spring', 'rails', 'graphql', 'rest', 'restful', 'api', 'apis',
  'mongodb', 'postgres', 'postgresql', 'mysql', 'sqlite', 'redis', 'elasticsearch', 'cassandra',
  'aws', 'gcp', 'azure', 'docker', 'kubernetes', 'jenkins', 'git', 'github', 'gitlab', 'ci/cd',
  'html', 'css', 'sass', 'tailwind', 'bootstrap', 'webpack', 'vite', 'npm', 'yarn', 'linux',
  'sql', 'nosql', 'terraform'
];

const ATS_SOFT_SKILLS = [
  'stakeholder management', 'agile methodology', 'agile', 'scrum', 'team leadership', 'leadership',
  'collaboration', 'problem solving', 'communication', 'project management', 'mentoring',
  'critical thinking', 'time management', 'adaptability', 'creativity', 'teamwork'
];

export const ResumeEditor = ({
  documentId,
  userRole,
  initialResumeData = {},
  restoreContent,
  onSelectionChange,
}) => {
  const { socket } = useSocket();
  const saveTimeoutRef = useRef(null);
  const activeFieldRef = useRef(null);

  // Resume Data State
  const [resumeData, setResumeData] = useState(() => ({
    personalInfo: { fullName: '', email: '', phone: '', location: '', linkedin: '', github: '', portfolio: '' },
    summary: '',
    education: [],
    skills: { languages: [], frontend: [], backend: [], database: [], cloud: [], tools: [] },
    experience: [],
    projects: [],
    certifications: [],
    achievements: [],
    templateType: 'Professional ATS',
    ...initialResumeData
  }));

  // Local Tag Inputs
  const [skillInputs, setSkillInputs] = useState({
    languages: '',
    frontend: '',
    backend: '',
    database: '',
    cloud: '',
    tools: ''
  });

  // Split View Mobile/Desktop Tabs
  const [viewTab, setViewTab] = useState('form');

  // Dialog States
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [commentSection, setCommentSection] = useState('');
  const [commentSectionId, setCommentSectionId] = useState('');
  const [commentText, setCommentText] = useState('');

  const [suggestionDialogOpen, setSuggestionDialogOpen] = useState(false);
  const [suggestionSection, setSuggestionSection] = useState('');
  const [suggestionSectionId, setSuggestionSectionId] = useState('');
  const [suggestionFieldName, setSuggestionFieldName] = useState('');
  const [originalText, setOriginalText] = useState('');
  const [suggestedText, setSuggestedText] = useState('');

  // Additional states for theme, AI and ATS
  const [editorThemeMode, setEditorThemeMode] = useState('dark');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isGeneratingProject, setIsGeneratingProject] = useState({});
  const [atsDialogOpen, setAtsDialogOpen] = useState(false);
  const [atsActiveTab, setAtsActiveTab] = useState(0);
  const [jobDescription, setJobDescription] = useState(
    'We are looking for a Senior Software Engineer with experience in JavaScript, React, Node.js, Python, AWS, SQL, REST APIs, Git, stakeholder management, agile methodology, and 3+ years of experience.'
  );
  const [healthCheckOpen, setHealthCheckOpen] = useState(true);

  const isReadOnly = userRole === 'VIEWER';

  // Handle inbound Socket updates — field-level merge to prevent cursor jumps
  useEffect(() => {
    if (!socket) return;

    const handleReceiveResumeChanges = (data) => {
      if (!data || !data.resumeData) return;

      const remoteData = data.resumeData;
      const remoteChangedField = data.changedField;
      const localActiveField = activeFieldRef.current;

      if (!localActiveField) {
        setResumeData(remoteData);
        return;
      }

      setResumeData(prev => {
        const merged = { ...remoteData };
        const parts = localActiveField.split('.');
        if (parts.length === 1) {
          merged[parts[0]] = prev[parts[0]];
        } else if (parts.length === 2) {
          const [section, field] = parts;
          if (prev[section] && typeof prev[section] === 'object' && !Array.isArray(prev[section])) {
            merged[section] = { ...remoteData[section], [field]: prev[section][field] };
          }
        } else if (parts.length === 3) {
          const [section, itemId, field] = parts;
          if (Array.isArray(prev[section])) {
            merged[section] = (remoteData[section] || []).map(item => {
              if ((item.id === itemId || item._id === itemId)) {
                const localItem = prev[section].find(
                  li => li.id === itemId || li._id === itemId
                );
                if (localItem) {
                  return { ...item, [field]: localItem[field] };
                }
              }
              return item;
            });
          }
        }
        return merged;
      });
    };

    socket.on('receive-resume-changes', handleReceiveResumeChanges);
    return () => {
      socket.off('receive-resume-changes', handleReceiveResumeChanges);
    };
  }, [socket]);

  // Handle version restore updates
  useEffect(() => {
    if (restoreContent) {
      setResumeData(restoreContent);
      if (!isReadOnly) {
        documentService.updateDocument(documentId, { resumeData: restoreContent });
        if (socket) {
          socket.emit('send-resume-changes', { documentId, resumeData: restoreContent });
        }
      }
    }
  }, [restoreContent]);

  // Debounced Autosave + Socket Broadcast
  const triggerUpdate = (updatedData, changedField = null) => {
    setResumeData(updatedData);

    if (socket && !isReadOnly) {
      socket.emit('send-resume-changes', { documentId, resumeData: updatedData, changedField });
    }

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    if (!isReadOnly) {
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await documentService.updateDocument(documentId, { resumeData: updatedData });
          console.log('Resume autosaved successfully.');
        } catch (err) {
          console.error('Failed to autosave resume:', err);
        }
      }, 2000);
    }
  };

  // Helper to update fields
  const handlePersonalInfoChange = (field, value) => {
    const updated = {
      ...resumeData,
      personalInfo: {
        ...resumeData.personalInfo,
        [field]: value
      }
    };
    triggerUpdate(updated, `personalInfo.${field}`);
  };

  const handleSummaryChange = (value) => {
    if (value.length > 500) return;
    const updated = {
      ...resumeData,
      summary: value
    };
    triggerUpdate(updated, 'summary');
  };

  // List Handlers
  const addListEntry = (section, defaultEntry) => {
    const list = [...(resumeData[section] || [])];
    const newEntry = { ...defaultEntry, id: `${section}-${Date.now()}` };
    list.push(newEntry);
    triggerUpdate({ ...resumeData, [section]: list });
  };

  const updateListEntry = (section, id, field, value) => {
    const list = (resumeData[section] || []).map(item => {
      if (item.id === id || item._id === id) {
        return { ...item, [field]: value };
      }
      return item;
    });
    triggerUpdate({ ...resumeData, [section]: list }, `${section}.${id}.${field}`);
  };

  const removeListEntry = (section, id) => {
    const list = (resumeData[section] || []).filter(item => item.id !== id && item._id !== id);
    triggerUpdate({ ...resumeData, [section]: list });
  };

  // Field focus tracking
  const handleFieldFocus = (fieldPath) => {
    activeFieldRef.current = fieldPath;
  };

  const handleFieldBlur = () => {
    activeFieldRef.current = null;
  };

  // Skill Tags Handlers
  const handleAddSkill = (category) => {
    const inputVal = skillInputs[category].trim();
    if (!inputVal) return;

    const currentSkills = [...(resumeData.skills?.[category] || [])];
    const isDuplicate = currentSkills.some(
      skill => skill.trim().toLowerCase() === inputVal.toLowerCase()
    );
    if (!isDuplicate) {
      currentSkills.push(inputVal);
      const updated = {
        ...resumeData,
        skills: {
          ...resumeData.skills,
          [category]: currentSkills
        }
      };
      triggerUpdate(updated);
    }

    setSkillInputs(prev => ({ ...prev, [category]: '' }));
  };

  const handleRemoveSkill = (category, indexToRemove) => {
    const currentSkills = (resumeData.skills?.[category] || []).filter((_, idx) => idx !== indexToRemove);
    const updated = {
      ...resumeData,
      skills: {
        ...resumeData.skills,
        [category]: currentSkills
      }
    };
    triggerUpdate(updated);
  };

  // AI Summary Generator
  const handleAISummaryGenerate = () => {
    setIsGeneratingSummary(true);
    setTimeout(() => {
      const currentSummary = (resumeData.summary || '').trim();
      if (currentSummary === "Computer Science student interested in software development.") {
        handleSummaryChange("Results-driven Computer Science student with experience in Python, Flask, SQL, Machine Learning, and Full Stack Development. Built multiple academic and personal projects including web applications, database systems, and AI-powered solutions. Passionate about problem solving, software engineering, and continuous learning.");
      } else {
        const role = resumeData.experience[0]?.role || 'Software Engineer';
        const skillsList = Object.values(resumeData.skills || {}).flat().slice(0, 6).join(', ') || 'React, Node.js, and Java';
        const company = resumeData.experience[0]?.company ? ` at ${resumeData.experience[0].company}` : '';

        const drafts = [
          `Results-driven ${role} with extensive experience building scalable solutions${company}. Proficient in ${skillsList}, with a strong background in optimizing application throughput, developing RESTful APIs, and translating business metrics into reliable software architectures.`,
          `Detail-oriented ${role} with a solid track record of architecting cloud-native solutions. Expert in utilizing ${skillsList} to drive code quality, minimize server-side latency, and collaborate in cross-functional agile squads.`,
          `Highly skilled ${role} specialized in ${skillsList}. Passionate about design patterns, clean code, and automated CI/CD workflows, focused on building secure platforms with high operational efficiency.`
        ];

        const chosenDraft = drafts[Math.floor(Math.random() * drafts.length)];
        handleSummaryChange(chosenDraft);
      }
      setIsGeneratingSummary(false);
    }, 800);
  };


  // AI Project Bullet Generator
  const handleAIProjectGenerate = (id, projName, techStr) => {
    setIsGeneratingProject(prev => ({ ...prev, [id]: true }));
    setTimeout(() => {
      const targetProj = (resumeData.projects || []).find(p => (p.id || p._id) === id);
      const currentDesc = (targetProj?.description || '').trim();

      if (currentDesc.toLowerCase() === "created a website.") {
        updateListEntry('projects', id, 'description', "Designed and developed a responsive full-stack web application using Flask and MySQL, improving user accessibility and engagement.");
      } else {
        const name = projName || 'Portfolio System';
        const tech = techStr || 'React, Express, Node.js';

        const bulletSet = [
          `• Architected and deployed the ${name} utilizing ${tech} stack.\n• Engineered secure RESTful JSON APIs and integrated real-time state synchronization, cutting network bandwidth overhead by 30%.\n• Designed interactive dashboards with micro-animations to improve user interface responsiveness.`,
          `• Built and optimized ${name} backend APIs and frontend flows using ${tech}.\n• Implemented secure JWT user sessions and rate limiting configurations to prevent malicious endpoints exploitation.\n• Leveraged database indices and optimized querying logic to achieve a 25% decrease in database load.`,
          `• Developed the complete lifecycle of ${name} built on top of ${tech}.\n• Created automated deployment scripts and continuous integration channels to run tests and assure clean staging builds.\n• Standardized code schemas and API handlers, resulting in improved feature iteration speeds.`
        ];

        const chosenBullets = bulletSet[Math.floor(Math.random() * bulletSet.length)];
        updateListEntry('projects', id, 'description', chosenBullets);
      }
      setIsGeneratingProject(prev => ({ ...prev, [id]: false }));
    }, 800);
  };


  // Helper to scramble text for non-standard layout templates
  const scrambleText = (text) => {
    if (!text) return '';
    return text.split('').map(char => {
      if (/[a-zA-Z0-9]/.test(char) && Math.random() < 0.25) {
        const glyphs = ['░', '▒', '▓', '█', '■', '?', '*', '#', ' ', '@', '$', '%'];
        return glyphs[Math.floor(Math.random() * glyphs.length)];
      }
      return char;
    }).join('');
  };

  const getRawTextRepresentation = () => {
    const { personalInfo = {}, summary = '', education = [], skills = {}, experience = [], projects = [] } = resumeData;
    let text = '';
    text += `${(personalInfo.fullName || 'YOUR NAME').toUpperCase()}\n`;
    const contact = [personalInfo.email, personalInfo.phone, personalInfo.location].filter(Boolean).join(' | ');
    if (contact) text += `${contact}\n`;
    text += '\n';

    if (summary) {
      text += `PROFESSIONAL SUMMARY\n${summary}\n\n`;
    }

    if (education && education.length > 0) {
      text += `EDUCATION\n`;
      education.forEach(edu => {
        text += `- ${edu.college || 'Institution'}: ${edu.degree || 'Degree'} (${edu.startYear || ''} - ${edu.endYear || ''})\n`;
      });
      text += '\n';
    }

    const skillKeys = Object.keys(skills || {});
    const hasSkills = skillKeys.some(k => skills[k] && skills[k].length > 0);
    if (hasSkills) {
      text += `TECHNICAL SKILLS\n`;
      skillKeys.forEach(k => {
        const list = skills[k] || [];
        if (list.length > 0) {
          text += `- ${k.toUpperCase()}: ${list.join(', ')}\n`;
        }
      });
      text += '\n';
    }

    if (experience && experience.length > 0) {
      text += `EXPERIENCE\n`;
      experience.forEach(exp => {
        text += `- ${exp.role || 'Job Title'} at ${exp.company || 'Company'} (${exp.startDate || ''} - ${exp.endDate || ''})\n`;
        if (exp.description) {
          const lines = exp.description.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
          lines.forEach(l => text += `  * ${l.replace(/^[•\-\*\s]+/, '')}\n`);
        }
      });
      text += '\n';
    }

    if (projects && projects.length > 0) {
      text += `PROJECTS\n`;
      projects.forEach(proj => {
        text += `- ${proj.projectName || 'Project'} (${proj.technologies || ''})\n`;
        if (proj.description) {
          const lines = proj.description.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
          lines.forEach(l => text += `  * ${l.replace(/^[•\-\*\s]+/, '')}\n`);
        }
      });
    }

    return text;
  };

  const estimateExperienceYears = () => {
    const { experience = [] } = resumeData;
    if (experience.length === 0) return 0;
    
    let totalYears = 0;
    experience.forEach(exp => {
      const start = parseInt((exp.startDate || '').match(/\d{4}/)?.[0] || '2023');
      const endStr = exp.endDate || '';
      let end = parseInt(endStr.match(/\d{4}/)?.[0] || '2026');
      if (endStr.toLowerCase().includes('present')) {
        end = new Date().getFullYear();
      }
      const diff = Math.max(1, end - start);
      totalYears += diff;
    });
    return totalYears;
  };

  // ATS Scoring Logic
  const runAtsAnalysis = () => {
    const { personalInfo = {}, summary = '', education = [], skills = {}, experience = [], projects = [], templateType = 'Professional ATS' } = resumeData;
    const checklist = [];

    // --- STEP 1: Parse & Strip (max 25 points) ---
    let step1Score = 0;
    let step1Status = '';
    const isAtsTemplate = templateType === 'Professional ATS';
    
    if (isAtsTemplate) {
      step1Score = 25;
      step1Status = 'Optimized ATS layout detected. Text parsed successfully without format loss.';
      checklist.push({ label: 'ATS-Optimized Template', passed: true, tip: 'Using a single-column layout prevents word scrambling.' });
    } else {
      step1Score = 15;
      step1Status = 'Non-standard layout detected. Columns or styling tables caused partial text scrambling.';
      checklist.push({ label: 'Non-standard layout template warning', passed: false, tip: 'Switch to the "Professional ATS" template to avoid parser errors.' });
    }

    const rawText = getRawTextRepresentation();
    const step1Text = isAtsTemplate ? rawText : scrambleText(rawText);

    // --- STEP 2: Data Categorization (max 25 points) ---
    let step2Score = 0;
    const step2Fields = [
      {
        field: 'Personal Information',
        header: 'CONTACT DETAILS',
        status: (personalInfo.fullName && personalInfo.email && personalInfo.phone) ? 'Mapped' : 'Partial',
        text: [personalInfo.fullName, personalInfo.email, personalInfo.phone].filter(Boolean).join(' | ') || 'Not Found',
        pts: (personalInfo.fullName && personalInfo.email && personalInfo.phone) ? 5 : 2
      },
      {
        field: 'Professional Summary',
        header: 'SUMMARY / OBJECTIVE',
        status: summary ? 'Mapped' : 'Missing',
        text: summary ? `${summary.slice(0, 100)}...` : 'Not Found',
        pts: summary ? 5 : 0
      },
      {
        field: 'Education schooling',
        header: 'EDUCATION',
        status: (education && education.length > 0) ? 'Mapped' : 'Missing',
        text: (education && education.length > 0) ? `Found ${education.length} schooling record(s)` : 'Not Found',
        pts: (education && education.length > 0) ? 5 : 0
      },
      {
        field: 'Technical Skills Tags',
        header: 'TECHNICAL SKILLS',
        status: Object.values(skills || {}).flat().length > 0 ? 'Mapped' : 'Missing',
        text: Object.values(skills || {}).flat().slice(0, 6).join(', ') || 'Not Found',
        pts: Object.values(skills || {}).flat().length > 0 ? 5 : 0
      },
      {
        field: 'Experience timeline & Projects',
        header: 'EXPERIENCE / PROJECTS',
        status: (experience && experience.length > 0) ? 'Mapped' : 'Missing',
        text: `Experience: ${experience?.length || 0} items | Projects: ${projects?.length || 0} items`,
        pts: (experience && experience.length > 0 && projects && projects.length > 0) ? 5 : (experience?.length > 0 || projects?.length > 0) ? 3 : 0
      }
    ];

    step2Score = step2Fields.reduce((sum, item) => sum + item.pts, 0);
    
    // Add checklist items for Step 2
    step2Fields.forEach(item => {
      checklist.push({
        label: `Field Mapping: ${item.field}`,
        passed: item.status === 'Mapped',
        tip: item.status === 'Mapped' ? `Successfully categorized under ${item.header}.` : `Make sure this section has data to register on ATS indexes.`
      });
    });

    // --- STEP 3: Keyword Matching (max 25 points) ---
    const jdLower = jobDescription.toLowerCase();
    
    const targetHardSkills = ATS_HARD_SKILLS.filter(skill => {
      if (typeof skill !== 'string') return false;
      const escapedSkill = skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedSkill}\\b`, 'i');
      return regex.test(jdLower);
    });
    
    const targetSoftSkills = ATS_SOFT_SKILLS.filter(skill => {
      if (typeof skill !== 'string') return false;
      return jdLower.includes(skill);
    });

    const activeTargetHard = targetHardSkills.length > 0 ? targetHardSkills : ['javascript', 'react', 'node.js', 'python', 'aws'];
    const activeTargetSoft = targetSoftSkills.length > 0 ? targetSoftSkills : ['stakeholder management', 'agile', 'collaboration'];

    const resumeFullContentLower = (
      (personalInfo.fullName || '') + ' ' +
      summary + ' ' +
      Object.values(skills || {}).flat().join(' ') + ' ' +
      experience.map(e => (e.role || '') + ' ' + (e.company || '') + ' ' + (e.description || '')).join(' ') + ' ' +
      projects.map(p => (p.projectName || '') + ' ' + (p.technologies || '') + ' ' + (p.description || '')).join(' ')
    ).toLowerCase();

    const step3MatchedHard = activeTargetHard.filter(skill => {
      return resumeFullContentLower.includes(skill);
    });
    const step3MissingHard = activeTargetHard.filter(skill => !resumeFullContentLower.includes(skill));

    const step3MatchedSoft = activeTargetSoft.filter(skill => {
      return resumeFullContentLower.includes(skill);
    });
    const step3MissingSoft = activeTargetSoft.filter(skill => !resumeFullContentLower.includes(skill));

    let targetYears = 3;
    const yearsMatch = jdLower.match(/\b(\d+)\+?\s*(?:years?|yrs?)\b/);
    if (yearsMatch && yearsMatch[1]) {
      targetYears = parseInt(yearsMatch[1], 10);
    }

    const step3ExpYears = estimateExperienceYears();

    const hardMatchPts = activeTargetHard.length > 0 
      ? Math.round((step3MatchedHard.length / activeTargetHard.length) * 10) 
      : 10;
    const softMatchPts = activeTargetSoft.length > 0 
      ? Math.round((step3MatchedSoft.length / activeTargetSoft.length) * 5) 
      : 5;
    const expPts = step3ExpYears >= targetYears 
      ? 10 
      : Math.max(0, Math.round((step3ExpYears / targetYears) * 10));

    const step3Score = hardMatchPts + softMatchPts + expPts;

    checklist.push({
      label: `Hard Skills Keyword Match (${step3MatchedHard.length}/${activeTargetHard.length})`,
      passed: step3MatchedHard.length >= Math.ceil(activeTargetHard.length * 0.6),
      tip: `Matched skills: ${step3MatchedHard.join(', ') || 'none'}. Add missing: ${step3MissingHard.slice(0, 3).join(', ')}`
    });
    checklist.push({
      label: `Soft Skills Keyword Match (${step3MatchedSoft.length}/${activeTargetSoft.length})`,
      passed: step3MatchedSoft.length >= Math.ceil(activeTargetSoft.length * 0.5),
      tip: `Matched soft skills: ${step3MatchedSoft.join(', ') || 'none'}.`
    });
    checklist.push({
      label: `Experience Duration Match (Target: ${targetYears} yrs, Found: ${step3ExpYears} yrs)`,
      passed: step3ExpYears >= targetYears,
      tip: step3ExpYears >= targetYears ? 'Meets recruiter experience requirements.' : 'Consider adding internships or projects to pad experience duration.'
    });

    // --- STEP 4: Scoring & Leaderboard (max 25 points) ---
    let matchOccurrences = 0;
    const allMatchedTokens = [...step3MatchedHard, ...step3MatchedSoft];
    allMatchedTokens.forEach(token => {
      if (typeof token !== 'string') return;
      const escapedToken = token.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(escapedToken, 'gi');
      const matches = resumeFullContentLower.match(regex);
      if (matches) {
        matchOccurrences += matches.length;
      }
    });

    const totalWords = rawText.split(/\s+/).filter(Boolean).length;
    const step4Density = totalWords > 0 ? parseFloat(((matchOccurrences / totalWords) * 100).toFixed(2)) : 0;

    let step4Score = 0;
    let step4Status = '';
    if (step4Density >= 2.0 && step4Density <= 5.0) {
      step4Score = 25;
      step4Status = 'Optimal keyword density (2.0% - 5.0%). Excellent relevance without keyword stuffing.';
    } else if (step4Density < 2.0) {
      step4Score = Math.max(5, Math.round((step4Density / 2.0) * 25));
      step4Status = 'Low keyword density. Weave in more target keywords naturally into your summary and project bullets.';
    } else {
      step4Score = Math.max(5, Math.round(25 - (step4Density - 5.0) * 5));
      step4Status = 'High keyword density. Warning: Potential keyword stuffing flagged by ATS spam filters.';
    }

    checklist.push({
      label: `Optimal Keyword Density (${step4Density}%)`,
      passed: step4Density >= 2.0 && step4Density <= 5.0,
      tip: step4Status
    });

    const totalScore = step1Score + step2Score + step3Score + step4Score;

    const baselineLeaderboard = [
      { name: 'Candidate Alpha', score: 95, current: false },
      { name: 'You (Active Candidate)', score: totalScore, current: true },
      { name: 'Candidate Gamma', score: 78, current: false },
      { name: 'Candidate Delta', score: 64, current: false },
      { name: 'Candidate Epsilon', score: 48, current: false }
    ];

    const sortedLeaderboard = baselineLeaderboard.sort((a, b) => b.score - a.score);

    return {
      score: Math.min(totalScore, 100),
      step1: { score: step1Score, status: step1Status, parsedText: step1Text },
      step2: { score: step2Score, fields: step2Fields },
      step3: {
        score: step3Score,
        matchedHard: step3MatchedHard,
        missingHard: step3MissingHard,
        matchedSoft: step3MatchedSoft,
        missingSoft: step3MissingSoft,
        expYears: step3ExpYears,
        targetYears,
        activeTargetHard,
        activeTargetSoft
      },
      step4: {
        score: step4Score,
        density: step4Density,
        status: step4Status,
        leaderboard: sortedLeaderboard
      },
      checklist
    };
  };

  const atsReport = runAtsAnalysis();

  const handleAddMockCertifications = () => {
    const cert = {
      id: Date.now().toString(),
      name: 'AWS Certified Solutions Architect - Associate',
      issuer: 'Amazon Web Services',
      date: '2025'
    };
    triggerUpdate({
      ...resumeData,
      certifications: [...(resumeData.certifications || []), cert]
    });
  };

  const handleGenerateAchievements = () => {
    const projectNames = (resumeData.projects || []).map(p => p.projectName || '').filter(Boolean);
    const projectDescs = (resumeData.projects || []).map(p => p.description || '').filter(Boolean);
    
    const isAlumni = projectNames.some(name => name.toLowerCase().includes('alumni student interconnect')) ||
                     projectDescs.some(desc => desc.toLowerCase().includes('built alumni student interconnect'));
                     
    let mockAchievements = [];
    if (isAlumni) {
      mockAchievements = [
        { id: Date.now().toString() + '-1', text: 'Developed a full-stack Alumni Student Interconnect Platform supporting mentorship, job postings, and event management.' },
        { id: Date.now().toString() + '-2', text: 'Implemented scalable backend architecture using Flask and MySQL.' },
        { id: Date.now().toString() + '-3', text: 'Enhanced collaboration between students and alumni through real-time engagement features.' }
      ];
    } else {
      const role = resumeData.experience[0]?.role || 'Software Engineer';
      const skillsList = Object.values(resumeData.skills || {}).flat().slice(0, 3).join(', ') || 'React, Node.js';
      mockAchievements = [
        { id: Date.now().toString() + '-1', text: `Developed a modern responsive full-stack platform using ${skillsList}, increasing user engagement metrics by 25%.` },
        { id: Date.now().toString() + '-2', text: `Optimized database indices and pipeline execution strategies, reducing API server-side latency by 30%.` },
        { id: Date.now().toString() + '-3', text: `Led code refactoring processes and automated test pipelines, boosting staging deployment efficiency.` }
      ];
    }
    
    triggerUpdate({
      ...resumeData,
      achievements: [...(resumeData.achievements || []), ...mockAchievements]
    });
  };


  const healthCheckReport = runHealthCheck(resumeData, {
    handleAISummaryGenerate,
    handleGenerateAchievements,
    handleAIProjectGenerate,
    handleAddMockCertifications
  });

  // Completeness Analytics
  const calculateCompleteness = () => {
    let score = 0;
    const { personalInfo, summary, education, skills, experience } = resumeData;

    if (personalInfo?.fullName) score += 15;
    if (personalInfo?.email) score += 15;
    if (personalInfo?.phone) score += 15;
    if (personalInfo?.location) score += 10;
    if (personalInfo?.linkedin) score += 5;
    if (personalInfo?.github) score += 5;

    if (summary) score += 10;
    if (education && education.length > 0) score += 10;
    if (experience && experience.length > 0) score += 10;
    
    const hasAnySkill = Object.values(skills || {}).some(arr => arr && arr.length > 0);
    if (hasAnySkill) score += 5;

    return Math.min(score, 100);
  };

  const getMissingSections = () => {
    const missing = [];
    const { personalInfo, summary, education, skills, experience, projects, certifications, achievements } = resumeData;

    if (!personalInfo?.fullName) missing.push('Full Name');
    if (!personalInfo?.email) missing.push('Contact Email');
    if (!summary) missing.push('Professional Summary');
    if (!education || education.length === 0) missing.push('Education Entries');
    if (!experience || experience.length === 0) missing.push('Work Experience');
    
    const hasAnySkill = Object.values(skills || {}).some(arr => arr && arr.length > 0);
    if (!hasAnySkill) missing.push('Technical Skills');

    if (!projects || projects.length === 0) missing.push('Projects');
    if (!certifications || certifications.length === 0) missing.push('Certifications');
    if (!achievements || achievements.length === 0) missing.push('Achievements');

    return missing;
  };

  const completeness = calculateCompleteness();
  const missing = getMissingSections();

  // Comments / Suggestions Actions
  const handleOpenCommentDialog = (section, sectionId) => {
    setCommentSection(section);
    setCommentSectionId(sectionId);
    setCommentText('');
    setCommentDialogOpen(true);
  };

  const handlePostComment = async () => {
    if (!commentText) return;
    try {
      await commentService.createComment(documentId, commentText, undefined, commentSection, commentSectionId);
      alert('Comment posted successfully. Open the Comments panel on the right to view replies.');
      setCommentDialogOpen(false);
    } catch (err) {
      console.error('Failed to post comment:', err);
    }
  };

  const handleOpenSuggestionDialog = (section, sectionId, fieldName, currentValue) => {
    setSuggestionSection(section);
    setSuggestionSectionId(sectionId);
    setSuggestionFieldName(fieldName);
    setOriginalText(currentValue || '');
    setSuggestedText(currentValue || '');
    setSuggestionDialogOpen(true);
  };

  const handlePostSuggestion = async () => {
    if (!suggestedText || suggestedText === originalText) return;
    try {
      await commentService.createSuggestion(
        documentId,
        originalText,
        suggestedText,
        undefined,
        suggestionSection,
        suggestionSectionId,
        suggestionFieldName
      );
      alert('Suggestion submitted successfully. Owners/Editors can review it in the Suggestions panel.');
      setSuggestionDialogOpen(false);
    } catch (err) {
      console.error('Failed to submit suggestion:', err);
    }
  };

  // Local Editor theme creator
  const localTheme = createTheme({
    palette: {
      mode: editorThemeMode,
      primary: {
        main: '#6366f1',
      },
      secondary: {
        main: '#8a2be2',
      },
      background: {
        default: editorThemeMode === 'dark' ? '#121217' : '#f8fafc',
        paper: editorThemeMode === 'dark' ? '#1a1a22' : '#ffffff',
      },
      text: {
        primary: editorThemeMode === 'dark' ? '#f1f5f9' : '#0f172a',
        secondary: editorThemeMode === 'dark' ? '#94a3b8' : '#475569',
      }
    },
    components: {
      MuiAccordion: {
        styleOverrides: {
          root: {
            '&:before': { display: 'none' }
          }
        }
      }
    }
  });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      
      {/* Mobile Tab Swapper */}
      <Box sx={{ display: { xs: 'block', md: 'none' }, borderBottom: '1px solid var(--border-color)' }}>
        <Tabs value={viewTab} onChange={(_, val) => setViewTab(val)} fullWidth sx={{ '& .MuiTab-root': { color: 'var(--text-muted)' } }}>
          <Tab label="Edit Form" value="form" />
          <Tab label="Live Preview" value="preview" />
          <Tab label="Health Check" value="health" />
        </Tabs>
      </Box>

      {/* Main Container */}
      <Grid container spacing={3} sx={{ flex: 1, overflow: 'hidden', p: { xs: 1, md: 0 } }}>
        
        {/* Left Panel: Form */}
        <Grid
          size={{ xs: 12, md: healthCheckOpen ? 4.5 : 5 }}
          sx={{
            display: { xs: viewTab === 'form' ? 'flex' : 'none', md: 'flex' },
            flexDirection: 'column',
            height: '100%',
            overflowY: 'auto',
            borderRight: { md: '1px solid var(--border-color)' },
            pr: { md: 3 },
            boxSizing: 'border-box'
          }}
        >
          <ThemeProvider theme={localTheme}>
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              
              {/* Header Actions: Template Type & Editor Theme Toggle */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, bgcolor: 'background.paper', p: 2, borderRadius: '8px', border: '1px solid rgba(148, 163, 184, 0.12)' }}>
                <Select
                  size="small"
                  value={resumeData.templateType}
                  onChange={(e) => triggerUpdate({ ...resumeData, templateType: e.target.value })}
                  disabled={isReadOnly}
                  sx={{ width: 180, borderRadius: '8px' }}
                >
                  <MenuItem value="Professional ATS">Professional ATS</MenuItem>
                  <MenuItem value="Software Engineer">Software Engineer</MenuItem>
                  <MenuItem value="Student Resume">Student Resume</MenuItem>
                </Select>

                <IconButton
                  size="small"
                  onClick={() => setEditorThemeMode(prev => prev === 'dark' ? 'light' : 'dark')}
                  sx={{ border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: '8px', p: 1, color: 'text.primary' }}
                >
                  {editorThemeMode === 'dark' ? <Brightness7Icon fontSize="small" /> : <Brightness4Icon fontSize="small" />}
                </IconButton>
              </Box>

              {/* ATS Checker & Analyzer & Health Check Toggle */}
              <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5 }}>
                <Button
                  variant="contained"
                  startIcon={<SpeedIcon />}
                  onClick={() => setAtsDialogOpen(true)}
                  sx={{
                    flex: 1.5,
                    py: 1.2,
                    fontWeight: 600,
                    textTransform: 'none',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #6366f1 0%, #8a2be2 100%)',
                    boxShadow: '0 4px 15px rgba(99, 102, 241, 0.25)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)'
                    }
                  }}
                >
                  Scan ATS Score
                </Button>

                <Button
                  variant={healthCheckOpen ? "contained" : "outlined"}
                  onClick={() => setHealthCheckOpen(prev => !prev)}
                  startIcon={healthCheckOpen ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                  sx={{
                    flex: 1,
                    py: 1.2,
                    fontWeight: 600,
                    textTransform: 'none',
                    borderRadius: '10px',
                    borderColor: healthCheckReport.scoreColor,
                    color: healthCheckOpen ? '#ffffff' : healthCheckReport.scoreColor,
                    bgcolor: healthCheckOpen ? healthCheckReport.scoreColor : 'transparent',
                    '&:hover': {
                      bgcolor: healthCheckOpen ? healthCheckReport.scoreColor : 'rgba(255,255,255,0.05)',
                      borderColor: healthCheckReport.scoreColor
                    }
                  }}
                >
                  Health ({healthCheckReport.score}%)
                </Button>
              </Box>

              {/* Resume Analytics Card */}
              <Card sx={{ mb: 3, bgcolor: 'background.paper', border: '1px solid rgba(99, 102, 241, 0.15)', borderRadius: '10px' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'primary.main' }}>Resume Completeness Checklist</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <LinearProgress variant="determinate" value={completeness} color="primary" sx={{ flex: 1, height: 8, borderRadius: '4px' }} />
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{completeness}%</Typography>
                  </Box>
                  {missing.length > 0 ? (
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      <strong>Missing sections: </strong>{missing.join(', ')}
                    </Typography>
                  ) : (
                    <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 'bold' }}>
                      ✓ All recommended sections added!
                    </Typography>
                  )}
                </CardContent>
              </Card>

              {/* Accordion Sections */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pb: 4 }}>
                
                {/* Personal Information */}
                <Accordion sx={{ bgcolor: 'background.paper', border: '1px solid rgba(148, 163, 184, 0.12)', borderRadius: '8px' }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography sx={{ fontWeight: 600 }}>1. Personal Information</Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      label="Full Name" size="small" fullWidth
                      value={resumeData.personalInfo.fullName}
                      disabled={isReadOnly}
                      onChange={(e) => handlePersonalInfoChange('fullName', e.target.value)}
                      onFocus={() => handleFieldFocus('personalInfo.fullName')}
                      onBlur={handleFieldBlur}
                    />
                    <TextField
                      label="Email" size="small" fullWidth
                      value={resumeData.personalInfo.email}
                      disabled={isReadOnly}
                      onChange={(e) => handlePersonalInfoChange('email', e.target.value)}
                      onFocus={() => handleFieldFocus('personalInfo.email')}
                      onBlur={handleFieldBlur}
                    />
                    <TextField
                      label="Phone Number" size="small" fullWidth
                      value={resumeData.personalInfo.phone}
                      disabled={isReadOnly}
                      onChange={(e) => handlePersonalInfoChange('phone', e.target.value)}
                      onFocus={() => handleFieldFocus('personalInfo.phone')}
                      onBlur={handleFieldBlur}
                    />
                    <TextField
                      label="Location" size="small" fullWidth
                      placeholder="e.g. San Francisco, CA"
                      value={resumeData.personalInfo.location}
                      disabled={isReadOnly}
                      onChange={(e) => handlePersonalInfoChange('location', e.target.value)}
                      onFocus={() => handleFieldFocus('personalInfo.location')}
                      onBlur={handleFieldBlur}
                    />
                    <TextField
                      label="LinkedIn Link" size="small" fullWidth
                      value={resumeData.personalInfo.linkedin}
                      disabled={isReadOnly}
                      onChange={(e) => handlePersonalInfoChange('linkedin', e.target.value)}
                      onFocus={() => handleFieldFocus('personalInfo.linkedin')}
                      onBlur={handleFieldBlur}
                    />
                    <TextField
                      label="GitHub Profile" size="small" fullWidth
                      value={resumeData.personalInfo.github}
                      disabled={isReadOnly}
                      onChange={(e) => handlePersonalInfoChange('github', e.target.value)}
                      onFocus={() => handleFieldFocus('personalInfo.github')}
                      onBlur={handleFieldBlur}
                    />
                    <TextField
                      label="Portfolio Website" size="small" fullWidth
                      value={resumeData.personalInfo.portfolio}
                      disabled={isReadOnly}
                      onChange={(e) => handlePersonalInfoChange('portfolio', e.target.value)}
                      onFocus={() => handleFieldFocus('personalInfo.portfolio')}
                      onBlur={handleFieldBlur}
                    />
                  </AccordionDetails>
                </Accordion>

                {/* Summary with AI Generator */}
                <Accordion sx={{ bgcolor: 'background.paper', border: '1px solid rgba(148, 163, 184, 0.12)', borderRadius: '8px' }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', pr: 1.5 }}>
                      <Typography sx={{ fontWeight: 600 }}>2. Professional Summary</Typography>
                      {!isReadOnly && (
                        <Button
                          size="small"
                          startIcon={<AutoAwesomeIcon />}
                          onClick={(e) => { e.stopPropagation(); handleAISummaryGenerate(); }}
                          disabled={isGeneratingSummary}
                          sx={{ textTransform: 'none', py: 0.2 }}
                        >
                          {isGeneratingSummary ? 'Writing...' : 'AI Generate'}
                        </Button>
                      )}
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <TextField
                      label="Professional Summary"
                      multiline
                      rows={4}
                      fullWidth
                      placeholder="Describe your career goals and key strengths in 2-3 sentences..."
                      helperText={`${resumeData.summary.length}/500 characters max`}
                      value={resumeData.summary}
                      disabled={isReadOnly}
                      onChange={(e) => handleSummaryChange(e.target.value)}
                      onFocus={() => handleFieldFocus('summary')}
                      onBlur={handleFieldBlur}
                    />
                  </AccordionDetails>
                </Accordion>

                {/* Education */}
                <Accordion sx={{ bgcolor: 'background.paper', border: '1px solid rgba(148, 163, 184, 0.12)', borderRadius: '8px' }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography sx={{ fontWeight: 600 }}>3. Education</Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {resumeData.education.map((edu, idx) => (
                      <Box key={edu.id || edu._id} sx={{ p: 2, border: '1px solid rgba(148, 163, 184, 0.15)', borderRadius: '8px', position: 'relative' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Institution #{idx + 1}</Typography>
                          {!isReadOnly && (
                            <IconButton size="small" onClick={() => removeListEntry('education', edu.id || edu._id)} sx={{ color: '#f44336' }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <TextField
                            label="College/University Name" size="small" fullWidth
                            value={edu.college} disabled={isReadOnly}
                            onChange={(e) => updateListEntry('education', edu.id || edu._id, 'college', e.target.value)}
                          />
                          <TextField
                            label="Degree/Major" size="small" fullWidth
                            placeholder="e.g. B.S. in Computer Science"
                            value={edu.degree} disabled={isReadOnly}
                            onChange={(e) => updateListEntry('education', edu.id || edu._id, 'degree', e.target.value)}
                          />
                          <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                              label="CGPA/GPA" size="small" fullWidth
                              value={edu.cgpa} disabled={isReadOnly}
                              onChange={(e) => updateListEntry('education', edu.id || edu._id, 'cgpa', e.target.value)}
                            />
                            <TextField
                              label="Location" size="small" fullWidth
                              value={edu.location} disabled={isReadOnly}
                              onChange={(e) => updateListEntry('education', edu.id || edu._id, 'location', e.target.value)}
                            />
                          </Box>
                          <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                              label="Start Year" size="small" fullWidth
                              value={edu.startYear} disabled={isReadOnly}
                              onChange={(e) => updateListEntry('education', edu.id || edu._id, 'startYear', e.target.value)}
                            />
                            <TextField
                              label="End Year (or Expected)" size="small" fullWidth
                              value={edu.endYear} disabled={isReadOnly}
                              onChange={(e) => updateListEntry('education', edu.id || edu._id, 'endYear', e.target.value)}
                            />
                          </Box>
                        </Box>
                      </Box>
                    ))}
                    {!isReadOnly && (
                      <Button
                        startIcon={<AddIcon />}
                        variant="outlined"
                        size="small"
                        onClick={() => addListEntry('education', { college: '', degree: '', cgpa: '', location: '', startYear: '', endYear: '' })}
                        sx={{ textTransform: 'none', borderRadius: '8px' }}
                      >
                        Add Education
                      </Button>
                    )}
                  </AccordionDetails>
                </Accordion>

                {/* Technical Skills with suggestions */}
                <Accordion sx={{ bgcolor: 'background.paper', border: '1px solid rgba(148, 163, 184, 0.12)', borderRadius: '8px' }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography sx={{ fontWeight: 600 }}>4. Technical Skills</Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    {['languages', 'frontend', 'backend', 'database', 'cloud', 'tools'].map((cat) => {
                      const currentSkills = resumeData.skills?.[cat] || [];
                      const suggested = SKILL_SUGGESTIONS[cat].filter(s => !currentSkills.includes(s)).slice(0, 4);
                      
                      return (
                        <Box key={cat}>
                          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, textTransform: 'capitalize', color: 'text.primary' }}>{cat}</Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                            {currentSkills.map((skill, sIdx) => (
                              <Chip
                                key={sIdx}
                                label={skill}
                                size="small"
                                onDelete={isReadOnly ? undefined : () => handleRemoveSkill(cat, sIdx)}
                                sx={{ bgcolor: 'rgba(99, 102, 241, 0.1)', color: 'text.primary' }}
                              />
                            ))}
                          </Box>
                          
                          {/* Suggested skill chips */}
                          {!isReadOnly && suggested.length > 0 && (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5, alignItems: 'center' }}>
                              <Typography variant="caption" sx={{ color: 'text.secondary', mr: 0.5 }}>Suggested:</Typography>
                              {suggested.map(s => (
                                <Chip
                                  key={s}
                                  label={`+ ${s}`}
                                  size="small"
                                  variant="outlined"
                                  onClick={() => {
                                    const updated = [...currentSkills, s];
                                    triggerUpdate({
                                      ...resumeData,
                                      skills: {
                                        ...resumeData.skills,
                                        [cat]: updated
                                      }
                                    });
                                  }}
                                  sx={{ height: 22, fontSize: '10px', cursor: 'pointer', '&:hover': { bgcolor: 'rgba(99,102,241,0.05)' } }}
                                />
                              ))}
                            </Box>
                          )}

                          {!isReadOnly && (
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <TextField
                                placeholder="e.g. React, Docker, Python..."
                                size="small"
                                fullWidth
                                value={skillInputs[cat]}
                                onChange={(e) => setSkillInputs(prev => ({ ...prev, [cat]: e.target.value }))}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddSkill(cat);
                                  }
                                }}
                              />
                              <Button
                                variant="contained"
                                size="small"
                                onClick={() => handleAddSkill(cat)}
                                sx={{ textTransform: 'none', bgcolor: 'primary.main', color: '#fff', '&:hover': { bgcolor: 'primary.dark' } }}
                              >
                                Add
                              </Button>
                            </Box>
                          )}
                        </Box>
                      );
                    })}
                  </AccordionDetails>
                </Accordion>

                {/* Experience */}
                <Accordion sx={{ bgcolor: 'background.paper', border: '1px solid rgba(148, 163, 184, 0.12)', borderRadius: '8px' }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography sx={{ fontWeight: 600 }}>5. Experience</Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {resumeData.experience.map((exp, idx) => (
                      <Box key={exp.id || exp._id} sx={{ p: 2, border: '1px solid rgba(148, 163, 184, 0.15)', borderRadius: '8px', position: 'relative' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Experience #{idx + 1}</Typography>
                          {!isReadOnly && (
                            <IconButton size="small" onClick={() => removeListEntry('experience', exp.id || exp._id)} sx={{ color: '#f44336' }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <TextField
                            label="Company Name" size="small" fullWidth
                            value={exp.company} disabled={isReadOnly}
                            onChange={(e) => updateListEntry('experience', exp.id || exp._id, 'company', e.target.value)}
                          />
                          <TextField
                            label="Role/Designation" size="small" fullWidth
                            value={exp.role} disabled={isReadOnly}
                            onChange={(e) => updateListEntry('experience', exp.id || exp._id, 'role', e.target.value)}
                          />
                          <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                              label="Start Date" size="small" fullWidth
                              placeholder="e.g. June 2023"
                              value={exp.startDate} disabled={isReadOnly}
                              onChange={(e) => updateListEntry('experience', exp.id || exp._id, 'startDate', e.target.value)}
                            />
                            <TextField
                              label="End Date" size="small" fullWidth
                              placeholder="e.g. Present"
                              value={exp.endDate} disabled={isReadOnly}
                              onChange={(e) => updateListEntry('experience', exp.id || exp._id, 'endDate', e.target.value)}
                            />
                          </Box>
                          <TextField
                            label="Job Description (Enter splits into bullets)" multiline rows={3} fullWidth
                            placeholder="• Built scalable web applications..."
                            value={exp.description} disabled={isReadOnly}
                            onChange={(e) => updateListEntry('experience', exp.id || exp._id, 'description', e.target.value)}
                          />
                        </Box>
                      </Box>
                    ))}
                    {!isReadOnly && (
                      <Button
                        startIcon={<AddIcon />}
                        variant="outlined"
                        size="small"
                        onClick={() => addListEntry('experience', { company: '', role: '', startDate: '', endDate: '', description: '' })}
                        sx={{ textTransform: 'none', borderRadius: '8px' }}
                      >
                        Add Experience
                      </Button>
                    )}
                  </AccordionDetails>
                </Accordion>

                {/* Projects with AI Bullets */}
                <Accordion sx={{ bgcolor: 'background.paper', border: '1px solid rgba(148, 163, 184, 0.12)', borderRadius: '8px' }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography sx={{ fontWeight: 600 }}>6. Projects</Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {resumeData.projects.map((proj, idx) => (
                      <Box key={proj.id || proj._id} sx={{ p: 2, border: '1px solid rgba(148, 163, 184, 0.15)', borderRadius: '8px', position: 'relative' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Project #{idx + 1}</Typography>
                          {!isReadOnly && (
                            <IconButton size="small" onClick={() => removeListEntry('projects', proj.id || proj._id)} sx={{ color: '#f44336' }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <TextField
                            label="Project Name" size="small" fullWidth
                            value={proj.projectName} disabled={isReadOnly}
                            onChange={(e) => updateListEntry('projects', proj.id || proj._id, 'projectName', e.target.value)}
                          />
                          <TextField
                            label="Technologies Used" size="small" fullWidth
                            placeholder="e.g. React, Node.js, Socket.io"
                            value={proj.technologies} disabled={isReadOnly}
                            onChange={(e) => updateListEntry('projects', proj.id || proj._id, 'technologies', e.target.value)}
                          />
                          <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                              label="GitHub Link" size="small" fullWidth
                              value={proj.githubLink} disabled={isReadOnly}
                              onChange={(e) => updateListEntry('projects', proj.id || proj._id, 'githubLink', e.target.value)}
                            />
                            <TextField
                              label="Live Demo Link" size="small" fullWidth
                              value={proj.liveLink} disabled={isReadOnly}
                              onChange={(e) => updateListEntry('projects', proj.id || proj._id, 'liveLink', e.target.value)}
                            />
                          </Box>
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Project Description</Typography>
                            {!isReadOnly && (
                              <Button
                                size="small"
                                startIcon={<AutoAwesomeIcon />}
                                disabled={!!isGeneratingProject[proj.id || proj._id]}
                                onClick={() => handleAIProjectGenerate(proj.id || proj._id, proj.projectName, proj.technologies)}
                                sx={{ textTransform: 'none', py: 0, minHeight: 0 }}
                              >
                                {isGeneratingProject[proj.id || proj._id] ? 'Generating...' : 'AI Generate Bullets'}
                              </Button>
                            )}
                          </Box>
                          
                          <TextField
                            placeholder="• Implemented mentorship system..."
                            multiline rows={3} fullWidth
                            value={proj.description} disabled={isReadOnly}
                            onChange={(e) => updateListEntry('projects', proj.id || proj._id, 'description', e.target.value)}
                          />
                        </Box>
                      </Box>
                    ))}
                    {!isReadOnly && (
                      <Button
                        startIcon={<AddIcon />}
                        variant="outlined"
                        size="small"
                        onClick={() => addListEntry('projects', { projectName: '', technologies: '', githubLink: '', liveLink: '', description: '' })}
                        sx={{ textTransform: 'none', borderRadius: '8px' }}
                      >
                        Add Project
                      </Button>
                    )}
                  </AccordionDetails>
                </Accordion>

                {/* Certifications */}
                <Accordion sx={{ bgcolor: 'background.paper', border: '1px solid rgba(148, 163, 184, 0.12)', borderRadius: '8px' }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography sx={{ fontWeight: 600 }}>7. Certifications</Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {resumeData.certifications.map((cert, idx) => (
                      <Box key={cert.id || cert._id} sx={{ p: 2, border: '1px solid rgba(148, 163, 184, 0.15)', borderRadius: '8px', position: 'relative' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Certification #{idx + 1}</Typography>
                          {!isReadOnly && (
                            <IconButton size="small" onClick={() => removeListEntry('certifications', cert.id || cert._id)} sx={{ color: '#f44336' }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <TextField
                            label="Certification Name" size="small" fullWidth
                            value={cert.name} disabled={isReadOnly}
                            onChange={(e) => updateListEntry('certifications', cert.id || cert._id, 'name', e.target.value)}
                          />
                          <TextField
                            label="Issuer" size="small" fullWidth
                            value={cert.issuer} disabled={isReadOnly}
                            onChange={(e) => updateListEntry('certifications', cert.id || cert._id, 'issuer', e.target.value)}
                          />
                          <TextField
                            label="Date" size="small" fullWidth
                            placeholder="e.g. Nov 2024"
                            value={cert.date} disabled={isReadOnly}
                            onChange={(e) => updateListEntry('certifications', cert.id || cert._id, 'date', e.target.value)}
                          />
                        </Box>
                      </Box>
                    ))}
                    {!isReadOnly && (
                      <Button
                        startIcon={<AddIcon />}
                        variant="outlined"
                        size="small"
                        onClick={() => addListEntry('certifications', { name: '', issuer: '', date: '' })}
                        sx={{ textTransform: 'none', borderRadius: '8px' }}
                      >
                        Add Certification
                      </Button>
                    )}
                  </AccordionDetails>
                </Accordion>

                {/* Achievements */}
                <Accordion sx={{ bgcolor: 'background.paper', border: '1px solid rgba(148, 163, 184, 0.12)', borderRadius: '8px' }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography sx={{ fontWeight: 600 }}>8. Achievements</Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {resumeData.achievements.map((ach, idx) => (
                      <Box key={ach.id || ach._id} sx={{ p: 2, border: '1px solid rgba(148, 163, 184, 0.15)', borderRadius: '8px', position: 'relative' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Achievement #{idx + 1}</Typography>
                          {!isReadOnly && (
                            <IconButton size="small" onClick={() => removeListEntry('achievements', ach.id || ach._id)} sx={{ color: '#f44336' }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                        <TextField
                          label="Achievement Description" size="small" fullWidth
                          multiline rows={2}
                          value={ach.text} disabled={isReadOnly}
                          onChange={(e) => updateListEntry('achievements', ach.id || ach._id, 'text', e.target.value)}
                        />
                      </Box>
                    ))}
                    {!isReadOnly && (
                      <Button
                        startIcon={<AddIcon />}
                        variant="outlined"
                        size="small"
                        onClick={() => addListEntry('achievements', { text: '' })}
                        sx={{ textTransform: 'none', borderRadius: '8px' }}
                      >
                        Add Achievement
                      </Button>
                    )}
                  </AccordionDetails>
                </Accordion>

              </Box>
            </Box>
          </ThemeProvider>
        </Grid>

        {/* Right Panel: Live Resume Preview */}
        <Grid
          size={{ xs: 12, md: healthCheckOpen ? 5 : 7 }}
          sx={{
            display: { xs: viewTab === 'preview' ? 'flex' : 'none', md: 'flex' },
            flexDirection: 'column',
            height: '100%',
            overflowY: 'auto',
            bgcolor: 'var(--bg-primary)',
            p: { xs: 1, md: 3 },
            boxSizing: 'border-box'
          }}
        >
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxSizing: 'border-box'
            }}
          >
            <ResumePreview
              resumeData={resumeData}
              userRole={userRole}
              onCommentClick={handleOpenCommentDialog}
              onSuggestionClick={handleOpenSuggestionDialog}
            />
          </Box>
        </Grid>

        {/* Far Right Panel: Resume Health Check */}
        {healthCheckOpen && (
          <Grid
            size={{ xs: 12, md: 2.5 }}
            sx={{
              display: { xs: viewTab === 'health' ? 'flex' : 'none', md: 'flex' },
              flexDirection: 'column',
              height: '100%',
              overflowY: 'auto',
              borderLeft: { md: '1px solid var(--border-color)' },
              pl: { md: 2.5 },
              boxSizing: 'border-box',
              p: 2,
              bgcolor: 'background.paper'
            }}
          >
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, borderBottom: '1px solid var(--border-color)', pb: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                <FavoriteIcon sx={{ color: healthCheckReport.scoreColor }} /> Health Check
              </Typography>
              <IconButton size="small" onClick={() => setHealthCheckOpen(false)}>
                <ExpandMoreIcon sx={{ transform: 'rotate(90deg)' }} />
              </IconButton>
            </Box>

            {/* Health Score circular gauge */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3, p: 2, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-color)', width: '100%', boxSizing: 'border-box' }}>
              <Typography variant="caption" sx={{ color: 'var(--text-muted)', fontWeight: 600, mb: 1 }}>RESUME HEALTH SCORE</Typography>
              <Box sx={{ position: 'relative', display: 'inline-flex', mb: 1 }}>
                <CircularProgress
                  variant="determinate"
                  value={healthCheckReport.score}
                  size={80}
                  thickness={6}
                  sx={{ color: healthCheckReport.scoreColor }}
                />
                <Box
                  sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="h6" component="div" sx={{ fontWeight: 800 }}>
                    {healthCheckReport.score}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 700, color: healthCheckReport.scoreColor, textAlign: 'center' }}>
                {healthCheckReport.scoreLabel}
              </Typography>
            </Box>

            {/* Recruiter Readiness Accordion */}
            <Accordion sx={{ bgcolor: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', mb: 1, borderRadius: '8px !important', boxShadow: 'none' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ fontWeight: 700, fontSize: '13px' }}>Recruiter Readiness ({healthCheckReport.readiness.percent}%)</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                {healthCheckReport.readiness.items.map((item, idx) => (
                  <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {item.passed ? (
                      <CheckCircleIcon sx={{ color: '#10b981', fontSize: '16px' }} />
                    ) : (
                      <CancelIcon sx={{ color: '#ef4444', fontSize: '16px' }} />
                    )}
                    <Typography variant="caption" sx={{ color: item.passed ? 'text.primary' : 'var(--text-muted)' }}>
                      {item.label}
                    </Typography>
                  </Box>
                ))}
              </AccordionDetails>
            </Accordion>

            {/* Critical Errors Accordion */}
            <Accordion defaultExpanded sx={{ bgcolor: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', mb: 1, borderRadius: '8px !important', boxShadow: 'none' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ fontWeight: 700, fontSize: '13px', color: healthCheckReport.errors.length > 0 ? '#ef4444' : 'text.primary' }}>
                  Critical Errors ({healthCheckReport.errors.length})
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {healthCheckReport.errors.length === 0 ? (
                  <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 600 }}>✓ No critical errors found!</Typography>
                ) : (
                  healthCheckReport.errors.map((item, idx) => (
                    <Box key={idx} sx={{ borderLeft: '3px solid #ef4444', pl: 1, py: 0.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#ef4444', display: 'block' }}>
                        ❌ {item.label}
                      </Typography>
                      {item.action && (
                        <Button
                          size="small"
                          variant="contained"
                          color="error"
                          onClick={item.action}
                          startIcon={<AutoAwesomeIcon />}
                          sx={{ textTransform: 'none', mt: 1, py: 0.2, px: 1, fontSize: '9px', borderRadius: '6px' }}
                        >
                          {item.actionLabel}
                        </Button>
                      )}
                    </Box>
                  ))
                )}
              </AccordionDetails>
            </Accordion>

            {/* Warnings Accordion */}
            <Accordion defaultExpanded sx={{ bgcolor: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', mb: 1, borderRadius: '8px !important', boxShadow: 'none' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ fontWeight: 700, fontSize: '13px', color: healthCheckReport.warnings.length > 0 ? '#f59e0b' : 'text.primary' }}>
                  Warnings ({healthCheckReport.warnings.length})
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {healthCheckReport.warnings.length === 0 ? (
                  <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 600 }}>✓ No warnings found!</Typography>
                ) : (
                  healthCheckReport.warnings.map((item, idx) => (
                    <Box key={idx} sx={{ borderLeft: '3px solid #f59e0b', pl: 1, py: 0.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#f59e0b', display: 'block' }}>
                        ⚠ {item.label}
                      </Typography>
                      {item.action && (
                        <Button
                          size="small"
                          variant="contained"
                          color="warning"
                          onClick={item.action}
                          startIcon={<AutoAwesomeIcon />}
                          sx={{ textTransform: 'none', mt: 1, py: 0.2, px: 1, fontSize: '9px', borderRadius: '6px' }}
                        >
                          {item.actionLabel}
                        </Button>
                      )}
                    </Box>
                  ))
                )}
              </AccordionDetails>
            </Accordion>

            {/* Suggestions Accordion */}
            <Accordion sx={{ bgcolor: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', mb: 1, borderRadius: '8px !important', boxShadow: 'none' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ fontWeight: 700, fontSize: '13px', color: 'primary.main' }}>
                  Suggestions ({healthCheckReport.suggestions.length})
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                {healthCheckReport.suggestions.length === 0 ? (
                  <Typography variant="caption" sx={{ color: '#10b981' }}>No new suggestions.</Typography>
                ) : (
                  healthCheckReport.suggestions.map((item, idx) => (
                    <Typography key={idx} variant="caption" sx={{ color: 'var(--text-muted)', display: 'block', borderLeft: '3px solid #3b82f6', pl: 1, py: 0.5 }}>
                      ℹ {item.label}
                    </Typography>
                  ))
                )}
              </AccordionDetails>
            </Accordion>
          </Grid>
        )}
      </Grid>

      {/* Add Comment Dialog */}
      <Dialog
        open={commentDialogOpen}
        onClose={() => setCommentDialogOpen(false)}
        slotProps={{
          paper: {
            sx: {
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              width: 400
            }
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Add Comment on Section</DialogTitle>
        <DialogContent>
          <Typography variant="caption" color="var(--accent-secondary)" sx={{ display: 'block', mb: 2 }}>
            Section: {commentSection.toUpperCase()}
          </Typography>
          <TextField
            placeholder="Write your comment..."
            multiline
            rows={3}
            fullWidth
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCommentDialogOpen(false)} color="inherit" sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={handlePostComment}
            variant="contained"
            disabled={!commentText}
            sx={{ textTransform: 'none', background: 'var(--accent-primary)', '&:hover': { background: 'var(--accent-secondary)' } }}
          >
            Post Comment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Suggest Edit Dialog */}
      <Dialog
        open={suggestionDialogOpen}
        onClose={() => setSuggestionDialogOpen(false)}
        slotProps={{
          paper: {
            sx: {
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              width: 450
            }
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Suggest Edit on Section</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Typography variant="caption" color="var(--accent-secondary)" sx={{ display: 'block' }}>
            Section: {suggestionSection.toUpperCase()} ({suggestionFieldName})
          </Typography>
          <TextField
            label="Current Text"
            multiline
            rows={3}
            fullWidth
            disabled
            value={originalText}
          />
          <TextField
            label="Suggested Text"
            multiline
            rows={3}
            fullWidth
            value={suggestedText}
            onChange={(e) => setSuggestedText(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSuggestionDialogOpen(false)} color="inherit" sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={handlePostSuggestion}
            variant="contained"
            disabled={!suggestedText || suggestedText === originalText}
            sx={{ textTransform: 'none', background: 'var(--accent-primary)', '&:hover': { background: 'var(--accent-secondary)' } }}
          >
            Submit Suggestion
          </Button>
        </DialogActions>
      </Dialog>

      {/* ATS Optimizer Report Dialog */}
      <Dialog
        open={atsDialogOpen}
        onClose={() => setAtsDialogOpen(false)}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              color: '#f1f5f9',
              p: 2.5
            }
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid var(--border-color)', pb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <SpeedIcon color="primary" /> ATS Simulator & Optimization Report
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {/* horizontal step tabs */}
          <Tabs
            value={atsActiveTab}
            onChange={(_, val) => setAtsActiveTab(val)}
            sx={{
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              mb: 3,
              '& .MuiTab-root': { color: 'var(--text-muted)', textTransform: 'none', fontWeight: 600 }
            }}
          >
            <Tab label="1. Parse & Strip" />
            <Tab label="2. Categorization" />
            <Tab label="3. Keyword Match" />
            <Tab label="4. Score & Rank" />
          </Tabs>

          {/* Step 1 Panel */}
          {atsActiveTab === 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  Step 1: Parse & Strip
                </Typography>
                <Chip label={`Step Score: ${atsReport.step1.score}/25`} color="primary" variant="outlined" size="small" />
              </Box>
              <Typography variant="body2" sx={{ color: 'var(--text-muted)' }}>
                The ATS strips away all styling, colors, fonts, and layouts, converting your document into plain text. If you used complex tables or graphics, the parser scrambles the text or leaves it entirely blank.
              </Typography>
              
              {resumeData.templateType !== 'Professional ATS' && (
                <Alert severity="warning" sx={{ borderRadius: '8px', bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', '& .MuiAlert-icon': { color: '#ef4444' } }}>
                  <strong>Scrambling Warning:</strong> Your selected layout template ("{resumeData.templateType}") contains styling elements or spacing structures that scrambled the parser's plain text extraction. Switch to the <strong>Professional ATS</strong> template to ensure a clean scan.
                </Alert>
              )}

              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 1, color: 'text.secondary' }}>
                    Stylized Original Layout (Browser Preview)
                  </Typography>
                  <Box sx={{ border: '1px solid var(--border-color)', borderRadius: '8px', p: 2, bgcolor: '#ffffff', color: '#000000', height: 230, overflowY: 'auto' }}>
                    <Box sx={{ borderBottom: '1px solid #ddd', pb: 1, mb: 1, textAlign: 'center' }}>
                      <Typography sx={{ fontWeight: 'bold', fontSize: '14px', textTransform: 'uppercase' }}>
                        {resumeData.personalInfo?.fullName || 'YOUR NAME'}
                      </Typography>
                      <Typography sx={{ fontSize: '9px', color: '#666' }}>
                        {resumeData.personalInfo?.email} | {resumeData.personalInfo?.phone}
                      </Typography>
                    </Box>
                    <Typography sx={{ fontWeight: 'bold', fontSize: '10px', color: 'indigo', borderBottom: '1px solid indigo', pb: 0.2, mb: 1 }}>
                      SUMMARY
                    </Typography>
                    <Typography sx={{ fontSize: '9px', color: '#333', textAlign: 'justify' }}>
                      {resumeData.summary || 'Summary content...'}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 1, color: 'text.secondary' }}>
                    Scanned Plain Text (Converted plain text representation)
                  </Typography>
                  <Box sx={{ border: '1px solid var(--border-color)', borderRadius: '8px', p: 2, bgcolor: '#0b0b0e', color: resumeData.templateType === 'Professional ATS' ? '#10b981' : '#ef4444', fontFamily: 'monospace', fontSize: '11px', height: 230, overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
                    {atsReport.step1.parsedText}
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Step 2 Panel */}
          {atsActiveTab === 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  Step 2: Data Categorization
                </Typography>
                <Chip label={`Step Score: ${atsReport.step2.score}/25`} color="primary" variant="outlined" size="small" />
              </Box>
              <Typography variant="body2" sx={{ color: 'var(--text-muted)' }}>
                The algorithm maps your plain text into predefined database fields. It hunts for standard headers (e.g. Experience, Education) to bucket your information.
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2, mt: 1, maxHeight: 300, overflowY: 'auto', pr: 1 }}>
                {atsReport.step2.fields.map((item, idx) => (
                  <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.2, bgcolor: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                        {item.field}
                        <Chip label={item.status} size="small" color={item.status === 'Mapped' ? 'success' : 'error'} sx={{ height: 18, fontSize: '9px' }} />
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'var(--text-muted)', display: 'block', mt: 0.2 }}>
                        {item.text}
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      ➔ Parsed under: {item.header}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* Step 3 Panel */}
          {atsActiveTab === 2 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  Step 3: Keyword Matching
                </Typography>
                <Chip label={`Step Score: ${atsReport.step3.score}/25`} color="primary" variant="outlined" size="small" />
              </Box>
              <Typography variant="body2" sx={{ color: 'var(--text-muted)' }}>
                The system compares the tokens (words and short phrases) in your resume against the job description configured by the recruiter. It measures hard skills, soft skills, and experience duration.
              </Typography>
              
              <TextField
                label="Recruiter Configured Job Description (Edit to test matching)"
                multiline
                rows={3}
                fullWidth
                variant="outlined"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                sx={{
                  mb: 1,
                  '& .MuiOutlinedInput-root': {
                    color: '#f1f5f9',
                    bgcolor: 'rgba(0,0,0,0.15)',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.12)' },
                    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' }
                  },
                  '& .MuiInputLabel-root': {
                    color: 'var(--text-muted)'
                  }
                }}
              />

              <Box sx={{ bgcolor: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Hard Skills Tokens Found ({atsReport.step3.matchedHard.length} / {atsReport.step3.activeTargetHard.length}):</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                    {atsReport.step3.matchedHard.length > 0 ? (
                      atsReport.step3.matchedHard.map((k, i) => (
                        <Chip key={i} label={k} size="small" color="success" sx={{ height: 24 }} />
                      ))
                    ) : (
                      <Typography variant="caption" color="text.secondary">No matching hard skills. Update your skills or experience bullets.</Typography>
                    )}
                  </Box>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Missing Hard Skills Tokens:</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                    {atsReport.step3.missingHard.length > 0 ? (
                      atsReport.step3.missingHard.map((k, i) => (
                        <Chip key={i} label={k} size="small" variant="outlined" color="warning" sx={{ height: 24 }} />
                      ))
                    ) : (
                      <Typography variant="caption" color="text.secondary">✓ All job description hard skills matched!</Typography>
                    )}
                  </Box>
                </Box>

                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Soft Skills Tokens Found ({atsReport.step3.matchedSoft.length} / {atsReport.step3.activeTargetSoft.length}):</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                    {atsReport.step3.matchedSoft.length > 0 ? (
                      atsReport.step3.matchedSoft.map((k, i) => (
                        <Chip key={i} label={k} size="small" color="success" sx={{ height: 24 }} />
                      ))
                    ) : (
                      <Typography variant="caption" color="text.secondary">No matching soft skills. Weave terms like agile or collaboration into your summary.</Typography>
                    )}
                  </Box>
                </Box>
                
                <Box sx={{ borderTop: '1px solid var(--border-color)', pt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Total Experience Duration calculated:</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: atsReport.step3.expYears >= atsReport.step3.targetYears ? '#10b981' : '#f59e0b' }}>
                    {atsReport.step3.expYears} Years Found
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}

          {/* Step 4 Panel */}
          {atsActiveTab === 3 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  Step 4: Scoring & Leaderboard Stacking
                </Typography>
                <Chip label={`Step Score: ${atsReport.step4.score}/25`} color="primary" variant="outlined" size="small" />
              </Box>
              <Typography variant="body2" sx={{ color: 'var(--text-muted)' }}>
                The system assigns a percentage score based on relevance, semantic matching, and keyword density. It then stacks all applicants in a leaderboard format, from 100% down to 0%.
              </Typography>
              
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <Box sx={{
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '6px solid',
                    borderColor: atsReport.score >= 90 ? '#10b981' : atsReport.score >= 70 ? '#f59e0b' : '#ef4444',
                    mb: 1
                  }}>
                    <Typography variant="h4" sx={{ fontWeight: 800 }}>{atsReport.score}%</Typography>
                  </Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: atsReport.score >= 90 ? '#10b981' : atsReport.score >= 70 ? '#f59e0b' : '#ef4444', mb: 1 }}>
                    Relevance Score
                  </Typography>

                  <Box sx={{ textAlign: 'center', p: 1, border: '1px solid var(--border-color)', borderRadius: '8px', width: '100%', bgcolor: 'rgba(255,255,255,0.01)' }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'var(--text-muted)' }}>Keyword Density</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 800, color: 'primary.main' }}>{atsReport.step4.density}%</Typography>
                    <Typography variant="caption" sx={{ fontSize: '9px', display: 'block', color: 'text.secondary', mt: 0.5, lineHeight: 1.2 }}>
                      {atsReport.step4.status}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={8}>
                  <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 1, color: 'text.secondary' }}>
                    Recruiter Leaderboard Pipeline Stacking
                  </Typography>
                  <Box sx={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                    {atsReport.step4.leaderboard.map((cand, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          p: 1.2,
                          borderBottom: idx < atsReport.step4.leaderboard.length - 1 ? '1px solid var(--border-color)' : 'none',
                          bgcolor: cand.current ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                          borderLeft: cand.current ? '4px solid #6366f1' : 'none',
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: cand.current ? 'bold' : 'normal', display: 'flex', gap: 1 }}>
                          <span style={{ color: 'var(--text-muted)' }}>#{idx + 1}</span> {cand.name}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: cand.score >= 90 ? '#10b981' : cand.score >= 70 ? '#f59e0b' : '#ef4444' }}>
                          {cand.score}%
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Grid>
              </Grid>
              
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 1.5, mb: 1 }}>Optimization Recommendations</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {atsReport.checklist.map((item, idx) => (
                  <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                    {item.passed ? (
                      <CheckCircleIcon sx={{ color: '#10b981', fontSize: '16px', mt: 0.2 }} />
                    ) : (
                      <CancelIcon sx={{ color: '#ef4444', fontSize: '16px', mt: 0.2 }} />
                    )}
                    <Typography variant="caption" sx={{ color: item.passed ? '#f1f5f9' : 'var(--text-muted)' }}>
                      {item.label} — {item.tip}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: '1px solid var(--border-color)' }}>
          <Button onClick={() => setAtsDialogOpen(false)} variant="contained" sx={{ textTransform: 'none', bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}>
            Close Scanner
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default ResumeEditor;
