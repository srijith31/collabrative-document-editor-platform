import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Grid, Typography, TextField, Button, IconButton, Card, CardContent,
  Dialog, DialogTitle, DialogContent, DialogActions, LinearProgress, Paper, MenuItem,
  Snackbar, Alert, Tooltip, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SaveIcon from '@mui/icons-material/Save';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import PrintIcon from '@mui/icons-material/Print';
import ShareIcon from '@mui/icons-material/Share';
import EditIcon from '@mui/icons-material/Edit';
import LinkIcon from '@mui/icons-material/Link';
import LaunchIcon from '@mui/icons-material/Launch';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

import { useSocket } from '../contexts/SocketContext';
import { documentService } from '../services/documentService';

const COLLEGE_REPORT_MAKER_SECTIONS = [
  { id: 'outline', label: 'Outline / Agenda', content: '', imageUrl: '' },
  { id: 'introduction', label: 'Introduction', content: '', imageUrl: '' },
  { id: 'existingVsProposed', label: 'Existing System vs Proposed System', content: '', imageUrl: '' },
  { id: 'researchGaps', label: 'Research Gaps', content: '', imageUrl: '' },
  { id: 'problemStatement', label: 'Problem Statement', content: '', imageUrl: '' },
  { id: 'objectives', label: 'Proposed Project Objectives', content: '', imageUrl: '' },
  { id: 'outcomes', label: 'Proposed Project Outcomes', content: '', imageUrl: '' },
  { id: 'requirements', label: 'Technical Stack & Requirements', content: '', imageUrl: '' },
  { id: 'architecture', label: 'System Architecture Diagram', content: '', imageUrl: '' },
  { id: 'methodology', label: 'Methodology / Implementation Details', content: '', imageUrl: '' },
  { id: 'results', label: 'Results', content: '', imageUrl: '' },
  { id: 'paperAcceptance', label: 'Research Paper / Acceptance Proof', content: '', imageUrl: '' },
  { id: 'conclusion', label: 'Conclusion', content: '', imageUrl: '' },
  { id: 'references', label: 'References & Thank You', content: '', imageUrl: '' }
];

const SAMPLE_DIAGRAMS = [
  { name: 'None / Remove Image', url: '' },
  { name: 'Developer Workspace & Code', url: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=800&q=80' },
  { name: 'System Architecture & Wireframes', url: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=800&q=80' },
  { name: 'MongoDB / Mongoose DB Schemas', url: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=800&q=80' },
  { name: 'Team Collaboration & Workspace', url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80' },
  { name: 'AI Assistant & Copilot Neural Network', url: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=800&q=80' }
];

export const ProposalEditor = ({
  documentId,
  userRole,
  initialProposalData = {},
  restoreContent,
  onSelectionChange,
}) => {
  const { socket } = useSocket();
  const saveTimeoutRef = useRef(null);

  // Helper to merge default properties recursively and defensively
  const mergeProposalData = (incoming, fallback = {}) => {
    const defaultData = {
      notes: [],
      status: 'Draft',
      version: '1.0.0',
      attachments: {
        architectureDiagram: { name: 'Architecture Diagram', url: '' },
        flowchart: { name: 'Flowchart', url: '' },
        budgetSheet: { name: 'Budget Sheet', url: '' },
        references: { name: 'References', url: '' }
      },
      teamInfo: {
        members: '',
        guide: '',
        organization: '',
        contact: ''
      },
      projectTitle: 'CollabDoc Editor Proposal',
      sectionsList: []
    };

    if (!incoming) {
      return {
        ...defaultData,
        projectTitle: 'Project Proposal',
        sectionsList: COLLEGE_REPORT_MAKER_SECTIONS
      };
    }

    const isDefault = incoming.projectTitle === 'CollabDoc Editor Proposal' || 
                      incoming.sections?.projectTitle === 'CollabDoc Editor Proposal' ||
                      (!incoming.sectionsList && !incoming.sections);

    const title = isDefault 
      ? 'Project Proposal'
      : (incoming.projectTitle || fallback.projectTitle || defaultData.projectTitle);

    let sectionsList = [];
    if (isDefault) {
      sectionsList = COLLEGE_REPORT_MAKER_SECTIONS;
    } else if (incoming.sectionsList && Array.isArray(incoming.sectionsList)) {
      sectionsList = incoming.sectionsList;
    } else if (fallback.sectionsList && Array.isArray(fallback.sectionsList)) {
      sectionsList = fallback.sectionsList;
    } else {
      // Migrate legacy key-value sections
      const legacySections = incoming.sections || fallback.sections || {};
      const defaultSections = [
        { id: 'executiveSummary', label: 'Executive Summary', content: legacySections.executiveSummary || '' },
        { id: 'problemStatement', label: 'Problem Statement', content: legacySections.problemStatement || '' },
        { id: 'objectives', label: 'Objectives', content: legacySections.objectives || '' },
        { id: 'proposedSolution', label: 'Proposed Solution', content: legacySections.proposedSolution || '' },
        { id: 'scope', label: 'Scope', content: legacySections.scope || '' },
        { id: 'features', label: 'Features', content: legacySections.features || '' },
        { id: 'techStack', label: 'Technology Stack', content: legacySections.techStack || '' },
        { id: 'methodology', label: 'Methodology', content: legacySections.methodology || '' },
        { id: 'timeline', label: 'Timeline', content: legacySections.timeline || '' },
        { id: 'budget', label: 'Budget', content: legacySections.budget || '' },
        { id: 'risks', label: 'Risks & Challenges', content: legacySections.risks || '' },
        { id: 'futureScope', label: 'Future Scope', content: legacySections.futureScope || '' },
        { id: 'conclusion', label: 'Conclusion', content: legacySections.conclusion || '' },
        { id: 'references', label: 'References', content: legacySections.references || '' }
      ];
      sectionsList = defaultSections.map(sec => ({
        id: sec.id,
        label: sec.label,
        content: sec.content,
        imageUrl: legacySections[`${sec.id}_imageUrl`] || ''
      }));
    }

    return {
      notes: incoming.notes || fallback.notes || defaultData.notes,
      status: incoming.status || fallback.status || defaultData.status,
      version: incoming.version || fallback.version || defaultData.version,
      attachments: {
        architectureDiagram: {
          ...defaultData.attachments.architectureDiagram,
          ...(fallback.attachments?.architectureDiagram || {}),
          ...(incoming.attachments?.architectureDiagram || {})
        },
        flowchart: {
          ...defaultData.attachments.flowchart,
          ...(fallback.attachments?.flowchart || {}),
          ...(incoming.attachments?.flowchart || {})
        },
        budgetSheet: {
          ...defaultData.attachments.budgetSheet,
          ...(fallback.attachments?.budgetSheet || {}),
          ...(incoming.attachments?.budgetSheet || {})
        },
        references: {
          ...defaultData.attachments.references,
          ...(fallback.attachments?.references || {}),
          ...(incoming.attachments?.references || {})
        }
      },
      teamInfo: {
        ...defaultData.teamInfo,
        ...(fallback.teamInfo || {}),
        ...(incoming.teamInfo || {})
      },
      projectTitle: title,
      sectionsList
    };
  };

  // State
  const [proposalData, setProposalData] = useState(() => mergeProposalData(initialProposalData));
  const [activeSection, setActiveSection] = useState('');
  const [expanded, setExpanded] = useState('statistics');
  const [lastSaved, setLastSaved] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');

  // Dialog State for Edit Attachments
  const [attachmentDialog, setAttachmentDialog] = useState({ open: false, key: '', label: '', url: '' });

  // Toast State
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [paginatedPages, setPaginatedPages] = useState([]);
  const measurementRef = useRef(null);
  const [showPreview, setShowPreview] = useState(true);

  const isReadOnly = userRole === 'VIEWER';

  // ── Unified Block Renderer ────────────────────────────────────────────────
  // Renders the exact same block layout in both the hidden measurement container
  // and the final page sheets, preventing styling/dimension mismatches.
  const renderBlock = useCallback((type, blockId) => {
    if (type === 'title') {
      return (
        <Box
          key={blockId}
          data-block-id={blockId}
          data-block-type="title"
          sx={{ pb: '32px' }}
        >
          <Typography variant="h4" component="h1" sx={{ fontWeight: 800, fontFamily: '"Outfit", sans-serif', color: '#0f172a', lineHeight: 1.3, wordBreak: 'break-word', textAlign: 'center' }}>
            {proposalData.projectTitle || (<span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '24px' }}>Untitled Project Title</span>)}
          </Typography>
          <Box sx={{ width: '120px', height: '4px', background: '#6366f1', mx: 'auto', mt: 3, borderRadius: 2 }} />
        </Box>
      );
    }

    if (type === 'team-info') {
      const hasTeamInfo = proposalData.teamInfo?.members || proposalData.teamInfo?.guide || proposalData.teamInfo?.organization || proposalData.teamInfo?.contact;
      if (!hasTeamInfo) return null;
      return (
        <Box
          key={blockId}
          data-block-id={blockId}
          data-block-type="team-info"
          sx={{ pb: '40px' }}
        >
          <Box
            className="proposal-team-info-container"
            sx={{
              p: 2.5,
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              bgcolor: '#f8fafc'
            }}
          >
            <Typography variant="caption" component="h2" sx={{ color: '#64748b', fontWeight: 700, letterSpacing: '1px', display: 'block', mb: 1.5 }}>TEAM INFORMATION & GUIDE DETAILS</Typography>
            <Grid container spacing={1.5}>
              {proposalData.teamInfo?.members && (
                <Grid item xs={12}>
                  <Typography variant="body2" sx={{ color: '#334155', whiteSpace: 'pre-wrap' }}>
                    <strong>Members:</strong> {proposalData.teamInfo.members}
                  </Typography>
                </Grid>
              )}
              {proposalData.teamInfo?.guide && (
                <Grid item xs={6}>
                  <Typography variant="body2" sx={{ color: '#334155' }}>
                    <strong>Guide/Mentor:</strong> {proposalData.teamInfo.guide}
                  </Typography>
                </Grid>
              )}
              {proposalData.teamInfo?.organization && (
                <Grid item xs={6}>
                  <Typography variant="body2" sx={{ color: '#334155' }}>
                    <strong>Organization:</strong> {proposalData.teamInfo.organization}
                  </Typography>
                </Grid>
              )}
              {proposalData.teamInfo?.contact && (
                <Grid item xs={12}>
                  <Typography variant="body2" sx={{ color: '#334155' }}>
                    <strong>Contact Details:</strong> {proposalData.teamInfo.contact}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Box>
        </Box>
      );
    }

    if (type === 'section') {
      const sectionId = blockId.replace('section-', '');
      const sectionIdx = (proposalData.sectionsList || []).findIndex(s => s.id === sectionId);
      const section = (proposalData.sectionsList || [])[sectionIdx];
      if (!section) return null;
      const content = section.content || '';
      return (
        <Box
          key={blockId}
          id={`preview-section-${section.id}`}
          data-block-id={blockId}
          data-block-type="section"
          className="proposal-section-container"
          sx={{
            pb: '32px',
            scrollMarginTop: '20px'
          }}
        >
          <Typography variant="subtitle1" component="h2" className="proposal-section-title" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700, fontSize: '13.5px', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '1px solid #e2e8f0', pb: 0.5, mb: 1.5 }}>
            {sectionIdx + 1}. {section.label}
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '13px', fontFamily: '"Inter", sans-serif', color: '#334155', lineHeight: 1.7, whiteSpace: 'pre-wrap', px: 0.5 }}>
            {content.trim() ? content : (<span style={{ color: '#94a3b8', fontStyle: 'italic' }}>No content provided. Expand the '{section.label}' panel on the left to write details.</span>)}
          </Typography>
          {section.imageUrl && (
            <Box sx={{ mt: 3, mb: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <img src={section.imageUrl} alt={section.label} style={{ maxWidth: '100%', maxHeight: '340px', borderRadius: '6px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }} />
              <Typography variant="caption" sx={{ color: '#64748b', mt: 1, fontStyle: 'italic', display: 'block' }}>Figure: {section.label} Reference Diagram</Typography>
            </Box>
          )}
        </Box>
      );
    }

    if (type === 'attachments') {
      const hasAttachments = Object.values(proposalData.attachments || {}).some(a => a?.url);
      if (!hasAttachments) return null;
      return (
        <Box
          key={blockId}
          data-block-id={blockId}
          data-block-type="attachments"
          className="proposal-attachments-container"
          sx={{
            pb: '32px',
            pt: '24px',
            borderTop: '2px dashed #e2e8f0'
          }}
        >
          <Typography variant="subtitle2" component="h3" sx={{ fontWeight: 700, color: '#0f172a', mb: 1.5, letterSpacing: '0.5px' }}>ATTACHED RESOURCES & DIAGRAMS</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            {Object.entries(proposalData.attachments || {}).map(([key, attachment]) => {
              if (!attachment?.url) return null;
              return (
                <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, p: '6px 12px', bgcolor: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                  <LinkIcon sx={{ fontSize: '13px', color: '#6366f1' }} />
                  <Typography variant="caption" sx={{ color: '#334155', fontWeight: 600 }}>{attachment.name}:</Typography>
                  <Typography component="a" href={attachment.url.startsWith('http') ? attachment.url : `https://${attachment.url}`} target="_blank" rel="noopener noreferrer" variant="caption" sx={{ color: '#6366f1', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.25, '&:hover': { textDecoration: 'underline' } }}>
                    Open Link <LaunchIcon sx={{ fontSize: '9px' }} />
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>
      );
    }

    return null;
  }, [proposalData]);

  // ── A4 Pagination Engine ──────────────────────────────────────────────────
  // Measures block heights inside the hidden measurement container and
  // distributes them into page arrays that each fit within A4 content area.
  const MAX_PAGE_CONTENT_HEIGHT = 880; // px — usable A4 content area (leaving margin for padding & footer)

  const calculatePagination = useCallback(() => {
    const container = measurementRef.current;
    if (!container) return;

    const children = container.children;
    if (!children || children.length === 0) return;

    const blocks = [];
    for (let i = 0; i < children.length; i++) {
      const el = children[i];
      const height = el.getBoundingClientRect().height;
      if (height > 0) {
        blocks.push({
          id: el.getAttribute('data-block-id') || `block-${i}`,
          type: el.getAttribute('data-block-type') || 'content',
          height: height
        });
      }
    }

    const pages = [];
    let currentPage = [];
    let currentHeight = 0;

    blocks.forEach((block) => {
      if (currentHeight + block.height > MAX_PAGE_CONTENT_HEIGHT && currentPage.length > 0) {
        pages.push(currentPage);
        currentPage = [block];
        currentHeight = block.height;
      } else {
        currentPage.push(block);
        currentHeight += block.height;
      }
    });

    if (currentPage.length > 0) {
      pages.push(currentPage);
    }

    setPaginatedPages(pages);
  }, []);

  // Re-paginate whenever proposal content changes
  useEffect(() => {
    const timer = setTimeout(() => {
      calculatePagination();
    }, 300);
    return () => clearTimeout(timer);
  }, [proposalData, calculatePagination]);

  // Format timestamp helper
  const updateTimestamp = () => {
    const now = new Date();
    setLastSaved(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  };

  useEffect(() => {
    updateTimestamp();
  }, []);

  // Handle Socket Events for Real-time Collaboration
  useEffect(() => {
    if (!socket) return;

    const handleReceiveProposalChanges = (data) => {
      if (data && data.proposalData) {
        setProposalData(prev => mergeProposalData(data.proposalData, prev));
      }
    };

    socket.on('receive-proposal-changes', handleReceiveProposalChanges);
    return () => {
      socket.off('receive-proposal-changes', handleReceiveProposalChanges);
    };
  }, [socket]);

  // Handle Version Restore
  useEffect(() => {
    if (restoreContent) {
      const merged = mergeProposalData(restoreContent);
      setProposalData(merged);
      if (!isReadOnly) {
        documentService.updateDocument(documentId, { proposalData: merged });
        if (socket) {
          socket.emit('send-proposal-changes', { documentId, proposalData: merged });
        }
      }
      showToast('Version restored successfully.');
    }
  }, [restoreContent]);

  // IntersectionObserver for tracking active section in editor preview
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-10% 0px -70% 0px',
      threshold: 0
    };

    const handleIntersection = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id.replace('preview-section-', ''));
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersection, observerOptions);

    (proposalData.sectionsList || []).forEach(sec => {
      const el = document.getElementById(`preview-section-${sec.id}`);
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, [proposalData.sectionsList]);

  // Debounced Autosave
  const triggerUpdate = (updatedData) => {
    setProposalData(updatedData);

    if (socket && !isReadOnly) {
      socket.emit('send-proposal-changes', { documentId, proposalData: updatedData });
    }

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    if (!isReadOnly) {
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await documentService.updateDocument(documentId, { proposalData: updatedData });
          updateTimestamp();
          console.log('Project Proposal autosaved successfully.');
        } catch (err) {
          console.error('Failed to autosave project proposal:', err);
        }
      }, 2000);
    }
  };

  // Dynamic Section State Handlers
  const handleSectionFieldChange = (id, field, value) => {
    const list = (proposalData.sectionsList || []).map(sec => {
      if (sec.id === id) {
        return { ...sec, [field]: value };
      }
      return sec;
    });
    const updated = {
      ...proposalData,
      sectionsList: list
    };
    triggerUpdate(updated);
  };

  const handleTitleChange = (value) => {
    const updated = { ...proposalData, projectTitle: value };
    triggerUpdate(updated);
  };

  const handleStatusChange = (value) => {
    const updated = { ...proposalData, status: value };
    triggerUpdate(updated);
  };

  const handleVersionChange = (value) => {
    const updated = { ...proposalData, version: value };
    triggerUpdate(updated);
  };

  const handleTeamInfoChange = (field, value) => {
    const updated = {
      ...proposalData,
      teamInfo: {
        ...proposalData.teamInfo,
        [field]: value
      }
    };
    triggerUpdate(updated);
  };

  const handleSaveAttachment = () => {
    const { key, url } = attachmentDialog;
    const updated = {
      ...proposalData,
      attachments: {
        ...proposalData.attachments,
        [key]: { ...proposalData.attachments[key], url }
      }
    };
    triggerUpdate(updated);
    setAttachmentDialog({ open: false, key: '', label: '', url: '' });
    showToast('Attachment link updated.');
  };

  // Dynamic list manipulation
  const handleAddSection = () => {
    const newSec = {
      id: `custom-${Date.now()}`,
      label: 'New Section Label',
      content: '',
      imageUrl: ''
    };
    const updated = {
      ...proposalData,
      sectionsList: [...(proposalData.sectionsList || []), newSec]
    };
    triggerUpdate(updated);
    setExpanded(newSec.id);
    showToast('New custom section added.');
  };

  const handleRemoveSection = (id) => {
    const list = (proposalData.sectionsList || []).filter(sec => sec.id !== id);
    const updated = {
      ...proposalData,
      sectionsList: list
    };
    triggerUpdate(updated);
    showToast('Section removed.');
  };

  // UI Toast helper
  const showToast = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // Accordion toggle handler
  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  // Navigator Scroll & Expand handler
  const scrollToSection = (key) => {
    setExpanded(key);
    const el = document.getElementById(`preview-section-${key}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(key);
    }
  };

  // AI Assistant simulations
  const handleAIGenerate = (sectionId, labelName) => {
    if (isReadOnly) return;
    setAiLoading(true);

    let generatedText = `Draft boilerplate content generated for ${labelName} section in College Report Maker project.`;
    const cleanLabel = (labelName || '').toLowerCase();

    if (cleanLabel.includes('objectives')) {
      generatedText = `1. Build a real-time collaborative workspace utilizing Socket.io and TipTap editor with markdown and citation helpers.\n2. Implement a Puppeteer + pdf-lib file compilation microservice to export pixel-perfect academic PDFs.\n3. Develop a flagship PDF-to-Template converter using pdf-parse to generate reusable JSON template layouts automatically.`;
    } else if (cleanLabel.includes('outcomes')) {
      generatedText = `• A production-ready web application running on React, Redux, Express, and MongoDB.\n• High-fidelity PDF exports matching standard university templates with 100% style compliance.\n• Reusable template converter that turns old lab records or project thesis PDFs into editable templates.`;
    } else if (cleanLabel.includes('requirements') || cleanLabel.includes('stack')) {
      generatedText = `• Frontend: React, Vite, Tailwind CSS, Redux Toolkit, React Router, TipTap Editor, React DnD, Framer Motion.\n• Backend: Node.js, Express.js, MongoDB, Mongoose, Socket.io, Cloudinary.\n• PDF Engines: Puppeteer, pdf-lib, pdf-parse, PDF.js.`;
    } else if (cleanLabel.includes('results')) {
      generatedText = `• PDF Generation: Average compile time of ~1.1s for a 50-page thesis via Puppeteer.\n• Layout Extraction: Over 94% accuracy in parsing sections, headers, and images from uploaded PDFs.\n• Workspace Sync: Low-latency client synchronization (<85ms round-trip).`;
    } else if (cleanLabel.includes('introduction')) {
      generatedText = `Traditional academic report generation is plagued by non-standardized formats, tedious layout margin alignment in MS Word, and high complexity in LaTeX/Overleaf. College Report Maker introduces a collaborative, drag-and-drop MERN-based builder designed to simplify academic publishing.`;
    } else if (cleanLabel.includes('methodology') || cleanLabel.includes('details')) {
      generatedText = `• Workspace Sync: Dynamic operational state diffing via Socket.io.\n• PDF Parsing: Layer text clustering, style margin detection, heading hierarchical parsing.\n• Template Marketplace: MongoDB relations maps users to shared, starred, and community-contributed schemas.`;
    }

    setLoadingText(`AI Assistant is generating content for ${labelName}...`);

    setTimeout(() => {
      setAiLoading(false);
      handleSectionFieldChange(sectionId, 'content', generatedText);
      showToast('Boilerplate content generated.');
    }, 1200);
  };

  // Action Bar Handlers
  const handleManualSaveAction = async () => {
    try {
      await documentService.updateDocument(documentId, { proposalData });
      updateTimestamp();
      showToast('Document saved successfully.');
    } catch (err) {
      console.error(err);
      showToast('Failed to save document.', 'error');
    }
  };

  const handleExportPDF = async () => {
    const pages = document.querySelectorAll('.proposal-editor-paper');
    if (!pages || pages.length === 0) {
      showToast('No preview pages found to export.', 'error');
      return;
    }

    try {
      showToast('Preparing PDF export...');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = 210;
      const pdfHeight = 297;

      for (let i = 0; i < pages.length; i++) {
        if (i > 0) {
          pdf.addPage();
        }
        
        const pageEl = pages[i];
        const canvas = await html2canvas(pageEl, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          width: pageEl.offsetWidth,
          height: pageEl.offsetHeight
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      }

      pdf.save(`proposal-report.pdf`);
      showToast('PDF exported successfully!');
    } catch (error) {
      console.error('Failed to export to PDF:', error);
      showToast('Failed to export PDF.', 'error');
    }
  };

  const handleShare = () => {
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        showToast('Document share link copied to clipboard!');
      })
      .catch(err => {
        console.error(err);
        showToast('Failed to copy share link.', 'error');
      });
  };

  // Helper metrics calculations
  const getWordCount = () => {
    let text = proposalData.projectTitle || '';
    (proposalData.sectionsList || []).forEach(sec => {
      text += ' ' + sec.label + ' ' + sec.content;
    });
    return text.trim().split(/\s+/).filter(w => w.length > 0).length;
  };

  const getCompletedCount = () => {
    return (proposalData.sectionsList || []).filter(sec => (sec.content || '').trim().length > 0).length;
  };

  const totalSections = proposalData.sectionsList?.length || 0;
  const sectionsCompleted = getCompletedCount();
  const completionPercentage = totalSections > 0 ? Math.round((sectionsCompleted / totalSections) * 100) : 0;

  // Styled custom glassmorphic accordion CSS styles
  const accordionSx = {
    background: 'rgba(18, 18, 23, 0.65)',
    backdropFilter: 'blur(10px)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px !important',
    mb: 1.5,
    boxShadow: 'none',
    color: '#e2e8f0',
    '&:before': { display: 'none' },
    '&.Mui-expanded': {
      border: '1px solid var(--accent-secondary)',
      boxShadow: '0 0 12px rgba(99, 102, 241, 0.15)',
      background: 'rgba(26, 26, 34, 0.85)',
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative' }}>
      
      {/* AI Assistant Spinner/Overlay */}
      {aiLoading && (
        <Paper
          elevation={12}
          sx={{
            position: 'absolute',
            top: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            px: 4,
            py: 2.5,
            width: 320,
            background: 'rgba(18, 18, 23, 0.95)',
            border: '1px solid var(--accent-secondary)',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5, color: '#f1f5f9', textAlign: 'center' }}>
            {loadingText}
          </Typography>
          <LinearProgress color="secondary" sx={{ height: 4, borderRadius: 2 }} />
        </Paper>
      )}

      {/* Main Grid */}
      <Grid container spacing={3} sx={{ flex: 1, overflow: 'hidden', p: { xs: 1, md: 0 } }}>
        
        {/* Left Column: Form Editing Accordions (xs={12} md={5}) */}
        <Grid
          className="no-print proposal-editor-sidebar"
          size={{ xs: 12, md: showPreview ? 5 : 12 }}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflowY: 'auto',
            borderRight: showPreview ? { md: '1px solid var(--border-color)' } : 'none',
            pr: showPreview ? { md: 3 } : 0,
            boxSizing: 'border-box',
            position: 'relative'
          }}
        >
          {/* 1. Statistics Accordion */}
          <Accordion expanded={expanded === 'statistics'} onChange={handleAccordionChange('statistics')} sx={accordionSx}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'var(--text-muted)' }} />}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>📊</span> Project Statistics
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 0 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: 'var(--text-muted)' }}>Word Count</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#f1f5f9' }}>{getWordCount()}</Typography>
              </Box>

              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" sx={{ color: 'var(--text-muted)' }}>Sections Completed</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#f1f5f9' }}>{sectionsCompleted} / {totalSections}</Typography>
                </Box>
                <LinearProgress variant="determinate" value={completionPercentage} sx={{ height: 5, borderRadius: 3, bgcolor: 'var(--bg-tertiary)', '& .MuiLinearProgress-bar': { bgcolor: '#10b981' } }} />
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" sx={{ color: 'var(--text-muted)' }}>Status</Typography>
                <TextField
                  select
                  size="small"
                  value={proposalData.status || 'Draft'}
                  disabled={isReadOnly}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  sx={{ width: 120, '& .MuiOutlinedInput-root': { borderRadius: '6px', fontSize: '12px', height: 32 } }}
                >
                  <MenuItem value="Draft">Draft</MenuItem>
                  <MenuItem value="In Review">In Review</MenuItem>
                  <MenuItem value="Approved">Approved</MenuItem>
                  <MenuItem value="Submitted">Submitted</MenuItem>
                </TextField>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" sx={{ color: 'var(--text-muted)' }}>Version</Typography>
                <TextField
                  size="small"
                  value={proposalData.version || '1.0.0'}
                  disabled={isReadOnly}
                  onChange={(e) => handleVersionChange(e.target.value)}
                  sx={{ width: 80, '& .MuiOutlinedInput-root': { borderRadius: '6px', fontSize: '12px', height: 32, px: 1 } }}
                />
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, borderTop: '1px solid var(--border-color)' }}>
                <Typography variant="caption" sx={{ color: 'var(--text-muted)' }}>Last Saved</Typography>
                <Typography variant="caption" sx={{ color: 'var(--text-muted)', fontWeight: 600 }}>{lastSaved || 'Pending'}</Typography>
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* 2. Navigator Accordion */}
          <Accordion expanded={expanded === 'navigator'} onChange={handleAccordionChange('navigator')} sx={accordionSx}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'var(--text-muted)' }} />}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>📋</span> Proposal Navigator
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 1, pt: 0 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, maxHeight: 220, overflowY: 'auto' }}>
                { (proposalData.sectionsList || []).map((sec) => {
                  const isActive = activeSection === sec.id;
                  const hasContent = (sec.content || '').trim().length > 0;
                  return (
                    <Box
                      key={sec.id}
                      onClick={() => scrollToSection(sec.id)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        px: 1.5,
                        py: 0.75,
                        cursor: 'pointer',
                        borderRadius: '6px',
                        transition: 'all 0.2s ease',
                        borderLeft: isActive ? '3px solid var(--accent-secondary)' : '3px solid transparent',
                        background: isActive ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                        color: isActive ? '#ffffff' : 'var(--text-muted)',
                        '&:hover': {
                          background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.03)',
                          color: '#ffffff'
                        }
                      }}
                    >
                      <Typography variant="body2" sx={{ fontSize: '12px', fontWeight: isActive ? 600 : 400 }}>
                        {sec.label}
                      </Typography>
                      {hasContent && (
                        <CheckCircleIcon sx={{ fontSize: '13px', color: '#10b981', ml: 1 }} />
                      )}
                    </Box>
                  );
                })}
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* 3. Attachments Accordion */}
          <Accordion expanded={expanded === 'attachments'} onChange={handleAccordionChange('attachments')} sx={accordionSx}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'var(--text-muted)' }} />}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>📁</span> Attachments
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 0 }}>
              {[
                { key: 'architectureDiagram', label: 'Architecture Diagram' },
                { key: 'flowchart', label: 'Flowchart' },
                { key: 'budgetSheet', label: 'Budget Sheet' },
                { key: 'references', label: 'References' }
              ].map((item) => {
                const url = proposalData.attachments?.[item.key]?.url || '';
                return (
                  <Box key={item.key} sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, p: 1, borderRadius: '6px', bgcolor: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ fontSize: '11px', fontWeight: 600, color: '#f1f5f9' }}>
                        {item.label}
                      </Typography>
                      {!isReadOnly && (
                        <IconButton
                          size="small"
                          onClick={() => setAttachmentDialog({ open: true, key: item.key, label: item.label, url })}
                          sx={{ p: 0.25, color: 'var(--text-muted)', '&:hover': { color: 'var(--accent-secondary)' } }}
                        >
                          <EditIcon sx={{ fontSize: '12px' }} />
                        </IconButton>
                      )}
                    </Box>
                    {url ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <LinkIcon sx={{ fontSize: '11px', color: 'var(--accent-secondary)' }} />
                        <Typography
                          component="a"
                          href={url.startsWith('http') ? url : `https://${url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          variant="caption"
                          sx={{
                            color: 'var(--accent-secondary)',
                            textDecoration: 'none',
                            fontWeight: 500,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: 220,
                            '&:hover': { textDecoration: 'underline' }
                          }}
                        >
                          Open Resource
                        </Typography>
                        <LaunchIcon sx={{ fontSize: '9px', color: 'var(--accent-secondary)' }} />
                      </Box>
                    ) : (
                      <Typography
                        variant="caption"
                        onClick={() => !isReadOnly && setAttachmentDialog({ open: true, key: item.key, label: item.label, url })}
                        sx={{ color: 'var(--text-muted)', fontSize: '10px', cursor: isReadOnly ? 'default' : 'pointer', fontStyle: 'italic', '&:hover': { color: isReadOnly ? 'var(--text-muted)' : '#fff' } }}
                      >
                        Click to link URL
                      </Typography>
                    )}
                  </Box>
                );
              })}
            </AccordionDetails>
          </Accordion>

          {/* 4. Team Information Accordion */}
          <Accordion expanded={expanded === 'team'} onChange={handleAccordionChange('team')} sx={accordionSx}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'var(--text-muted)' }} />}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>👥</span> Team Information
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 0 }}>
              <TextField
                label="Team Members / Student details"
                size="small"
                fullWidth
                multiline
                rows={2}
                value={proposalData.teamInfo?.members || ''}
                disabled={isReadOnly}
                onChange={(e) => handleTeamInfoChange('members', e.target.value)}
                placeholder="Names, IDs, Guide details..."
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px', fontSize: '12px' } }}
              />
              <TextField
                label="Guide/Mentor"
                size="small"
                fullWidth
                value={proposalData.teamInfo?.guide || ''}
                disabled={isReadOnly}
                onChange={(e) => handleTeamInfoChange('guide', e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px', fontSize: '12px' } }}
              />
              <TextField
                label="Organization"
                size="small"
                fullWidth
                value={proposalData.teamInfo?.organization || ''}
                disabled={isReadOnly}
                onChange={(e) => handleTeamInfoChange('organization', e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px', fontSize: '12px' } }}
              />
              <TextField
                label="Contact Details"
                size="small"
                fullWidth
                value={proposalData.teamInfo?.contact || ''}
                disabled={isReadOnly}
                onChange={(e) => handleTeamInfoChange('contact', e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px', fontSize: '12px' } }}
              />
            </AccordionDetails>
          </Accordion>

          {/* 5. Project Title Accordion */}
          <Accordion expanded={expanded === 'projectTitle'} onChange={handleAccordionChange('projectTitle')} sx={accordionSx}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'var(--text-muted)' }} />}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>📝</span> Project Title
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              <TextField
                fullWidth
                multiline
                minRows={2}
                label="Project Title"
                placeholder="Enter project title here..."
                disabled={isReadOnly}
                value={proposalData.projectTitle || ''}
                onChange={(e) => handleTitleChange(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '13px' } }}
              />
            </AccordionDetails>
          </Accordion>

          {/* 6. Dynamic Section Accordions */}
          {(proposalData.sectionsList || []).map((section, idx) => (
            <Accordion
              key={section.id}
              expanded={expanded === section.id}
              onChange={handleAccordionChange(section.id)}
              sx={accordionSx}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'var(--text-muted)' }} />}>
                <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', pr: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                    {idx + 1}. {section.label}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {(section.content || '').trim().length > 0 && (
                      <CheckCircleIcon sx={{ fontSize: '14px', color: '#10b981' }} />
                    )}
                    {!isReadOnly && (
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveSection(section.id);
                        }}
                        sx={{ color: '#f87171', p: 0.25, '&:hover': { color: '#f87171' } }}
                      >
                        <DeleteIcon sx={{ fontSize: '14px' }} />
                      </IconButton>
                    )}
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 0 }}>
                {/* Rename title */}
                <TextField
                  size="small"
                  label="Rename Section Title"
                  value={section.label}
                  disabled={isReadOnly}
                  onChange={(e) => handleSectionFieldChange(section.id, 'label', e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px' } }}
                />

                {/* Content */}
                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  label="Content"
                  placeholder="Enter details..."
                  disabled={isReadOnly}
                  value={section.content || ''}
                  onChange={(e) => handleSectionFieldChange(section.id, 'content', e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '12px' } }}
                />

                {/* Image URL Input */}
                <TextField
                  size="small"
                  label="Custom Image / Diagram URL"
                  value={section.imageUrl || ''}
                  disabled={isReadOnly}
                  onChange={(e) => handleSectionFieldChange(section.id, 'imageUrl', e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px' } }}
                />

                {/* Dropdown Sample Diagram Injection */}
                {!isReadOnly && (
                  <TextField
                    select
                    size="small"
                    label="Or Select Sample Diagram"
                    value={SAMPLE_DIAGRAMS.find(d => d.url === section.imageUrl)?.url || ''}
                    onChange={(e) => handleSectionFieldChange(section.id, 'imageUrl', e.target.value)}
                    fullWidth
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px' } }}
                  >
                    {SAMPLE_DIAGRAMS.map(diag => (
                      <MenuItem key={diag.name} value={diag.url} sx={{ fontSize: '12px' }}>
                        {diag.name}
                      </MenuItem>
                    ))}
                  </TextField>
                )}

                {/* AI Assist button */}
                {!isReadOnly && (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<AutoAwesomeIcon />}
                      onClick={() => handleAIGenerate(section.id, section.label)}
                      sx={{ textTransform: 'none', borderRadius: '6px', fontSize: '11px', py: 0.5 }}
                    >
                      AI Assist
                    </Button>
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>
          ))}

          {/* Add Section Button */}
          {!isReadOnly && (
            <Button
              startIcon={<AddIcon />}
              variant="outlined"
              size="small"
              onClick={handleAddSection}
              sx={{
                textTransform: 'none',
                borderRadius: '8px',
                borderColor: 'var(--accent-secondary)',
                color: 'var(--accent-secondary)',
                fontWeight: 600,
                py: 1,
                mb: 3,
                '&:hover': {
                  borderColor: 'var(--accent-primary)',
                  bgcolor: 'rgba(99, 102, 241, 0.05)'
                }
              }}
            >
              Add Custom Section
            </Button>
          )}
          {/* Floating Preview Toggle Button */}
          <Tooltip title={showPreview ? 'Hide Preview' : 'Show Preview'} placement="top">
            <Button
              variant="contained"
              onClick={() => setShowPreview(prev => !prev)}
              startIcon={showPreview ? <VisibilityOffIcon /> : <VisibilityIcon />}
              sx={{
                position: 'sticky',
                bottom: 16,
                alignSelf: 'center',
                mt: 2,
                zIndex: 10,
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '13px',
                borderRadius: '24px',
                px: 3,
                py: 1,
                background: showPreview
                  ? 'linear-gradient(135deg, #6366f1, #8a2be2)'
                  : 'linear-gradient(135deg, #10b981, #059669)',
                boxShadow: '0 4px 20px rgba(99, 102, 241, 0.35)',
                '&:hover': {
                  background: showPreview
                    ? 'linear-gradient(135deg, #4f46e5, #7c3aed)'
                    : 'linear-gradient(135deg, #059669, #047857)',
                  boxShadow: '0 6px 24px rgba(99, 102, 241, 0.5)',
                }
              }}
            >
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </Button>
          </Tooltip>
        </Grid>

        {/* Right Column: Live Compiled Preview */}
        {showPreview && (
        <Grid
          className="proposal-editor-preview-container"
          size={{ xs: 12, md: 7 }}
          sx={{
            display: 'flex',
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
              boxSizing: 'border-box',
              gap: '24px'
            }}
          >
            {/* ── Hidden Measurement Container ─────────────────────────────── */}
            <Box
              ref={measurementRef}
              sx={{
                position: 'absolute',
                left: '-9999px',
                top: '-9999px',
                width: '674px',
                visibility: 'hidden',
                pointerEvents: 'none'
              }}
            >
              {renderBlock('title', 'title')}
              {renderBlock('team-info', 'team-info')}
              {(proposalData.sectionsList || []).map((section) =>
                renderBlock('section', `section-${section.id}`)
              )}
              {renderBlock('attachments', 'attachments')}
            </Box>

            {/* ── Paginated A4 Page Preview Sheets ──────────────────────────── */}
            {paginatedPages.map((pageBlocks, pageIdx) => (
              <Paper
                key={pageIdx}
                className="proposal-editor-paper"
                elevation={4}
                sx={{
                  width: '210mm',
                  height: '297mm',
                  minHeight: '297mm',
                  maxHeight: '297mm',
                  backgroundColor: '#ffffff',
                  borderRadius: '4px',
                  color: '#000000',
                  p: '50px 60px',
                  boxSizing: 'border-box',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
                  position: 'relative',
                  flexShrink: 0,
                  overflow: 'hidden'
                }}
              >
                {pageBlocks.map((block) => renderBlock(block.type, block.id))}

                {/* Page Footer */}
                <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, bgcolor: '#fff', px: '60px', pt: '8px', pb: '20px', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0' }}>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '10px' }}>
                    {proposalData.projectTitle || 'Untitled Project'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b', fontSize: '10px', fontWeight: 600 }}>
                    Page {pageIdx + 1} of {paginatedPages.length}
                  </Typography>
                </Box>
              </Paper>
            ))}

            {/* Bottom Action bar */}
            <Box
              className="no-print"
              sx={{
                width: '100%',
                maxWidth: '800px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 1.5,
                py: 2,
                px: 3,
                border: '1px solid var(--border-color)',
                background: 'rgba(18, 18, 23, 0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: '10px',
                boxShadow: '0 -6px 24px rgba(0, 0, 0, 0.4)',
                mt: 2,
                mb: 3,
                alignSelf: 'center'
              }}
            >
              {/* Save */}
              <Button
                variant="text"
                startIcon={<SaveIcon />}
                onClick={handleManualSaveAction}
                disabled={isReadOnly}
                sx={{
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 600,
                  textTransform: 'none',
                  px: 2,
                  borderRadius: '6px',
                  '&:hover': { color: 'var(--accent-secondary)', background: 'rgba(255,255,255,0.02)' }
                }}
              >
                Save
              </Button>
              <Typography sx={{ color: 'rgba(255,255,255,0.15)', userSelect: 'none' }}>|</Typography>

              {/* Export PDF */}
              <Button
                variant="text"
                startIcon={<PictureAsPdfIcon />}
                onClick={handleExportPDF}
                sx={{
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 600,
                  textTransform: 'none',
                  px: 2,
                  borderRadius: '6px',
                  '&:hover': { color: 'var(--accent-secondary)', background: 'rgba(255,255,255,0.02)' }
                }}
              >
                Export PDF
              </Button>
              <Typography sx={{ color: 'rgba(255,255,255,0.15)', userSelect: 'none' }}>|</Typography>

              {/* Print */}
              <Button
                variant="text"
                startIcon={<PrintIcon />}
                onClick={() => window.print()}
                sx={{
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 600,
                  textTransform: 'none',
                  px: 2,
                  borderRadius: '6px',
                  '&:hover': { color: 'var(--accent-secondary)', background: 'rgba(255,255,255,0.02)' }
                }}
              >
                Print
              </Button>
              <Typography sx={{ color: 'rgba(255,255,255,0.15)', userSelect: 'none' }}>|</Typography>

              {/* Share */}
              <Button
                variant="text"
                startIcon={<ShareIcon />}
                onClick={handleShare}
                sx={{
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 600,
                  textTransform: 'none',
                  px: 2,
                  borderRadius: '6px',
                  '&:hover': { color: 'var(--accent-secondary)', background: 'rgba(255,255,255,0.02)' }
                }}
              >
                Share
              </Button>
            </Box>
          </Box>
        </Grid>
        )}
      </Grid>

      {/* Attach Link Dialog */}
      <Dialog
        open={attachmentDialog.open}
        onClose={() => setAttachmentDialog({ open: false, key: '', label: '', url: '' })}
        slotProps={{
          paper: {
            sx: {
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              width: 380
            }
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: '15px', color: '#fff' }}>
          Link Resource: {attachmentDialog.label}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            autoFocus
            label="Resource URL"
            placeholder="e.g. google.com/sheets..."
            fullWidth
            size="small"
            value={attachmentDialog.url}
            onChange={(e) => setAttachmentDialog(prev => ({ ...prev, url: e.target.value }))}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid var(--border-color)' }}>
          <Button onClick={() => setAttachmentDialog({ open: false, key: '', label: '', url: '' })} color="inherit" sx={{ textTransform: 'none', fontSize: '13px' }}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveAttachment}
            variant="contained"
            sx={{
              textTransform: 'none',
              fontSize: '13px',
              background: 'var(--accent-primary)',
              '&:hover': { background: 'var(--accent-secondary)' }
            }}
          >
            Attach Link
          </Button>
        </DialogActions>
      </Dialog>

      {/* Feedback Toast */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%', borderRadius: '8px' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );

  function handleCloseSnackbar() {
    setSnackbar(prev => ({ ...prev, open: false }));
  }
};

export default ProposalEditor;
