import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Grid, Typography, TextField, Button, IconButton, Card, CardContent,
  Dialog, DialogTitle, DialogContent, DialogActions, LinearProgress, Paper, MenuItem,
  Snackbar, Alert, Tooltip, Accordion, AccordionSummary, AccordionDetails, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Checkbox, Slider
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SaveIcon from '@mui/icons-material/Save';
import PrintIcon from '@mui/icons-material/Print';
import ShareIcon from '@mui/icons-material/Share';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import LinkIcon from '@mui/icons-material/Link';
import LaunchIcon from '@mui/icons-material/Launch';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

import { useSocket } from '../contexts/SocketContext';
import { documentService } from '../services/documentService';
import vardhamanLogo from '../assets/images/vardhaman_logo.png';
import logo25Years from '../assets/images/25years_logo.png';

const DEFAULT_SECTIONS = [
  {
    id: 'introduction',
    label: 'Introduction',
    content: ''
  },
  {
    id: 'proposedMethodology',
    label: 'Proposed Methodology',
    content: ''
  },
  {
    id: 'objectives',
    label: 'Objectives',
    content: '',
    listItems: []
  },
  {
    id: 'implementation',
    label: 'Implementation',
    content: '',
    blockDiagramItems: [],
    workingPrinciple: '',
    softwareTools: []
  },
  {
    id: 'resultsAndDiscussion',
    label: 'Results and Discussion',
    content: '',
    resultsIntro: '',
    figures: [],
    discussionContent: ''
  },
  {
    id: 'poMapping',
    label: 'Program Outcomes (POs) Mapping',
    poRows: [],
    sdgRows: []
  },
  {
    id: 'conclusion',
    label: 'Conclusion',
    content: ''
  },
  {
    id: 'bibliography',
    label: 'Bibliography',
    content: '',
    bibItems: []
  }
];

// Stateful image renderer that handles placeholder fallbacks gracefully
const FigureImage = ({ imageUrl, alt, height = '180px', width = '85%' }) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [imageUrl]);

  const hasImage = imageUrl && !failed;

  return (
    <Box sx={{
      width: width,
      height: height,
      border: hasImage ? 'none' : '1px solid #aaa',
      background: hasImage ? 'transparent' : '#f5f5f5',
      borderRadius: '4px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      color: '#666',
      p: hasImage ? 0 : 2,
      boxSizing: 'border-box'
    }}>
      {hasImage ? (
        <img
          src={imageUrl.startsWith('http') || imageUrl.startsWith('data:') ? imageUrl : `/assets/placeholders/${imageUrl}`}
          alt={alt}
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
          onError={() => setFailed(true)}
        />
      ) : (
        <Box className="image-fallback" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ color: '#aaa', fontWeight: 700, fontSize: '16px' }}>IMAGE PLACEHOLDER</Typography>
          <Typography variant="caption" sx={{ color: '#bbb' }}>[ {imageUrl || 'op1.png'} ]</Typography>
        </Box>
      )}
    </Box>
  );
};

const splitIntoParagraphs = (text, maxLength = 800) => {
  if (!text) return [];
  const lines = text.split('\n').map(p => p.trim()).filter(p => p.length > 0);
  const result = [];

  lines.forEach(line => {
    if (line.length <= maxLength) {
      result.push(line);
    } else {
      const sentences = line.match(/[^.!?]+[.!?]+(?:\s+|$)/g) || [line];
      let currentGroup = '';
      
      sentences.forEach(sentence => {
        const trimmed = sentence.trim();
        if (!trimmed) return;
        
        if ((currentGroup + ' ' + trimmed).length > maxLength && currentGroup.length > 0) {
          result.push(currentGroup.trim());
          currentGroup = trimmed;
        } else {
          currentGroup = currentGroup ? currentGroup + ' ' + trimmed : trimmed;
        }
      });
      
      if (currentGroup.trim()) {
        result.push(currentGroup.trim());
      }
    }
  });

  return result;
};

const renderSectionImageBlock = (imageUrl, caption, height = '180px', width = '85%') => {
  let displayImageUrl = imageUrl;
  let displayCaption = caption;

  const isUrl = (str) => {
    if (!str) return false;
    return str.startsWith('http://') || str.startsWith('https://') || str.startsWith('data:');
  };

  if (isUrl(caption) && !isUrl(imageUrl)) {
    displayImageUrl = caption;
    displayCaption = imageUrl;
  }

  if (!displayImageUrl) return null;
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: '12px', width: '100%' }}>
      <FigureImage imageUrl={displayImageUrl} alt={displayCaption || 'Section Image'} height={height} width={width} />
      {displayCaption && (
        <Typography variant="caption" sx={{ mt: '8px', color: '#111', fontStyle: 'italic', fontFamily: 'serif', textAlign: 'center', width: '90%' }}>
          {displayCaption}
        </Typography>
      )}
    </Box>
  );
};

const getMeasurementBlocks = (reportData) => {
  const blocks = [];
  if (!reportData) return blocks;

  // 1. Introduction
  const introSec = (reportData.sectionsList || []).find(s => s.id === 'introduction') || {};
  const introParas = splitIntoParagraphs(introSec.content || '');
  if (introParas.length === 0) introParas.push('Add Introduction content...');
  blocks.push({
    id: 'intro_header',
    type: 'introduction_header_first_para',
    paraIndex: 0
  });
  for (let i = 1; i < introParas.length; i++) {
    blocks.push({
      id: `intro_para_${i}`,
      type: 'introduction_para',
      paraIndex: i
    });
  }
  if (introSec.imageUrl) {
    blocks.push({
      id: 'intro_image',
      type: 'introduction_image'
    });
  }

  // 2. Proposed Methodology
  const methodSec = (reportData.sectionsList || []).find(s => s.id === 'proposedMethodology') || {};
  const methodParas = splitIntoParagraphs(methodSec.content || '');
  if (methodParas.length === 0) methodParas.push('Add Proposed Methodology content...');
  blocks.push({
    id: 'methodology_header',
    type: 'proposedMethodology_header_first_para',
    paraIndex: 0
  });
  for (let i = 1; i < methodParas.length; i++) {
    blocks.push({
      id: `methodology_para_${i}`,
      type: 'proposedMethodology_para',
      paraIndex: i
    });
  }
  if (methodSec.imageUrl) {
    blocks.push({
      id: 'methodology_image',
      type: 'proposedMethodology_image'
    });
  }

  // 3. Objectives
  const objSec = (reportData.sectionsList || []).find(s => s.id === 'objectives') || {};
  const objItems = objSec.listItems || [];
  blocks.push({
    id: 'objectives_header',
    type: 'objectives_header_content'
  });
  objItems.forEach((item, idx) => {
    blocks.push({
      id: `objectives_item_${idx}`,
      type: 'objectives_item',
      itemIndex: idx
    });
  });
  if (objSec.imageUrl) {
    blocks.push({
      id: 'objectives_image',
      type: 'objectives_image'
    });
  }

  // 4. Implementation
  const implSec = (reportData.sectionsList || []).find(s => s.id === 'implementation') || {};
  blocks.push({
    id: 'implementation_header',
    type: 'implementation_header'
  });
  // 4.1 Block Diagram
  blocks.push({
    id: 'impl_bd_header',
    type: 'implementation_block_diagram_header'
  });
  (implSec.blockDiagramItems || []).forEach((item, idx) => {
    blocks.push({
      id: `impl_bd_item_${idx}`,
      type: 'implementation_block_diagram_item',
      itemIndex: idx
    });
  });
  // 4.2 Working Principle
  const wpParas = splitIntoParagraphs(implSec.workingPrinciple || '');
  if (wpParas.length === 0) wpParas.push('Add working principle details...');
  blocks.push({
    id: 'impl_wp_header',
    type: 'implementation_working_principle_header',
    paraIndex: 0
  });
  for (let i = 1; i < wpParas.length; i++) {
    blocks.push({
      id: `impl_wp_para_${i}`,
      type: 'implementation_working_principle_para',
      paraIndex: i
    });
  }
  // 4.3 Software Implementation
  blocks.push({
    id: 'impl_soft_header',
    type: 'implementation_software_header'
  });
  (implSec.softwareTools || []).forEach((item, idx) => {
    blocks.push({
      id: `impl_soft_item_${idx}`,
      type: 'implementation_software_item',
      itemIndex: idx
    });
  });
  if (implSec.imageUrl) {
    blocks.push({
      id: 'implementation_image',
      type: 'implementation_image'
    });
  }

  // 5. Results and Discussion
  const resSec = (reportData.sectionsList || []).find(s => s.id === 'resultsAndDiscussion') || {};
  const resParas = splitIntoParagraphs(resSec.resultsIntro || '');
  if (resParas.length === 0) resParas.push('Add results intro details...');
  blocks.push({
    id: 'results_header',
    type: 'resultsAndDiscussion_header_first_para',
    paraIndex: 0
  });
  for (let i = 1; i < resParas.length; i++) {
    blocks.push({
      id: `results_para_${i}`,
      type: 'resultsAndDiscussion_para',
      paraIndex: i
    });
  }
  // 5.1 Results (Figures)
  blocks.push({
    id: 'results_res_header',
    type: 'resultsAndDiscussion_results_header'
  });
  (resSec.figures || []).forEach((fig, idx) => {
    blocks.push({
      id: `results_fig_${idx}`,
      type: 'resultsAndDiscussion_figure',
      figureIndex: idx
    });
  });
  // 5.2 Discussion
  const discParas = splitIntoParagraphs(resSec.discussionContent || '');
  if (discParas.length === 0) discParas.push('Add discussion details...');
  blocks.push({
    id: 'results_disc_header',
    type: 'resultsAndDiscussion_discussion_header',
    paraIndex: 0
  });
  for (let i = 1; i < discParas.length; i++) {
    blocks.push({
      id: `results_disc_para_${i}`,
      type: 'resultsAndDiscussion_discussion_para',
      paraIndex: i
    });
  }
  if (resSec.imageUrl) {
    blocks.push({
      id: 'results_image',
      type: 'resultsAndDiscussion_image'
    });
  }

  // 6. Program Outcomes (POs) Mapping
  blocks.push({
    id: 'po_header',
    type: 'poMapping_header'
  });
  blocks.push({
    id: 'po_tables',
    type: 'poMapping_tables'
  });
  const poSec = (reportData.sectionsList || []).find(s => s.id === 'poMapping') || {};
  if (poSec.imageUrl) {
    blocks.push({
      id: 'po_image',
      type: 'poMapping_image'
    });
  }

  // 7. Conclusion
  const conclSec = (reportData.sectionsList || []).find(s => s.id === 'conclusion') || {};
  const conclParas = splitIntoParagraphs(conclSec.content || '');
  if (conclParas.length === 0) conclParas.push('Add Conclusion content...');
  blocks.push({
    id: 'conclusion_header',
    type: 'conclusion_header_first_para',
    paraIndex: 0
  });
  for (let i = 1; i < conclParas.length; i++) {
    blocks.push({
      id: `conclusion_para_${i}`,
      type: 'conclusion_para',
      paraIndex: i
    });
  }
  if (conclSec.imageUrl) {
    blocks.push({
      id: 'conclusion_image',
      type: 'conclusion_image'
    });
  }

  // Bibliography
  const bibSec = (reportData.sectionsList || []).find(s => s.id === 'bibliography') || {};
  const bibItems = bibSec.bibItems || [];
  if (bibItems.length === 0) {
    blocks.push({
      id: 'bib_header',
      type: 'bibliography_header_first_item',
      itemIndex: -1
    });
  } else {
    blocks.push({
      id: 'bib_header',
      type: 'bibliography_header_first_item',
      itemIndex: 0
    });
    for (let i = 1; i < bibItems.length; i++) {
      blocks.push({
        id: `bib_item_${i}`,
        type: 'bibliography_item',
        itemIndex: i
      });
    }
  }
  if (bibSec.imageUrl) {
    blocks.push({
      id: 'bibliography_image',
      type: 'bibliography_image'
    });
  }

  return blocks;
};

export const CollegeReportEditor = ({
  documentId,
  userRole,
  initialReportData = {},
  restoreContent,
  onSelectionChange,
}) => {
  const { socket } = useSocket();
  const saveTimeoutRef = useRef(null);

  // Helper to merge report data defensively
  const mergeReportData = (incoming, fallback = {}) => {
    const defaultData = {
      collegeName: 'Vardhaman College of Engineering',
      projectTitle: 'Containerized Application Deployment Using Kubernetes',
      courseCodeName: 'A8524 - Cloud Computing and Virtualization Laboratory',
      submittedBy: [
        { name: 'N. Srijith', roll: '24885A0549' },
        { name: 'C. Sujal', roll: '24881A0551' },
        { name: 'D. Stevenson', roll: '24885A0553' }
      ],
      courseFacilitator: 'Dr. Ch. Madhurya',
      courseFacilitatorDesignation: 'Assistant Professor',
      hodName: 'Dr. Gagandeep Arora',
      hodDesignation: 'HOD, CSE',
      departmentName: 'DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING',
      academicYear: '2025--26',
      monthYear: 'March 2025',
      logoUrl: '',
      logo25YrsUrl: '',
      abstract: 'Containerization is a modern approach that enables applications to run consistently across different environments by packaging them with all required dependencies. Tools like Docker simplify this process, but managing multiple containers becomes challenging as the system grows. This project focuses on deploying containerized applications using Kubernetes, which provides automated management, scaling, and monitoring of containers. The system demonstrates how applications can be efficiently deployed in a cluster using Kubernetes components such as Pods, Deployments, and Services. It also highlights key features like load balancing, auto-scaling, and self-healing, ensuring high availability and reliability of applications. The proposed solution improves resource utilization and reduces manual effort in managing containers. Overall, this project showcases an efficient and scalable approach for application deployment, aligning with current industry practices in cloud and DevOps environments.',
      keywords: 'Containerization, Docker, Kubernetes, Container Orchestration, Application Deployment, Pods, Deployments, Services, Cluster Management, Load Balancing, Auto Scaling, Self-Healing, Cloud Computing, DevOps, Scalability, High Availability, Resource Utilization, Distributed Systems, Microservices Architecture, Continuous Deployment',
      sectionsList: DEFAULT_SECTIONS
    };

    if (!incoming) return defaultData;

    return {
      collegeName: incoming.collegeName !== undefined ? incoming.collegeName : (fallback.collegeName || defaultData.collegeName),
      projectTitle: incoming.projectTitle !== undefined ? incoming.projectTitle : (fallback.projectTitle || defaultData.projectTitle),
      courseCodeName: incoming.courseCodeName !== undefined ? incoming.courseCodeName : (fallback.courseCodeName || defaultData.courseCodeName),
      submittedBy: incoming.submittedBy !== undefined ? incoming.submittedBy : (fallback.submittedBy || defaultData.submittedBy),
      courseFacilitator: incoming.courseFacilitator !== undefined ? incoming.courseFacilitator : (fallback.courseFacilitator || defaultData.courseFacilitator),
      courseFacilitatorDesignation: incoming.courseFacilitatorDesignation !== undefined ? incoming.courseFacilitatorDesignation : (fallback.courseFacilitatorDesignation || defaultData.courseFacilitatorDesignation),
      hodName: incoming.hodName !== undefined ? incoming.hodName : (fallback.hodName || defaultData.hodName),
      hodDesignation: incoming.hodDesignation !== undefined ? incoming.hodDesignation : (fallback.hodDesignation || defaultData.hodDesignation),
      departmentName: incoming.departmentName !== undefined ? incoming.departmentName : (fallback.departmentName || defaultData.departmentName),
      academicYear: incoming.academicYear !== undefined ? incoming.academicYear : (fallback.academicYear || defaultData.academicYear),
      monthYear: incoming.monthYear !== undefined ? incoming.monthYear : (fallback.monthYear || defaultData.monthYear),
      logoUrl: incoming.logoUrl !== undefined ? incoming.logoUrl : (fallback.logoUrl || defaultData.logoUrl),
      logo25YrsUrl: incoming.logo25YrsUrl !== undefined ? incoming.logo25YrsUrl : (fallback.logo25YrsUrl || defaultData.logo25YrsUrl),
      abstract: incoming.abstract !== undefined ? incoming.abstract : (fallback.abstract || defaultData.abstract),
      keywords: incoming.keywords !== undefined ? incoming.keywords : (fallback.keywords || defaultData.keywords),
      sectionsList: incoming.sectionsList !== undefined ? incoming.sectionsList : (fallback.sectionsList || defaultData.sectionsList)
    };
  };

  // State
  const [reportData, setReportData] = useState(() => mergeReportData(initialReportData));
  const [activeSection, setActiveSection] = useState('metadata');
  const [expanded, setExpanded] = useState('metadata');
  const [lastSaved, setLastSaved] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [paginatedPages, setPaginatedPages] = useState([]);
  const [tocPageNumbers, setTocPageNumbers] = useState({});
  const [showPreview, setShowPreview] = useState(true);
  const [zoom, setZoom] = useState(0.78);
  const [currentPage, setCurrentPage] = useState(1);

  const measurementRef = useRef(null);
  const previewContainerRef = useRef(null);
  const isReadOnly = userRole === 'VIEWER';

  const totalPages = 4 + (paginatedPages || []).length;

  const scrollToPage = (pageIndex) => {
    const container = previewContainerRef.current;
    if (!container) return;
    const paperElements = container.querySelectorAll('.college-report-editor-paper');
    if (paperElements[pageIndex]) {
      const containerRect = container.getBoundingClientRect();
      const paperRect = paperElements[pageIndex].getBoundingClientRect();
      const relativeTop = paperRect.top - containerRect.top + container.scrollTop;
      const scrollTarget = relativeTop - 48 - 16;
      container.scrollTo({ top: scrollTarget, behavior: 'smooth' });
      setCurrentPage(pageIndex + 1);
    }
  };

  const handlePreviewScroll = useCallback((e) => {
    const container = e.currentTarget;
    const paperElements = container.querySelectorAll('.college-report-editor-paper');
    if (paperElements.length === 0) return;

    let activePage = 1;
    let minDiff = Infinity;
    const containerRect = container.getBoundingClientRect();
    const toolbarOffset = 48 + 16;

    paperElements.forEach((p, idx) => {
      const paperRect = p.getBoundingClientRect();
      const diff = Math.abs(paperRect.top - containerRect.top - toolbarOffset);
      if (diff < minDiff) {
        minDiff = diff;
        activePage = idx + 1;
      }
    });

    setCurrentPage(activePage);
  }, []);

  // Autocomplete templates based on selected college
  const handleCollegeChange = (value) => {
    let updated = { ...reportData, collegeName: value };
    if (value === 'Vardhaman College of Engineering') {
      updated.departmentName = 'DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING';
      updated.hodName = 'Dr. Gagandeep Arora';
      updated.hodDesignation = 'HOD, CSE';
      updated.courseFacilitator = 'Dr. Ch. Madhurya';
      updated.courseFacilitatorDesignation = 'Assistant Professor';
    }
    triggerUpdate(updated);
  };

  // Unified block renderer for measuring heights and distributing content
  const renderBlock = useCallback((type, blockId, extraData = {}) => {
    if (type === 'introduction_header_first_para') {
      const sec = (reportData.sectionsList || []).find(s => s.id === 'introduction');
      if (!sec) return null;
      const paragraphs = splitIntoParagraphs(sec.content || '');
      const firstPara = paragraphs[0] || 'Add Introduction content...';
      return (
        <Box key={blockId} data-block-id={blockId} data-block-type="introduction_header_first_para" sx={{ pb: '12px' }}>
          <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 700, color: '#000', borderBottom: '1px solid #000', pb: '4px', mb: '12px', textTransform: 'uppercase', fontFamily: 'serif' }}>
            1. Introduction
          </Typography>
          <Typography sx={{ fontSize: '13px', lineHeight: 1.8, color: '#111', textIndent: '24px', textAlign: 'justify', fontFamily: 'serif' }}>
            {firstPara}
          </Typography>
        </Box>
      );
    }

    if (type === 'introduction_para') {
      const sec = (reportData.sectionsList || []).find(s => s.id === 'introduction');
      if (!sec) return null;
      const paragraphs = splitIntoParagraphs(sec.content || '');
      const pIdx = extraData?.paraIndex || 0;
      const paraText = paragraphs[pIdx];
      if (!paraText) return null;
      return (
        <Box key={blockId} data-block-id={blockId} data-block-type="introduction_para" sx={{ pb: '12px' }}>
          <Typography sx={{ fontSize: '13px', lineHeight: 1.8, color: '#111', textIndent: '24px', textAlign: 'justify', fontFamily: 'serif' }}>
            {paraText}
          </Typography>
        </Box>
      );
    }

    if (type === 'proposedMethodology_header_first_para') {
      const sec = (reportData.sectionsList || []).find(s => s.id === 'proposedMethodology');
      if (!sec) return null;
      const paragraphs = splitIntoParagraphs(sec.content || '');
      const firstPara = paragraphs[0] || 'Add Proposed Methodology content...';
      return (
        <Box key={blockId} data-block-id={blockId} data-block-type="proposedMethodology_header_first_para" sx={{ pb: '12px' }}>
          <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 700, color: '#000', borderBottom: '1px solid #000', pb: '4px', mb: '12px', textTransform: 'uppercase', fontFamily: 'serif' }}>
            2. Proposed Methodology
          </Typography>
          <Typography sx={{ fontSize: '13px', lineHeight: 1.8, color: '#111', textIndent: '24px', textAlign: 'justify', fontFamily: 'serif' }}>
            {firstPara}
          </Typography>
        </Box>
      );
    }

    if (type === 'proposedMethodology_para') {
      const sec = (reportData.sectionsList || []).find(s => s.id === 'proposedMethodology');
      if (!sec) return null;
      const paragraphs = splitIntoParagraphs(sec.content || '');
      const pIdx = extraData?.paraIndex || 0;
      const paraText = paragraphs[pIdx];
      if (!paraText) return null;
      return (
        <Box key={blockId} data-block-id={blockId} data-block-type="proposedMethodology_para" sx={{ pb: '12px' }}>
          <Typography sx={{ fontSize: '13px', lineHeight: 1.8, color: '#111', textIndent: '24px', textAlign: 'justify', fontFamily: 'serif' }}>
            {paraText}
          </Typography>
        </Box>
      );
    }

    if (type === 'objectives_header_content') {
      const sec = (reportData.sectionsList || []).find(s => s.id === 'objectives');
      if (!sec) return null;
      return (
        <Box key={blockId} data-block-id={blockId} data-block-type="objectives_header_content" sx={{ pb: '8px' }}>
          <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 700, color: '#000', borderBottom: '1px solid #000', pb: '4px', mb: '12px', textTransform: 'uppercase', fontFamily: 'serif' }}>
            3. Objectives
          </Typography>
          {sec.content && (
            <Typography sx={{ fontSize: '13px', lineHeight: 1.8, color: '#111', mb: '8px', fontFamily: 'serif' }}>
              {sec.content}
            </Typography>
          )}
        </Box>
      );
    }

    if (type === 'objectives_item') {
      const sec = (reportData.sectionsList || []).find(s => s.id === 'objectives');
      if (!sec) return null;
      const items = sec.listItems || [];
      const itemIdx = extraData?.itemIndex || 0;
      const itemText = items[itemIdx];
      if (!itemText) return null;
      return (
        <Box key={blockId} data-block-id={blockId} data-block-type="objectives_item" sx={{ pl: '24px', pb: '6px' }}>
          <Box component="ul" sx={{ m: 0, p: 0 }}>
            <Box component="li" sx={{ fontSize: '13px', lineHeight: 1.8, color: '#111', fontFamily: 'serif', textAlign: 'justify' }}>
              {itemText}
            </Box>
          </Box>
        </Box>
      );
    }

    if (type === 'implementation_header') {
      return (
        <Box key={blockId} data-block-id={blockId} data-block-type="implementation_header" sx={{ pb: '8px' }}>
          <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 700, color: '#000', borderBottom: '1px solid #000', pb: '4px', mb: '12px', textTransform: 'uppercase', fontFamily: 'serif' }}>
            4. Implementation
          </Typography>
        </Box>
      );
    }

    if (type === 'implementation_block_diagram_header') {
      return (
        <Box key={blockId} data-block-id={blockId} data-block-type="implementation_block_diagram_header" sx={{ pb: '6px' }}>
          <Typography variant="subtitle2" sx={{ fontSize: '14px', fontWeight: 700, color: '#000', mb: '6px', fontFamily: 'serif' }}>
            4.1 Block Diagram
          </Typography>
        </Box>
      );
    }

    if (type === 'implementation_block_diagram_item') {
      const sec = (reportData.sectionsList || []).find(s => s.id === 'implementation');
      if (!sec) return null;
      const items = sec.blockDiagramItems || [];
      const itemIdx = extraData?.itemIndex || 0;
      const itemText = items[itemIdx];
      if (!itemText) return null;
      return (
        <Box key={blockId} data-block-id={blockId} data-block-type="implementation_block_diagram_item" sx={{ pl: '24px', pb: '4px' }}>
          <Box component="ol" sx={{ m: 0, p: 0 }}>
            <Box component="li" value={itemIdx + 1} sx={{ fontSize: '13px', lineHeight: 1.8, color: '#111', fontFamily: 'serif' }}>
              {itemText}
            </Box>
          </Box>
        </Box>
      );
    }

    if (type === 'implementation_working_principle_header') {
      const sec = (reportData.sectionsList || []).find(s => s.id === 'implementation');
      if (!sec) return null;
      const paragraphs = splitIntoParagraphs(sec.workingPrinciple || '');
      const firstPara = paragraphs[0] || 'Add working principle details...';
      return (
        <Box key={blockId} data-block-id={blockId} data-block-type="implementation_working_principle_header" sx={{ pb: '12px', mt: '12px' }}>
          <Typography variant="subtitle2" sx={{ fontSize: '14px', fontWeight: 700, color: '#000', mb: '6px', fontFamily: 'serif' }}>
            4.2 Working Principle
          </Typography>
          <Typography sx={{ fontSize: '13px', lineHeight: 1.8, color: '#111', textAlign: 'justify', fontFamily: 'serif' }}>
            {firstPara}
          </Typography>
        </Box>
      );
    }

    if (type === 'implementation_working_principle_para') {
      const sec = (reportData.sectionsList || []).find(s => s.id === 'implementation');
      if (!sec) return null;
      const paragraphs = splitIntoParagraphs(sec.workingPrinciple || '');
      const pIdx = extraData?.paraIndex || 0;
      const paraText = paragraphs[pIdx];
      if (!paraText) return null;
      return (
        <Box key={blockId} data-block-id={blockId} data-block-type="implementation_working_principle_para" sx={{ pb: '12px' }}>
          <Typography sx={{ fontSize: '13px', lineHeight: 1.8, color: '#111', textAlign: 'justify', fontFamily: 'serif' }}>
            {paraText}
          </Typography>
        </Box>
      );
    }

    if (type === 'implementation_software_header') {
      return (
        <Box key={blockId} data-block-id={blockId} data-block-type="implementation_software_header" sx={{ pb: '6px', mt: '12px' }}>
          <Typography variant="subtitle2" sx={{ fontSize: '14px', fontWeight: 700, color: '#000', mb: '6px', fontFamily: 'serif' }}>
            4.3 Software Implementation
          </Typography>
        </Box>
      );
    }

    if (type === 'implementation_software_item') {
      const sec = (reportData.sectionsList || []).find(s => s.id === 'implementation');
      if (!sec) return null;
      const items = sec.softwareTools || [];
      const itemIdx = extraData?.itemIndex || 0;
      const itemText = items[itemIdx];
      if (!itemText) return null;
      return (
        <Box key={blockId} data-block-id={blockId} data-block-type="implementation_software_item" sx={{ pl: '24px', pb: '4px' }}>
          <Box component="ul" sx={{ m: 0, p: 0 }}>
            <Box component="li" sx={{ fontSize: '13px', lineHeight: 1.8, color: '#111', fontFamily: 'serif' }}>
              {itemText}
            </Box>
          </Box>
        </Box>
      );
    }

    if (type === 'resultsAndDiscussion_header_first_para') {
      const sec = (reportData.sectionsList || []).find(s => s.id === 'resultsAndDiscussion');
      if (!sec) return null;
      const paragraphs = splitIntoParagraphs(sec.resultsIntro || '');
      const firstPara = paragraphs[0] || 'Add results intro details...';
      return (
        <Box key={blockId} data-block-id={blockId} data-block-type="resultsAndDiscussion_header_first_para" sx={{ pb: '12px' }}>
          <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 700, color: '#000', borderBottom: '1px solid #000', pb: '4px', mb: '12px', textTransform: 'uppercase', fontFamily: 'serif' }}>
            5. Results and Discussion
          </Typography>
          <Typography sx={{ fontSize: '13px', lineHeight: 1.8, color: '#111', textAlign: 'justify', fontFamily: 'serif' }}>
            {firstPara}
          </Typography>
        </Box>
      );
    }

    if (type === 'resultsAndDiscussion_para') {
      const sec = (reportData.sectionsList || []).find(s => s.id === 'resultsAndDiscussion');
      if (!sec) return null;
      const paragraphs = splitIntoParagraphs(sec.resultsIntro || '');
      const pIdx = extraData?.paraIndex || 0;
      const paraText = paragraphs[pIdx];
      if (!paraText) return null;
      return (
        <Box key={blockId} data-block-id={blockId} data-block-type="resultsAndDiscussion_para" sx={{ pb: '12px' }}>
          <Typography sx={{ fontSize: '13px', lineHeight: 1.8, color: '#111', textAlign: 'justify', fontFamily: 'serif' }}>
            {paraText}
          </Typography>
        </Box>
      );
    }

    if (type === 'resultsAndDiscussion_results_header') {
      return (
        <Box key={blockId} data-block-id={blockId} data-block-type="resultsAndDiscussion_results_header" sx={{ pb: '6px', mt: '12px' }}>
          <Typography variant="subtitle2" sx={{ fontSize: '14px', fontWeight: 700, color: '#000', mb: '6px', fontFamily: 'serif' }}>
            5.1 Results
          </Typography>
        </Box>
      );
    }

    if (type === 'resultsAndDiscussion_figure') {
      const sec = (reportData.sectionsList || []).find(s => s.id === 'resultsAndDiscussion');
      if (!sec) return null;
      const figures = sec.figures || [];
      const figIdx = extraData?.figureIndex || 0;
      const fig = figures[figIdx];
      if (!fig) return null;

      let displayImageUrl = fig.imageUrl;
      let displayCaption = fig.caption;

      const isUrl = (str) => {
        if (!str) return false;
        return str.startsWith('http://') || str.startsWith('https://') || str.startsWith('data:');
      };

      if (isUrl(fig.caption) && !isUrl(fig.imageUrl)) {
        displayImageUrl = fig.caption;
        displayCaption = fig.imageUrl;
      }

      return (
        <Box key={blockId} data-block-id={blockId} data-block-type="resultsAndDiscussion_figure" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: '12px', width: '100%' }}>
          <FigureImage imageUrl={displayImageUrl} alt={displayCaption} height={fig.imageHeight} width={fig.imageWidth} />
          <Typography variant="caption" sx={{ mt: '8px', color: '#111', fontStyle: 'italic', fontFamily: 'serif', textAlign: 'center', width: '90%' }}>
            Figure {figIdx + 1}: {displayCaption}
          </Typography>
        </Box>
      );
    }

    if (type === 'resultsAndDiscussion_discussion_header') {
      const sec = (reportData.sectionsList || []).find(s => s.id === 'resultsAndDiscussion');
      if (!sec) return null;
      const paragraphs = splitIntoParagraphs(sec.discussionContent || '');
      const firstPara = paragraphs[0] || 'Add discussion details...';
      return (
        <Box key={blockId} data-block-id={blockId} data-block-type="resultsAndDiscussion_discussion_header" sx={{ pb: '12px', mt: '12px' }}>
          <Typography variant="subtitle2" sx={{ fontSize: '14px', fontWeight: 700, color: '#000', mb: '6px', fontFamily: 'serif' }}>
            5.2 Discussion
          </Typography>
          <Typography sx={{ fontSize: '13px', lineHeight: 1.8, color: '#111', textAlign: 'justify', fontFamily: 'serif' }}>
            {firstPara}
          </Typography>
        </Box>
      );
    }

    if (type === 'resultsAndDiscussion_discussion_para') {
      const sec = (reportData.sectionsList || []).find(s => s.id === 'resultsAndDiscussion');
      if (!sec) return null;
      const paragraphs = splitIntoParagraphs(sec.discussionContent || '');
      const pIdx = extraData?.paraIndex || 0;
      const paraText = paragraphs[pIdx];
      if (!paraText) return null;
      return (
        <Box key={blockId} data-block-id={blockId} data-block-type="resultsAndDiscussion_discussion_para" sx={{ pb: '12px' }}>
          <Typography sx={{ fontSize: '13px', lineHeight: 1.8, color: '#111', textAlign: 'justify', fontFamily: 'serif' }}>
            {paraText}
          </Typography>
        </Box>
      );
    }

    if (type === 'poMapping_header') {
      return (
        <Box key={blockId} data-block-id={blockId} data-block-type="poMapping_header" sx={{ pb: '12px' }}>
          <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 700, color: '#000', borderBottom: '1px solid #000', pb: '4px', mb: '12px', textTransform: 'uppercase', fontFamily: 'serif' }}>
            6. Program Outcomes (POs) Mapping
          </Typography>
        </Box>
      );
    }

    if (type === 'poMapping_tables') {
      const sec = (reportData.sectionsList || []).find(s => s.id === 'poMapping');
      if (!sec) return null;
      return (
        <Box key={blockId} data-block-id={blockId} data-block-type="poMapping_tables">
          <Typography variant="caption" sx={{ display: 'block', mb: '8px', fontWeight: 600, color: '#333', textAlign: 'center', fontFamily: 'serif' }}>
            Table 1: Mapping of Program Outcomes (POs) to Project Relevance
          </Typography>
          <TableContainer component={Box} sx={{ border: '1px solid #000', mb: '24px' }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#eee' }}>
                <TableRow>
                  <TableCell sx={{ border: '1px solid #000', fontWeight: 700, py: '4px', px: '8px', fontSize: '11px', width: '60px', color: '#000' }}>PO No.</TableCell>
                  <TableCell sx={{ border: '1px solid #000', fontWeight: 700, py: '4px', px: '8px', fontSize: '11px', width: '150px', color: '#000' }}>Program Outcome</TableCell>
                  <TableCell sx={{ border: '1px solid #000', fontWeight: 700, py: '4px', px: '8px', fontSize: '11px', color: '#000' }}>Relevance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(sec.poRows || []).map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell sx={{ border: '1px solid #000', py: '4px', px: '8px', fontSize: '11px', fontWeight: 600, color: '#000' }}>{row.poNo}</TableCell>
                    <TableCell sx={{ border: '1px solid #000', py: '4px', px: '8px', fontSize: '11px', fontWeight: 600, color: '#000' }}>{row.outcome}</TableCell>
                    <TableCell sx={{ border: '1px solid #000', py: '4px', px: '8px', fontSize: '11px', color: '#000' }}>{row.relevance}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="caption" sx={{ display: 'block', mb: '8px', fontWeight: 600, color: '#333', textAlign: 'center', fontFamily: 'serif' }}>
            Table 2: Mapping of Sustainable Development Goals (SDGs) to Project Relevance
          </Typography>
          <TableContainer component={Box} sx={{ border: '1px solid #000' }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#eee' }}>
                <TableRow>
                  <TableCell sx={{ border: '1px solid #000', fontWeight: 700, py: '4px', px: '8px', fontSize: '11px', width: '60px', color: '#000' }}>SDG No.</TableCell>
                  <TableCell sx={{ border: '1px solid #000', fontWeight: 700, py: '4px', px: '8px', fontSize: '11px', width: '150px', color: '#000' }}>Goal</TableCell>
                  <TableCell sx={{ border: '1px solid #000', fontWeight: 700, py: '4px', px: '8px', fontSize: '11px', color: '#000' }}>Relevance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(sec.sdgRows || []).map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell sx={{ border: '1px solid #000', py: '4px', px: '8px', fontSize: '11px', fontWeight: 600, color: '#000' }}>{row.sdgNo}</TableCell>
                    <TableCell sx={{ border: '1px solid #000', py: '4px', px: '8px', fontSize: '11px', fontWeight: 600, color: '#000' }}>{row.goal}</TableCell>
                    <TableCell sx={{ border: '1px solid #000', py: '4px', px: '8px', fontSize: '11px', color: '#000' }}>{row.relevance}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      );
    }

    if (type === 'conclusion_header_first_para') {
      const sec = (reportData.sectionsList || []).find(s => s.id === 'conclusion');
      if (!sec) return null;
      const paragraphs = splitIntoParagraphs(sec.content || '');
      const firstPara = paragraphs[0] || 'Add Conclusion content...';
      return (
        <Box key={blockId} data-block-id={blockId} data-block-type="conclusion_header_first_para" sx={{ pb: '12px' }}>
          <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 700, color: '#000', borderBottom: '1px solid #000', pb: '4px', mb: '12px', textTransform: 'uppercase', fontFamily: 'serif' }}>
            7. Conclusion
          </Typography>
          <Typography sx={{ fontSize: '13px', lineHeight: 1.8, color: '#111', textIndent: '24px', textAlign: 'justify', fontFamily: 'serif' }}>
            {firstPara}
          </Typography>
        </Box>
      );
    }

    if (type === 'conclusion_para') {
      const sec = (reportData.sectionsList || []).find(s => s.id === 'conclusion');
      if (!sec) return null;
      const paragraphs = splitIntoParagraphs(sec.content || '');
      const pIdx = extraData?.paraIndex || 0;
      const paraText = paragraphs[pIdx];
      if (!paraText) return null;
      return (
        <Box key={blockId} data-block-id={blockId} data-block-type="conclusion_para" sx={{ pb: '12px' }}>
          <Typography sx={{ fontSize: '13px', lineHeight: 1.8, color: '#111', textIndent: '24px', textAlign: 'justify', fontFamily: 'serif' }}>
            {paraText}
          </Typography>
        </Box>
      );
    }

    if (type === 'bibliography_header_first_item') {
      const sec = (reportData.sectionsList || []).find(s => s.id === 'bibliography');
      if (!sec) return null;
      const items = sec.bibItems || [];
      const firstItem = items[0];
      return (
        <Box key={blockId} data-block-id={blockId} data-block-type="bibliography_header_first_item" sx={{ pb: '8px' }}>
          <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 700, color: '#000', borderBottom: '1px solid #000', pb: '4px', mb: '12px', textTransform: 'uppercase', fontFamily: 'serif' }}>
            Bibliography
          </Typography>
          {firstItem && (
            <Box component="ol" sx={{ pl: '24px', m: 0 }}>
              <Box component="li" value={1} sx={{ fontSize: '13px', lineHeight: 1.7, color: '#111', mb: '8px', fontFamily: 'serif', textAlign: 'justify' }}>
                {firstItem}
              </Box>
            </Box>
          )}
        </Box>
      );
    }

    if (type === 'bibliography_item') {
      const sec = (reportData.sectionsList || []).find(s => s.id === 'bibliography');
      if (!sec) return null;
      const items = sec.bibItems || [];
      const itemIdx = extraData?.itemIndex || 0;
      const itemText = items[itemIdx];
      if (!itemText) return null;
      return (
        <Box key={blockId} data-block-id={blockId} data-block-type="bibliography_item" sx={{ pl: '24px', pb: '8px' }}>
          <Box component="ol" sx={{ m: 0, p: 0 }}>
            <Box component="li" value={itemIdx + 1} sx={{ fontSize: '13px', lineHeight: 1.7, color: '#111', fontFamily: 'serif', textAlign: 'justify' }}>
              {itemText}
            </Box>
          </Box>
        </Box>
      );
    }

    if (type === 'introduction_image') {
      const sec = (reportData.sectionsList || []).find(s => s.id === 'introduction');
      if (!sec) return null;
      return (
        <Box key={blockId} data-block-id={blockId} data-block-type="introduction_image">
          {renderSectionImageBlock(sec.imageUrl, sec.imageCaption, sec.imageHeight, sec.imageWidth)}
        </Box>
      );
    }

    if (type === 'proposedMethodology_image') {
      const sec = (reportData.sectionsList || []).find(s => s.id === 'proposedMethodology');
      if (!sec) return null;
      return (
        <Box key={blockId} data-block-id={blockId} data-block-type="proposedMethodology_image">
          {renderSectionImageBlock(sec.imageUrl, sec.imageCaption, sec.imageHeight, sec.imageWidth)}
        </Box>
      );
    }

    if (type === 'objectives_image') {
      const sec = (reportData.sectionsList || []).find(s => s.id === 'objectives');
      if (!sec) return null;
      return (
        <Box key={blockId} data-block-id={blockId} data-block-type="objectives_image">
          {renderSectionImageBlock(sec.imageUrl, sec.imageCaption, sec.imageHeight, sec.imageWidth)}
        </Box>
      );
    }

    if (type === 'implementation_image') {
      const sec = (reportData.sectionsList || []).find(s => s.id === 'implementation');
      if (!sec) return null;
      return (
        <Box key={blockId} data-block-id={blockId} data-block-type="implementation_image">
          {renderSectionImageBlock(sec.imageUrl, sec.imageCaption, sec.imageHeight, sec.imageWidth)}
        </Box>
      );
    }

    if (type === 'resultsAndDiscussion_image') {
      const sec = (reportData.sectionsList || []).find(s => s.id === 'resultsAndDiscussion');
      if (!sec) return null;
      return (
        <Box key={blockId} data-block-id={blockId} data-block-type="resultsAndDiscussion_image">
          {renderSectionImageBlock(sec.imageUrl, sec.imageCaption, sec.imageHeight, sec.imageWidth)}
        </Box>
      );
    }

    if (type === 'poMapping_image') {
      const sec = (reportData.sectionsList || []).find(s => s.id === 'poMapping');
      if (!sec) return null;
      return (
        <Box key={blockId} data-block-id={blockId} data-block-type="poMapping_image">
          {renderSectionImageBlock(sec.imageUrl, sec.imageCaption, sec.imageHeight, sec.imageWidth)}
        </Box>
      );
    }

    if (type === 'conclusion_image') {
      const sec = (reportData.sectionsList || []).find(s => s.id === 'conclusion');
      if (!sec) return null;
      return (
        <Box key={blockId} data-block-id={blockId} data-block-type="conclusion_image">
          {renderSectionImageBlock(sec.imageUrl, sec.imageCaption, sec.imageHeight, sec.imageWidth)}
        </Box>
      );
    }

    if (type === 'bibliography_image') {
      const sec = (reportData.sectionsList || []).find(s => s.id === 'bibliography');
      if (!sec) return null;
      return (
        <Box key={blockId} data-block-id={blockId} data-block-type="bibliography_image">
          {renderSectionImageBlock(sec.imageUrl, sec.imageCaption, sec.imageHeight, sec.imageWidth)}
        </Box>
      );
    }

    return null;
  }, [reportData]);

  // A4 Pagination Engine
  const MAX_PAGE_CONTENT_HEIGHT = 880; // px content area (leaving room for footer + padding)

  const calculatePagination = useCallback(() => {
    const container = measurementRef.current;
    if (!container) return;

    const children = container.children;
    if (!children || children.length === 0) return;

    const blocks = [];
    const blockList = getMeasurementBlocks(reportData);
    for (let i = 0; i < children.length; i++) {
      const el = children[i];
      const height = el.getBoundingClientRect().height;
      if (height > 0 && blockList[i]) {
        blocks.push({
          ...blockList[i],
          height: height
        });
      }
    }

    const pages = [];
    let currentPage = [];
    let currentHeight = 0;

    blocks.forEach((block) => {
      // Force page break if the current block is a section header and that section has forcePageBreak enabled
      let shouldForcePageBreak = false;
      if (block.type === 'introduction_header_first_para') {
        const sec = (reportData.sectionsList || []).find(s => s.id === 'introduction');
        if (sec?.forcePageBreak) shouldForcePageBreak = true;
      } else if (block.type === 'proposedMethodology_header_first_para') {
        const sec = (reportData.sectionsList || []).find(s => s.id === 'proposedMethodology');
        if (sec?.forcePageBreak) shouldForcePageBreak = true;
      } else if (block.type === 'objectives_header_content') {
        const sec = (reportData.sectionsList || []).find(s => s.id === 'objectives');
        if (sec?.forcePageBreak) shouldForcePageBreak = true;
      } else if (block.type === 'implementation_header') {
        const sec = (reportData.sectionsList || []).find(s => s.id === 'implementation');
        if (sec?.forcePageBreak) shouldForcePageBreak = true;
      } else if (block.type === 'resultsAndDiscussion_header_first_para') {
        const sec = (reportData.sectionsList || []).find(s => s.id === 'resultsAndDiscussion');
        if (sec?.forcePageBreak) shouldForcePageBreak = true;
      } else if (block.type === 'poMapping_header') {
        shouldForcePageBreak = true; // Always on its own page
      } else if (block.type === 'conclusion_header_first_para') {
        const sec = (reportData.sectionsList || []).find(s => s.id === 'conclusion');
        if (sec?.forcePageBreak) shouldForcePageBreak = true;
      } else if (block.type === 'bibliography_header_first_item') {
        const sec = (reportData.sectionsList || []).find(s => s.id === 'bibliography');
        if (sec?.forcePageBreak) shouldForcePageBreak = true;
      }

      if (shouldForcePageBreak && currentPage.length > 0) {
        pages.push(currentPage);
        currentPage = [block];
        currentHeight = block.height;
      } else if (currentHeight + block.height > MAX_PAGE_CONTENT_HEIGHT && currentPage.length > 0) {
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

    // Compute TOC page numbers
    const pageMapping = {
      'abstract': 'iv',
      'introduction': null,
      'proposedMethodology': null,
      'objectives': null,
      'implementation': null,
      'resultsAndDiscussion': null,
      'poMapping': null,
      'conclusion': null,
      'bibliography': null
    };

    pages.forEach((page, pageIdx) => {
      const actualPageNum = 5 + pageIdx;
      page.forEach(block => {
        const setPage = (key) => {
          if (pageMapping[key] === null) {
            pageMapping[key] = actualPageNum;
          }
        };

        if (block.type.startsWith('introduction')) {
          setPage('introduction');
        } else if (block.type.startsWith('proposedMethodology')) {
          setPage('proposedMethodology');
        } else if (block.type.startsWith('objectives')) {
          setPage('objectives');
        } else if (block.type.startsWith('implementation')) {
          setPage('implementation');
        } else if (block.type.startsWith('resultsAndDiscussion')) {
          setPage('resultsAndDiscussion');
        } else if (block.type.startsWith('poMapping')) {
          setPage('poMapping');
        } else if (block.type.startsWith('conclusion')) {
          setPage('conclusion');
        } else if (block.type.startsWith('bibliography')) {
          setPage('bibliography');
        }
      });
    });

    // Fallback for unset pages (e.g. if a section has no content at all)
    Object.keys(pageMapping).forEach(key => {
      if (pageMapping[key] === null) {
        pageMapping[key] = 5;
      }
    });

    setTocPageNumbers(pageMapping);
  }, [reportData]);

  // Re-calculate pagination on change
  useEffect(() => {
    const timer = setTimeout(() => {
      calculatePagination();
    }, 400);
    return () => clearTimeout(timer);
  }, [reportData, calculatePagination]);

  useEffect(() => {
    const now = new Date();
    setLastSaved(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }, []);

  // Socket sync
  useEffect(() => {
    if (!socket) return;
    const handleReceiveReportChanges = (data) => {
      if (data && data.collegeReportData) {
        setReportData(prev => mergeReportData(data.collegeReportData, prev));
      }
    };
    socket.on('receive-proposal-changes', handleReceiveReportChanges); // share same socket pipeline
    return () => {
      socket.off('receive-proposal-changes', handleReceiveReportChanges);
    };
  }, [socket]);

  // Version Restore
  useEffect(() => {
    if (restoreContent) {
      const merged = mergeReportData(restoreContent);
      setReportData(merged);
      if (!isReadOnly) {
        documentService.updateDocument(documentId, { collegeReportData: merged });
        if (socket) {
          socket.emit('send-proposal-changes', { documentId, collegeReportData: merged });
        }
      }
      showToast('Version restored successfully.');
    }
  }, [restoreContent]);

  // Autosave
  const triggerUpdate = (updatedData) => {
    setReportData(updatedData);

    if (socket && !isReadOnly) {
      socket.emit('send-proposal-changes', { documentId, collegeReportData: updatedData });
    }

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    if (!isReadOnly) {
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await documentService.updateDocument(documentId, { collegeReportData: updatedData });
          const now = new Date();
          setLastSaved(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        } catch (err) {
          console.error('Failed to autosave college report:', err);
        }
      }, 2000);
    }
  };

  const handleMetadataFieldChange = (field, value) => {
    const updated = { ...reportData, [field]: value };
    triggerUpdate(updated);
  };

  const handleStudentChange = (index, field, value) => {
    const list = [...(reportData.submittedBy || [])];
    list[index] = { ...list[index], [field]: value };
    const updated = { ...reportData, submittedBy: list };
    triggerUpdate(updated);
  };

  const handleAddStudent = () => {
    const list = [...(reportData.submittedBy || []), { name: '', roll: '' }];
    const updated = { ...reportData, submittedBy: list };
    triggerUpdate(updated);
  };

  const handleRemoveStudent = (index) => {
    const list = (reportData.submittedBy || []).filter((_, idx) => idx !== index);
    const updated = { ...reportData, submittedBy: list };
    triggerUpdate(updated);
  };

  const handleSectionContentChange = (sectionId, value) => {
    const list = (reportData.sectionsList || []).map(sec => {
      if (sec.id === sectionId) {
        return { ...sec, content: value };
      }
      return sec;
    });
    const updated = { ...reportData, sectionsList: list };
    triggerUpdate(updated);
  };

  const handleSectionImageChange = (sectionId, field, value) => {
    const list = (reportData.sectionsList || []).map(sec => {
      if (sec.id === sectionId) {
        return { ...sec, [field]: value };
      }
      return sec;
    });
    const updated = { ...reportData, sectionsList: list };
    triggerUpdate(updated);
  };

  const handleSectionPageBreakChange = (sectionId, value) => {
    const list = (reportData.sectionsList || []).map(sec => {
      if (sec.id === sectionId) {
        return { ...sec, forcePageBreak: value };
      }
      return sec;
    });
    const updated = { ...reportData, sectionsList: list };
    triggerUpdate(updated);
  };

  // Objectives List Helpers
  const handleObjectiveItemChange = (index, value) => {
    const list = (reportData.sectionsList || []).map(sec => {
      if (sec.id === 'objectives') {
        const items = [...(sec.listItems || [])];
        items[index] = value;
        return { ...sec, listItems: items };
      }
      return sec;
    });
    const updated = { ...reportData, sectionsList: list };
    triggerUpdate(updated);
  };

  const handleAddObjectiveItem = () => {
    const list = (reportData.sectionsList || []).map(sec => {
      if (sec.id === 'objectives') {
        return { ...sec, listItems: [...(sec.listItems || []), ''] };
      }
      return sec;
    });
    const updated = { ...reportData, sectionsList: list };
    triggerUpdate(updated);
  };

  const handleRemoveObjectiveItem = (index) => {
    const list = (reportData.sectionsList || []).map(sec => {
      if (sec.id === 'objectives') {
        return { ...sec, listItems: (sec.listItems || []).filter((_, idx) => idx !== index) };
      }
      return sec;
    });
    const updated = { ...reportData, sectionsList: list };
    triggerUpdate(updated);
  };

  // Implementation Helpers
  const handleImplementationFieldChange = (field, index, value) => {
    const list = (reportData.sectionsList || []).map(sec => {
      if (sec.id === 'implementation') {
        if (field === 'workingPrinciple') {
          return { ...sec, workingPrinciple: value };
        }
        const array = [...(sec[field] || [])];
        array[index] = value;
        return { ...sec, [field]: array };
      }
      return sec;
    });
    const updated = { ...reportData, sectionsList: list };
    triggerUpdate(updated);
  };

  const handleAddImplementationItem = (field) => {
    const list = (reportData.sectionsList || []).map(sec => {
      if (sec.id === 'implementation') {
        return { ...sec, [field]: [...(sec[field] || []), ''] };
      }
      return sec;
    });
    const updated = { ...reportData, sectionsList: list };
    triggerUpdate(updated);
  };

  const handleRemoveImplementationItem = (field, index) => {
    const list = (reportData.sectionsList || []).map(sec => {
      if (sec.id === 'implementation') {
        return { ...sec, [field]: (sec[field] || []).filter((_, idx) => idx !== index) };
      }
      return sec;
    });
    const updated = { ...reportData, sectionsList: list };
    triggerUpdate(updated);
  };

  // Results & Figures Helpers
  const handleResultsFieldChange = (field, value) => {
    const list = (reportData.sectionsList || []).map(sec => {
      if (sec.id === 'resultsAndDiscussion') {
        return { ...sec, [field]: value };
      }
      return sec;
    });
    const updated = { ...reportData, sectionsList: list };
    triggerUpdate(updated);
  };

  const handleFigureChange = (index, field, value) => {
    const list = (reportData.sectionsList || []).map(sec => {
      if (sec.id === 'resultsAndDiscussion') {
        const figs = [...(sec.figures || [])];
        figs[index] = { ...figs[index], [field]: value };
        return { ...sec, figures: figs };
      }
      return sec;
    });
    const updated = { ...reportData, sectionsList: list };
    triggerUpdate(updated);
  };

  // PO & SDG Mapping Helpers
  const handlePOMappingChange = (index, field, value) => {
    const list = (reportData.sectionsList || []).map(sec => {
      if (sec.id === 'poMapping') {
        const rows = [...(sec.poRows || [])];
        rows[index] = { ...rows[index], [field]: value };
        return { ...sec, poRows: rows };
      }
      return sec;
    });
    const updated = { ...reportData, sectionsList: list };
    triggerUpdate(updated);
  };

  const handleSDGMappingChange = (index, field, value) => {
    const list = (reportData.sectionsList || []).map(sec => {
      if (sec.id === 'poMapping') {
        const rows = [...(sec.sdgRows || [])];
        rows[index] = { ...rows[index], [field]: value };
        return { ...sec, sdgRows: rows };
      }
      return sec;
    });
    const updated = { ...reportData, sectionsList: list };
    triggerUpdate(updated);
  };

  const handleAddPORow = () => {
    const list = (reportData.sectionsList || []).map(sec => {
      if (sec.id === 'poMapping') {
        const rows = [...(sec.poRows || []), { poNo: '', outcome: '', relevance: '' }];
        return { ...sec, poRows: rows };
      }
      return sec;
    });
    const updated = { ...reportData, sectionsList: list };
    triggerUpdate(updated);
  };

  const handleRemovePORow = (index) => {
    const list = (reportData.sectionsList || []).map(sec => {
      if (sec.id === 'poMapping') {
        const rows = (sec.poRows || []).filter((_, idx) => idx !== index);
        return { ...sec, poRows: rows };
      }
      return sec;
    });
    const updated = { ...reportData, sectionsList: list };
    triggerUpdate(updated);
  };

  const handleAddSDGRow = () => {
    const list = (reportData.sectionsList || []).map(sec => {
      if (sec.id === 'poMapping') {
        const rows = [...(sec.sdgRows || []), { sdgNo: '', goal: '', relevance: '' }];
        return { ...sec, sdgRows: rows };
      }
      return sec;
    });
    const updated = { ...reportData, sectionsList: list };
    triggerUpdate(updated);
  };

  const handleRemoveSDGRow = (index) => {
    const list = (reportData.sectionsList || []).map(sec => {
      if (sec.id === 'poMapping') {
        const rows = (sec.sdgRows || []).filter((_, idx) => idx !== index);
        return { ...sec, sdgRows: rows };
      }
      return sec;
    });
    const updated = { ...reportData, sectionsList: list };
    triggerUpdate(updated);
  };

  // Bibliography Helpers
  const handleBibliographyChange = (index, value) => {
    const list = (reportData.sectionsList || []).map(sec => {
      if (sec.id === 'bibliography') {
        const items = [...(sec.bibItems || [])];
        items[index] = value;
        return { ...sec, bibItems: items };
      }
      return sec;
    });
    const updated = { ...reportData, sectionsList: list };
    triggerUpdate(updated);
  };

  const handleAddBibliographyItem = () => {
    const list = (reportData.sectionsList || []).map(sec => {
      if (sec.id === 'bibliography') {
        return { ...sec, bibItems: [...(sec.bibItems || []), ''] };
      }
      return sec;
    });
    const updated = { ...reportData, sectionsList: list };
    triggerUpdate(updated);
  };

  const handleRemoveBibliographyItem = (index) => {
    const list = (reportData.sectionsList || []).map(sec => {
      if (sec.id === 'bibliography') {
        return { ...sec, bibItems: (sec.bibItems || []).filter((_, idx) => idx !== index) };
      }
      return sec;
    });
    const updated = { ...reportData, sectionsList: list };
    triggerUpdate(updated);
  };

  const showToast = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const scrollToSection = (key) => {
    setExpanded(key);
    const el = document.getElementById(`preview-section-${key}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(key);
    }
  };

  // AIGenerate Simulators
  const handleAIGenerate = (sectionId, labelName) => {
    if (isReadOnly) return;
    setAiLoading(true);
    setLoadingText(`AI Assistant is generating content for ${labelName}...`);

    setTimeout(() => {
      setAiLoading(false);
      let val = '';
      if (sectionId === 'introduction') {
        val = `In modern software development, ensuring consistency, scalability, and efficient deployment of applications is a major challenge. Traditional deployment methods often face issues related to environment differences, dependency conflicts, and complex configuration processes. To overcome these challenges, containerization has emerged as a powerful solution that allows applications to be packaged along with their dependencies into lightweight, portable units. Tools like Docker enable developers to build and run applications consistently across different environments. However, as the number of containers increases, managing them manually becomes difficult and inefficient. Tasks such as deployment, scaling, load balancing, and fault management require an automated and reliable system. This is where Kubernetes plays a crucial role. Kubernetes is an open-source container orchestration platform that automates the deployment, scaling, and management of containerized applications. This project focuses on deploying containerized applications using Kubernetes, demonstrating how applications can be efficiently managed in a cluster environment. It utilizes key Kubernetes components such as Pods, Deployments, and Services to ensure smooth operation, scalability, and high availability. The system also incorporates features like auto-scaling and self-healing to maintain performance and reliability. Overall, this project highlights a modern and efficient approach to application deployment, widely adopted in cloud and DevOps practices, improving resource utilization and reducing manual intervention.`;
        handleSectionContentChange('introduction', val);
      } else if (sectionId === 'proposedMethodology') {
        val = `The proposed system is based on containerization and orchestration to enable efficient deployment and management of applications. Initially, the application is developed and containerized using Docker, where all required dependencies are packaged into a single container to ensure consistent execution across different environments. The container image is then stored in a container registry such as Docker Hub, making it easily accessible for deployment. Kubernetes is used as the orchestration platform to manage these containers. It deploys the application in the form of Pods within a cluster and automatically handles scheduling, scaling, and distribution. Kubernetes Deployments are utilized to maintain the desired number of application instances, ensuring reliability and availability. Services are used to expose the application and enable communication between different components. Load balancing is implemented to distribute incoming traffic evenly across running containers, thereby improving performance and fault tolerance. The system also incorporates auto-scaling to dynamically adjust resources based on workload demands and self-healing mechanisms to automatically restart failed containers. Additionally, monitoring tools are integrated to track application performance and overall system health. Overall, the proposed methodology provides a scalable, reliable, and efficient solution for modern application deployment, aligning with current cloud computing and DevOps practices.`;
        handleSectionContentChange('proposedMethodology', val);
      } else {
        val = `Draft boilerplate content successfully generated for the ${labelName} section. Add custom revisions as needed.`;
        handleSectionContentChange(sectionId, val);
      }
      showToast('Boilerplate content generated.');
    }, 1200);
  };

  const handleExportPDF = async () => {
    const wrapper = document.querySelector('.college-report-preview-wrapper');
    const pages = document.querySelectorAll('.college-report-editor-paper');
    if (!pages || pages.length === 0) {
      showToast('No preview pages found to export.', 'error');
      return;
    }

    const originalZoom = wrapper ? wrapper.style.zoom : '';

    try {
      showToast('Preparing PDF export...');
      
      if (wrapper) {
        wrapper.style.zoom = '1';
      }

      // Wait a bit for layout to recalculate at 100% zoom
      await new Promise(r => setTimeout(r, 150));

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

        // Preserve clickable hyperlink annotations in the PDF
        const links = pageEl.querySelectorAll('a');
        links.forEach(linkEl => {
          const href = linkEl.getAttribute('href');
          if (href) {
            const rect = linkEl.getBoundingClientRect();
            const pageRect = pageEl.getBoundingClientRect();
            const relLeft = rect.left - pageRect.left;
            const relTop = rect.top - pageRect.top;
            
            if (rect.width > 0 && rect.height > 0) {
              const x = relLeft * (210 / pageEl.offsetWidth);
              const y = relTop * (297 / pageEl.offsetHeight);
              const w = rect.width * (210 / pageEl.offsetWidth);
              const h = rect.height * (297 / pageEl.offsetHeight);
              pdf.link(x, y, w, h, { url: href });
            }
          }
        });
      }

      pdf.save(`${reportData.projectTitle || 'college-report'}.pdf`);
      showToast('PDF exported successfully!');

      if (wrapper) {
        wrapper.style.zoom = originalZoom;
      }
    } catch (error) {
      console.error('Failed to export to PDF:', error);
      showToast('Failed to export PDF.', 'error');
      if (wrapper) {
        wrapper.style.zoom = originalZoom;
      }
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => showToast('Document share link copied to clipboard!'))
      .catch(() => showToast('Failed to copy share link.', 'error'));
  };

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

      <Grid container spacing={3} sx={{ flex: 1, overflow: 'hidden', p: 0 }}>
        {/* Left Column: Form Editing Accordions */}
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
          {/* Metadata Accordion */}
          <Accordion expanded={expanded === 'metadata'} onChange={handleAccordionChange('metadata')} sx={accordionSx}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'var(--text-muted)' }} />}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>🏫</span> College & Cover Details
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 0 }}>
              <TextField
                select
                label="Select College"
                size="small"
                fullWidth
                value={reportData.collegeName || ''}
                disabled={isReadOnly}
                onChange={(e) => handleCollegeChange(e.target.value)}
              >
                <MenuItem value="Vardhaman College of Engineering">Vardhaman College of Engineering</MenuItem>
                <MenuItem value="Custom College">Custom College/Institution</MenuItem>
              </TextField>

              {reportData.collegeName === 'Custom College' && (
                <TextField
                  label="Custom College Name"
                  size="small"
                  fullWidth
                  value={reportData.collegeName || ''}
                  disabled={isReadOnly}
                  onChange={(e) => handleMetadataFieldChange('collegeName', e.target.value)}
                />
              )}

              <TextField
                label="Department Name"
                size="small"
                fullWidth
                value={reportData.departmentName || ''}
                disabled={isReadOnly}
                onChange={(e) => handleMetadataFieldChange('departmentName', e.target.value)}
              />

              <TextField
                label="Project Title"
                size="small"
                fullWidth
                multiline
                rows={2}
                value={reportData.projectTitle || ''}
                disabled={isReadOnly}
                onChange={(e) => handleMetadataFieldChange('projectTitle', e.target.value)}
              />

              <TextField
                label="Course Code & Lab Name"
                size="small"
                fullWidth
                value={reportData.courseCodeName || ''}
                disabled={isReadOnly}
                onChange={(e) => handleMetadataFieldChange('courseCodeName', e.target.value)}
              />

              <TextField
                label="Academic Year"
                size="small"
                fullWidth
                value={reportData.academicYear || ''}
                disabled={isReadOnly}
                onChange={(e) => handleMetadataFieldChange('academicYear', e.target.value)}
              />

              <TextField
                label="Month & Year"
                size="small"
                fullWidth
                value={reportData.monthYear || ''}
                disabled={isReadOnly}
                onChange={(e) => handleMetadataFieldChange('monthYear', e.target.value)}
              />
            </AccordionDetails>
          </Accordion>

          {/* Students List Accordion */}
          <Accordion expanded={expanded === 'students'} onChange={handleAccordionChange('students')} sx={accordionSx}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'var(--text-muted)' }} />}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>👥</span> Submitted By (Students)
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 0 }}>
              {(reportData.submittedBy || []).map((student, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField
                    label={`Student ${index + 1} Name`}
                    size="small"
                    value={student.name}
                    disabled={isReadOnly}
                    onChange={(e) => handleStudentChange(index, 'name', e.target.value)}
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    label="Roll Number"
                    size="small"
                    value={student.roll}
                    disabled={isReadOnly}
                    onChange={(e) => handleStudentChange(index, 'roll', e.target.value)}
                    sx={{ flex: 1 }}
                  />
                  {!isReadOnly && (
                    <IconButton size="small" onClick={() => handleRemoveStudent(index)} sx={{ color: 'var(--text-muted)' }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              ))}
              {!isReadOnly && (
                <Button size="small" startIcon={<AddIcon />} onClick={handleAddStudent} sx={{ color: 'var(--accent-secondary)' }}>
                  Add Student
                </Button>
              )}
            </AccordionDetails>
          </Accordion>

          {/* Faculty / HOD Info Accordion */}
          <Accordion expanded={expanded === 'faculty'} onChange={handleAccordionChange('faculty')} sx={accordionSx}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'var(--text-muted)' }} />}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>🎓</span> Course Facilitator & HOD
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 0 }}>
              <TextField
                label="Course Facilitator"
                size="small"
                fullWidth
                value={reportData.courseFacilitator || ''}
                disabled={isReadOnly}
                onChange={(e) => handleMetadataFieldChange('courseFacilitator', e.target.value)}
              />
              <TextField
                label="Facilitator Designation"
                size="small"
                fullWidth
                value={reportData.courseFacilitatorDesignation || ''}
                disabled={isReadOnly}
                onChange={(e) => handleMetadataFieldChange('courseFacilitatorDesignation', e.target.value)}
              />
              <TextField
                label="HOD Name"
                size="small"
                fullWidth
                value={reportData.hodName || ''}
                disabled={isReadOnly}
                onChange={(e) => handleMetadataFieldChange('hodName', e.target.value)}
              />
              <TextField
                label="HOD Designation"
                size="small"
                fullWidth
                value={reportData.hodDesignation || ''}
                disabled={isReadOnly}
                onChange={(e) => handleMetadataFieldChange('hodDesignation', e.target.value)}
              />
            </AccordionDetails>
          </Accordion>

          {/* Abstract & Keywords Accordion */}
          <Accordion expanded={expanded === 'abstract'} onChange={handleAccordionChange('abstract')} sx={accordionSx}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'var(--text-muted)' }} />}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>📖</span> Abstract & Keywords
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 0 }}>
              <TextField
                label="Abstract"
                multiline
                rows={5}
                fullWidth
                value={reportData.abstract || ''}
                disabled={isReadOnly}
                onChange={(e) => handleMetadataFieldChange('abstract', e.target.value)}
              />
              <TextField
                label="Keywords (comma-separated)"
                size="small"
                fullWidth
                value={reportData.keywords || ''}
                disabled={isReadOnly}
                onChange={(e) => handleMetadataFieldChange('keywords', e.target.value)}
              />
              <Box sx={{ border: '1px solid rgba(255,255,255,0.08)', p: 1.5, borderRadius: '6px', mt: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Typography variant="caption" sx={{ color: 'var(--text-muted)', fontWeight: 600 }}>Abstract Image (Optional)</Typography>
                <TextField
                  label="Image URL"
                  size="small"
                  fullWidth
                  value={reportData.abstractImageUrl || ''}
                  disabled={isReadOnly}
                  onChange={(e) => handleMetadataFieldChange('abstractImageUrl', e.target.value)}
                  placeholder="https://example.com/image.png or relative path"
                />
                <TextField
                  label="Image Caption"
                  size="small"
                  fullWidth
                  value={reportData.abstractImageCaption || ''}
                  disabled={isReadOnly}
                  onChange={(e) => handleMetadataFieldChange('abstractImageCaption', e.target.value)}
                  placeholder="Description of the abstract image"
                />
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" sx={{ color: 'var(--text-muted)', display: 'block', mb: 0.5 }}>
                    Image Width: {reportData.abstractImageWidth || '85%'}
                  </Typography>
                  <Slider
                    size="small"
                    value={parseInt(reportData.abstractImageWidth || '85')}
                    min={10}
                    max={100}
                    disabled={isReadOnly}
                    onChange={(e, val) => handleMetadataFieldChange('abstractImageWidth', `${val}%`)}
                    valueLabelDisplay="auto"
                    sx={{ color: 'var(--accent-secondary)' }}
                  />
                </Box>
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" sx={{ color: 'var(--text-muted)', display: 'block', mb: 0.5 }}>
                    Image Height: {reportData.abstractImageHeight || '180px'}
                  </Typography>
                  <Slider
                    size="small"
                    value={parseInt(reportData.abstractImageHeight || '180')}
                    min={50}
                    max={500}
                    disabled={isReadOnly}
                    onChange={(e, val) => handleMetadataFieldChange('abstractImageHeight', `${val}px`)}
                    valueLabelDisplay="auto"
                    sx={{ color: 'var(--accent-secondary)' }}
                  />
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Chapters / Sections Accordions */}
          {(reportData.sectionsList || []).map((sec) => {
            const hasAI = sec.id === 'introduction' || sec.id === 'proposedMethodology' || sec.id === 'conclusion';
            return (
              <Accordion key={sec.id} expanded={expanded === sec.id} onChange={handleAccordionChange(sec.id)} sx={accordionSx}>
                <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'var(--text-muted)' }} />}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>📂</span> {sec.label}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 0 }}>
                  {hasAI && !isReadOnly && (
                    <Button
                      size="small"
                      variant="outlined"
                      color="secondary"
                      startIcon={<AutoAwesomeIcon />}
                      onClick={() => handleAIGenerate(sec.id, sec.label)}
                      sx={{ alignSelf: 'flex-start', mb: 1, textTransform: 'none' }}
                    >
                      Autofill with AI Template
                    </Button>
                  )}

                  {sec.id === 'objectives' ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {(sec.listItems || []).map((item, idx) => (
                        <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <TextField
                            label={`Objective ${idx + 1}`}
                            size="small"
                            fullWidth
                            value={item}
                            disabled={isReadOnly}
                            onChange={(e) => handleObjectiveItemChange(idx, e.target.value)}
                          />
                          {!isReadOnly && (
                            <IconButton size="small" onClick={() => handleRemoveObjectiveItem(idx)} sx={{ color: 'var(--text-muted)' }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                      ))}
                      {!isReadOnly && (
                        <Button size="small" startIcon={<AddIcon />} onClick={handleAddObjectiveItem} sx={{ color: 'var(--accent-secondary)' }}>
                          Add Objective Item
                        </Button>
                      )}
                    </Box>
                  ) : sec.id === 'implementation' ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Typography variant="caption" sx={{ color: 'var(--text-muted)', fontWeight: 600 }}>4.1 Block Diagram Components</Typography>
                      {(sec.blockDiagramItems || []).map((item, idx) => (
                        <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <TextField
                            label={`Component ${idx + 1}`}
                            size="small"
                            fullWidth
                            value={item}
                            disabled={isReadOnly}
                            onChange={(e) => handleImplementationFieldChange('blockDiagramItems', idx, e.target.value)}
                          />
                          {!isReadOnly && (
                            <IconButton size="small" onClick={() => handleRemoveImplementationItem('blockDiagramItems', idx)} sx={{ color: 'var(--text-muted)' }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                      ))}
                      {!isReadOnly && (
                        <Button size="small" startIcon={<AddIcon />} onClick={() => handleAddImplementationItem('blockDiagramItems')} sx={{ color: 'var(--accent-secondary)', mb: 2 }}>
                          Add Component
                        </Button>
                      )}

                      <TextField
                        label="4.2 Working Principle Details"
                        multiline
                        rows={4}
                        fullWidth
                        value={sec.workingPrinciple || ''}
                        disabled={isReadOnly}
                        onChange={(e) => handleImplementationFieldChange('workingPrinciple', null, e.target.value)}
                      />

                      <Typography variant="caption" sx={{ color: 'var(--text-muted)', fontWeight: 600, mt: 2 }}>4.3 Software Tools</Typography>
                      {(sec.softwareTools || []).map((item, idx) => (
                        <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <TextField
                            label={`Software Tool ${idx + 1}`}
                            size="small"
                            fullWidth
                            value={item}
                            disabled={isReadOnly}
                            onChange={(e) => handleImplementationFieldChange('softwareTools', idx, e.target.value)}
                          />
                          {!isReadOnly && (
                            <IconButton size="small" onClick={() => handleRemoveImplementationItem('softwareTools', idx)} sx={{ color: 'var(--text-muted)' }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                      ))}
                      {!isReadOnly && (
                        <Button size="small" startIcon={<AddIcon />} onClick={() => handleAddImplementationItem('softwareTools')} sx={{ color: 'var(--accent-secondary)' }}>
                          Add Software Tool
                        </Button>
                      )}
                    </Box>
                  ) : sec.id === 'resultsAndDiscussion' ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <TextField
                        label="5.1 Results Intro Content"
                        multiline
                        rows={3}
                        fullWidth
                        value={sec.resultsIntro || ''}
                        disabled={isReadOnly}
                        onChange={(e) => handleResultsFieldChange('resultsIntro', e.target.value)}
                      />

                      <Typography variant="caption" sx={{ color: 'var(--text-muted)', fontWeight: 600 }}>Figures & Captions</Typography>
                      {(sec.figures || []).map((fig, idx) => (
                        <Box key={idx} sx={{ border: '1px solid var(--border-color)', p: 1.5, borderRadius: '6px', mb: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>Figure {idx + 1}</Typography>
                          <TextField
                            label="Figure Caption (text)"
                            size="small"
                            fullWidth
                            value={fig.caption}
                            disabled={isReadOnly}
                            onChange={(e) => handleFigureChange(idx, 'caption', e.target.value)}
                            helperText="e.g. Student Data Dashboard"
                          />
                          <TextField
                            label="Figure Image URL or Filename"
                            size="small"
                            fullWidth
                            value={fig.imageUrl}
                            disabled={isReadOnly}
                            onChange={(e) => handleFigureChange(idx, 'imageUrl', e.target.value)}
                            helperText="Enter a valid image URL or a local placeholder filename (e.g. op1.png)"
                          />
                          <Box sx={{ mt: 1 }}>
                             <Typography variant="caption" sx={{ color: 'var(--text-muted)', display: 'block', mb: 0.5 }}>
                               Figure Width: {fig.imageWidth || '85%'}
                             </Typography>
                             <Slider
                               size="small"
                               value={parseInt(fig.imageWidth || '85')}
                               min={10}
                               max={100}
                               disabled={isReadOnly}
                               onChange={(e, val) => handleFigureChange(idx, 'imageWidth', `${val}%`)}
                               valueLabelDisplay="auto"
                               sx={{ color: 'var(--accent-secondary)' }}
                             />
                           </Box>
                           <Box sx={{ mt: 1 }}>
                             <Typography variant="caption" sx={{ color: 'var(--text-muted)', display: 'block', mb: 0.5 }}>
                               Figure Height: {fig.imageHeight || '180px'}
                             </Typography>
                             <Slider
                               size="small"
                               value={parseInt(fig.imageHeight || '180')}
                               min={50}
                               max={500}
                               disabled={isReadOnly}
                               onChange={(e, val) => handleFigureChange(idx, 'imageHeight', `${val}px`)}
                               valueLabelDisplay="auto"
                               sx={{ color: 'var(--accent-secondary)' }}
                             />
                           </Box>
                        </Box>
                      ))}

                      <TextField
                        label="5.2 Discussion Details"
                        multiline
                        rows={4}
                        fullWidth
                        value={sec.discussionContent || ''}
                        disabled={isReadOnly}
                        onChange={(e) => handleResultsFieldChange('discussionContent', e.target.value)}
                      />
                    </Box>
                  ) : sec.id === 'poMapping' ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: 'var(--text-muted)', fontWeight: 600 }}>Table 1: PO Mapping Descriptions</Typography>
                        {!isReadOnly && (
                          <Button size="small" startIcon={<AddIcon />} onClick={handleAddPORow} sx={{ color: 'var(--accent-secondary)' }}>
                            Add PO Row
                          </Button>
                        )}
                      </Box>
                      {(sec.poRows || []).map((row, idx) => (
                        <Box key={idx} sx={{ display: 'flex', gap: 1.5, flexDirection: 'column', borderBottom: '1px solid rgba(255,255,255,0.05)', pb: 2 }}>
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <TextField
                              label="PO No"
                              size="small"
                              value={row.poNo || ''}
                              disabled={isReadOnly}
                              onChange={(e) => handlePOMappingChange(idx, 'poNo', e.target.value)}
                              sx={{ width: '80px' }}
                            />
                            <TextField
                              label="Program Outcome"
                              size="small"
                              value={row.outcome || ''}
                              disabled={isReadOnly}
                              onChange={(e) => handlePOMappingChange(idx, 'outcome', e.target.value)}
                              sx={{ flex: 1 }}
                            />
                            {!isReadOnly && (
                              <IconButton size="small" onClick={() => handleRemovePORow(idx)} sx={{ color: 'var(--text-muted)' }}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            )}
                          </Box>
                          <TextField
                            label="Relevance Description"
                            size="small"
                            fullWidth
                            multiline
                            rows={2}
                            value={row.relevance || ''}
                            disabled={isReadOnly}
                            onChange={(e) => handlePOMappingChange(idx, 'relevance', e.target.value)}
                          />
                        </Box>
                      ))}

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                        <Typography variant="caption" sx={{ color: 'var(--text-muted)', fontWeight: 600 }}>Table 2: SDG Mapping Descriptions</Typography>
                        {!isReadOnly && (
                          <Button size="small" startIcon={<AddIcon />} onClick={handleAddSDGRow} sx={{ color: 'var(--accent-secondary)' }}>
                            Add SDG Row
                          </Button>
                        )}
                      </Box>
                      {(sec.sdgRows || []).map((row, idx) => (
                        <Box key={idx} sx={{ display: 'flex', gap: 1.5, flexDirection: 'column', borderBottom: '1px solid rgba(255,255,255,0.05)', pb: 2 }}>
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <TextField
                              label="SDG No"
                              size="small"
                              value={row.sdgNo || ''}
                              disabled={isReadOnly}
                              onChange={(e) => handleSDGMappingChange(idx, 'sdgNo', e.target.value)}
                              sx={{ width: '80px' }}
                            />
                            <TextField
                              label="Goal"
                              size="small"
                              value={row.goal || ''}
                              disabled={isReadOnly}
                              onChange={(e) => handleSDGMappingChange(idx, 'goal', e.target.value)}
                              sx={{ flex: 1 }}
                            />
                            {!isReadOnly && (
                              <IconButton size="small" onClick={() => handleRemoveSDGRow(idx)} sx={{ color: 'var(--text-muted)' }}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            )}
                          </Box>
                          <TextField
                            label="Relevance Description"
                            size="small"
                            fullWidth
                            multiline
                            rows={2}
                            value={row.relevance || ''}
                            disabled={isReadOnly}
                            onChange={(e) => handleSDGMappingChange(idx, 'relevance', e.target.value)}
                          />
                        </Box>
                      ))}
                    </Box>
                  ) : sec.id === 'bibliography' ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {(sec.bibItems || []).map((item, idx) => (
                        <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <TextField
                            label={`Reference [${idx + 1}]`}
                            size="small"
                            fullWidth
                            value={item}
                            disabled={isReadOnly}
                            onChange={(e) => handleBibliographyChange(idx, e.target.value)}
                          />
                          {!isReadOnly && (
                            <IconButton size="small" onClick={() => handleRemoveBibliographyItem(idx)} sx={{ color: 'var(--text-muted)' }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                      ))}
                      {!isReadOnly && (
                        <Button size="small" startIcon={<AddIcon />} onClick={handleAddBibliographyItem} sx={{ color: 'var(--accent-secondary)' }}>
                          Add Reference Item
                        </Button>
                      )}
                    </Box>
                  ) : (
                    <TextField
                      label="Content"
                      multiline
                      rows={6}
                      fullWidth
                      value={sec.content}
                      disabled={isReadOnly}
                      onChange={(e) => handleSectionContentChange(sec.id, e.target.value)}
                    />
                  )}
                  {/* Common Section Image URL input */}
                  <Box sx={{ border: '1px solid rgba(255,255,255,0.08)', p: 1.5, borderRadius: '6px', mt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Typography variant="caption" sx={{ color: 'var(--text-muted)', fontWeight: 600 }}>Section Image (Optional)</Typography>
                    <TextField
                      label="Image URL"
                      size="small"
                      fullWidth
                      value={sec.imageUrl || ''}
                      disabled={isReadOnly}
                      onChange={(e) => handleSectionImageChange(sec.id, 'imageUrl', e.target.value)}
                      placeholder="https://example.com/image.png or relative path"
                    />
                    <TextField
                      label="Image Caption"
                      size="small"
                      fullWidth
                      value={sec.imageCaption || ''}
                      disabled={isReadOnly}
                      onChange={(e) => handleSectionImageChange(sec.id, 'imageCaption', e.target.value)}
                      placeholder="e.g. Figure: Description of this section's image"
                    />
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" sx={{ color: 'var(--text-muted)', display: 'block', mb: 0.5 }}>
                        Image Width: {sec.imageWidth || '85%'}
                      </Typography>
                      <Slider
                        size="small"
                        value={parseInt(sec.imageWidth || '85')}
                        min={10}
                        max={100}
                        disabled={isReadOnly}
                        onChange={(e, val) => handleSectionImageChange(sec.id, 'imageWidth', `${val}%`)}
                        valueLabelDisplay="auto"
                        sx={{ color: 'var(--accent-secondary)' }}
                      />
                    </Box>
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" sx={{ color: 'var(--text-muted)', display: 'block', mb: 0.5 }}>
                        Image Height: {sec.imageHeight || '180px'}
                      </Typography>
                      <Slider
                        size="small"
                        value={parseInt(sec.imageHeight || '180')}
                        min={50}
                        max={500}
                        disabled={isReadOnly}
                        onChange={(e, val) => handleSectionImageChange(sec.id, 'imageHeight', `${val}px`)}
                        valueLabelDisplay="auto"
                        sx={{ color: 'var(--accent-secondary)' }}
                      />
                    </Box>
                  </Box>
                  {/* Common Page Break Option */}
                  <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center' }}>
                    <Checkbox
                      checked={!!sec.forcePageBreak}
                      disabled={isReadOnly}
                      onChange={(e) => handleSectionPageBreakChange(sec.id, e.target.checked)}
                      sx={{ color: 'var(--text-muted)', '&.Mui-checked': { color: 'var(--accent-secondary)' }, p: 0.5, mr: 1 }}
                    />
                    <Typography variant="body2" sx={{ color: '#e2e8f0', fontSize: '13px' }}>
                      Start this section on a new page
                    </Typography>
                  </Box>
                </AccordionDetails>
              </Accordion>
            );
          })}
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

        {/* Right Column: Live visual A4 pages compilation */}
        {showPreview && (
        <Grid
          className="proposal-editor-preview-container"
          size={{ xs: 12, md: 7 }}
          ref={previewContainerRef}
          onScroll={handlePreviewScroll}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflowY: 'auto',
            pl: { md: 2 },
            boxSizing: 'border-box',
            alignItems: 'center',
            bgcolor: '#121217',
            position: 'relative'
          }}
        >
          {/* Overleaf-style PDF Viewer Toolbar */}
          <Box
            className="no-print"
            sx={{
              position: 'sticky',
              top: 0,
              left: 0,
              right: 0,
              height: '48px',
              width: '100%',
              bgcolor: '#1e1e24',
              borderBottom: '1px solid #2e2e38',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 2,
              zIndex: 10,
              boxSizing: 'border-box',
              color: '#e2e8f0',
              backdropFilter: 'blur(8px)',
              background: 'rgba(30, 30, 36, 0.95)'
            }}
          >
            {/* Left: Page Navigation */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton
                size="small"
                disabled={currentPage <= 1}
                onClick={() => scrollToPage(currentPage - 2)}
                sx={{ color: currentPage <= 1 ? '#555' : '#ccc' }}
              >
                &lt;
              </IconButton>
              <Typography variant="body2" sx={{ fontSize: '13px', minWidth: '90px', textAlign: 'center', fontWeight: 600 }}>
                Page {currentPage} of {totalPages}
              </Typography>
              <IconButton
                size="small"
                disabled={currentPage >= totalPages}
                onClick={() => scrollToPage(currentPage)}
                sx={{ color: currentPage >= totalPages ? '#555' : '#ccc' }}
              >
                &gt;
              </IconButton>
            </Box>

            {/* Middle: Zoom Controls */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Button
                variant="text"
                size="small"
                onClick={() => setZoom(z => Math.max(0.5, z - 0.05))}
                sx={{ color: '#ccc', minWidth: '32px', fontWeight: 700, fontSize: '16px', py: 0 }}
              >
                -
              </Button>
              <Typography variant="body2" sx={{ fontSize: '13px', fontWeight: 600, minWidth: '45px', textAlign: 'center' }}>
                {Math.round(zoom * 100)}%
              </Typography>
              <Button
                variant="text"
                size="small"
                onClick={() => setZoom(z => Math.min(1.5, z + 0.05))}
                sx={{ color: '#ccc', minWidth: '32px', fontWeight: 700, fontSize: '16px', py: 0 }}
              >
                +
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setZoom(0.78)}
                sx={{
                  color: '#ccc',
                  borderColor: '#444',
                  fontSize: '11px',
                  py: 0.2,
                  px: 1,
                  minWidth: 'auto',
                  textTransform: 'none',
                  '&:hover': { borderColor: '#666', bgcolor: 'rgba(255,255,255,0.05)' }
                }}
              >
                Reset
              </Button>
            </Box>

            {/* Right: Actions */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" sx={{ color: '#94a3b8', mr: 1, display: { xs: 'none', sm: 'inline' } }}>
                Autosaved at {lastSaved || 'Pending'}
              </Typography>
              <Button
                size="small"
                variant="contained"
                startIcon={<PrintIcon fontSize="small" />}
                onClick={handleExportPDF}
                sx={{
                  textTransform: 'none',
                  fontSize: '12px',
                  fontWeight: 600,
                  bgcolor: 'var(--accent-secondary)',
                  '&:hover': { bgcolor: 'var(--accent-primary)' }
                }}
              >
                Download PDF
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<ShareIcon fontSize="small" />}
                onClick={handleShare}
                sx={{
                  textTransform: 'none',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#ccc',
                  borderColor: '#444',
                  '&:hover': { borderColor: '#666', bgcolor: 'rgba(255,255,255,0.05)' }
                }}
              >
                Share
              </Button>
            </Box>
          </Box>

          {/* Compiled A4 Preview Sheets Wrapper */}
          <Box
            className="college-report-preview-wrapper"
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              width: '100%',
              alignItems: 'center',
              pt: 3,
              pb: 6,
              zoom: zoom,
              transformOrigin: 'top center',
            }}
          >
            
            {/* Page 1: Title Page */}
            <Paper
              className="college-report-editor-paper"
              elevation={8}
              sx={{
                width: '794px', // A4 at 96 DPI
                height: '1123px',
                minHeight: '1123px',
                p: '80px',
                boxSizing: 'border-box',
                bgcolor: '#fff',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: '#000',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* College Logo */}
              <Box sx={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={vardhamanLogo} alt="Vardhaman Logo" style={{ maxHeight: '100px', objectFit: 'contain' }} />
              </Box>

              {/* Course End Report Heading */}
              <Box sx={{ textAlign: 'center', my: '30px' }}>
                <Typography sx={{ fontSize: '15px', fontWeight: 700, fontFamily: 'serif', mb: '12px' }}>
                  A Course End Project Report on
                </Typography>
                <Typography sx={{ fontSize: '20px', fontWeight: 800, fontFamily: 'serif', lineHeight: 1.4, mb: '24px', textTransform: 'uppercase' }}>
                  {reportData.projectTitle || 'Project Title Placeholder'}
                </Typography>
                <Typography sx={{ fontSize: '15px', fontWeight: 700, fontFamily: 'serif', color: '#222' }}>
                  {reportData.courseCodeName || 'Course Code & Title Placeholder'}
                </Typography>
              </Box>

              {/* Submitted By */}
              <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography sx={{ fontSize: '14px', fontWeight: 700, fontFamily: 'serif', mb: '10px' }}>
                  Submitted by
                </Typography>
                <Box sx={{ width: '60%', borderCollapse: 'collapse', border: '0px solid' }}>
                  <Table size="small" sx={{ '& td': { border: 'none', py: '4px', fontSize: '13px', fontFamily: 'serif' } }}>
                    <TableBody>
                      {(reportData.submittedBy || []).map((student, idx) => (
                        <TableRow key={idx}>
                          <TableCell sx={{ fontWeight: 600, color: '#000' }}>{student.name || 'Student Name'}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, color: '#000' }}>{student.roll || 'Roll No.'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              </Box>

              {/* Faculty Facilitator */}
              <Box sx={{ textAlign: 'center', my: '15px' }}>
                <Typography sx={{ fontSize: '13px', fontWeight: 700, fontFamily: 'serif', mb: '4px' }}>
                  Course Facilitator
                </Typography>
                <Typography sx={{ fontSize: '14px', fontWeight: 600, fontFamily: 'serif' }}>
                  {reportData.courseFacilitator || 'Dr. Ch. Madhurya'}
                </Typography>
                <Typography sx={{ fontSize: '12px', fontStyle: 'italic', fontFamily: 'serif', color: '#444' }}>
                  {reportData.courseFacilitatorDesignation || 'Assistant Professor'}
                </Typography>
              </Box>

              {/* Bottom logo and college credits */}
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                <Box sx={{ height: '70px', mb: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={vardhamanLogo} alt="VCE Logo" style={{ maxHeight: '60px', objectFit: 'contain' }} />
                </Box>
                <Typography sx={{ fontSize: '12px', fontWeight: 700, fontFamily: 'serif', letterSpacing: '0.5px', mb: '4px', textAlign: 'center' }}>
                  {reportData.departmentName || 'DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING'}
                </Typography>
                <Typography sx={{ fontSize: '13px', fontWeight: 700, fontFamily: 'serif', color: '#222', textAlign: 'center', mb: '4px' }}>
                  {reportData.collegeName || 'Vardhaman College of Engineering, Hyderabad'}
                </Typography>
                <Typography sx={{ fontSize: '12px', fontWeight: 600, fontFamily: 'serif', color: '#444' }}>
                  {reportData.monthYear || 'March 2025'}
                </Typography>
              </Box>
            </Paper>

            {/* Page 2: Certification Page */}
            <Paper
              className="college-report-editor-paper"
              elevation={8}
              sx={{
                width: '794px',
                height: '1123px',
                minHeight: '1123px',
                p: '80px',
                boxSizing: 'border-box',
                bgcolor: '#fff',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                color: '#000',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Header block with logos */}
              <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: '16px', borderBottom: '2px solid #000' }}>
                <Box sx={{ width: '80px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={vardhamanLogo} alt="Vardhaman Logo" style={{ maxHeight: '60px', maxWidth: '80px', objectFit: 'contain' }} />
                </Box>
                
                <Box sx={{ flex: 1, mx: '12px', px: '12px', borderLeft: '1px solid #000', textAlign: 'center' }}>
                  <Typography sx={{ fontSize: '9px', fontWeight: 700, fontFamily: 'sans-serif', lineHeight: 1.3 }}>
                    Autonomous Institute, Affiliated to JNTUH,<br/>
                    Approved by AICTE, Accredited by NAAC with A++ Grade<br/>
                    Kacharam, Shamshabad, Hyderabad - 501 218,<br/>
                    Telangana, India.
                  </Typography>
                </Box>

                <Box sx={{ width: '80px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={logo25Years} alt="25 Years Logo" style={{ maxHeight: '60px', maxWidth: '80px', objectFit: 'contain' }} />
                </Box>
              </Box>

              {/* Department title */}
              <Box sx={{ width: '100%', textAlign: 'center', my: '20px' }}>
                <Typography sx={{ fontSize: '13px', fontWeight: 700, fontFamily: 'serif', letterSpacing: '0.8px', textDecoration: 'underline' }}>
                  {reportData.departmentName || 'DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING'}
                </Typography>
              </Box>

              {/* Body certification text */}
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', my: '20px' }}>
                <Typography sx={{ fontSize: '18px', fontWeight: 800, textAlign: 'center', mb: '30px', fontFamily: 'serif', letterSpacing: '1px' }}>
                  CERTIFICATE
                </Typography>
                
                <Typography sx={{ fontSize: '13px', lineHeight: 2, textAlign: 'justify', fontFamily: 'serif', textIndent: '32px' }}>
                  This is to certify that the Course End Project titled <b>“{reportData.projectTitle || 'Project Title'}”</b> is carried out by <b>
                    {(reportData.submittedBy || []).map(s => s.name).join(', ') || 'Student Names'}
                  </b> with Roll Numbers <b>
                    {(reportData.submittedBy || []).map(s => s.roll).join(', ') || 'Roll Numbers'}
                  </b> towards <b>{reportData.courseCodeName || 'Course Name'}</b> course in partial fulfillment of the requirements for the award of degree of <b>Bachelor of Technology in Computer Science and Engineering</b> during the Academic year <b>{reportData.academicYear || '2025--26'}</b>.
                </Typography>
              </Box>

              {/* Signatures block at the bottom */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mt: '60px', mb: '20px' }}>
                <Box sx={{ width: '45%', display: 'flex', flexDirection: 'column' }}>
                  <Typography sx={{ fontSize: '12px', fontWeight: 700, fontFamily: 'serif', mb: '30px' }}>
                    Signature of the Course Faculty
                  </Typography>
                  <Typography sx={{ fontSize: '13px', fontWeight: 600, fontFamily: 'serif' }}>
                    {reportData.courseFacilitator || 'Dr. Ch. Madhurya'}
                  </Typography>
                  <Typography sx={{ fontSize: '11px', fontFamily: 'serif', color: '#444' }}>
                    {reportData.courseFacilitatorDesignation || 'Assistant Professor'}, CSE
                  </Typography>
                </Box>

                <Box sx={{ width: '35%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Typography sx={{ fontSize: '12px', fontWeight: 700, fontFamily: 'serif', mb: '30px' }}>
                    Signature of the HOD
                  </Typography>
                  <Typography sx={{ fontSize: '13px', fontWeight: 600, fontFamily: 'serif' }}>
                    {reportData.hodName || 'Dr. Gagandeep Arora'}
                  </Typography>
                  <Typography sx={{ fontSize: '11px', fontFamily: 'serif', color: '#444' }}>
                    {reportData.hodDesignation || 'HOD'}, CSE
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {/* Page 3: Table of Contents */}
            <Paper
              className="college-report-editor-paper"
              elevation={8}
              sx={{
                width: '794px',
                height: '1123px',
                minHeight: '1123px',
                p: '80px',
                boxSizing: 'border-box',
                bgcolor: '#fff',
                display: 'flex',
                flexDirection: 'column',
                color: '#000',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <Typography variant="h5" sx={{ fontSize: '18px', fontWeight: 800, textAlign: 'center', mb: '40px', fontFamily: 'serif', textTransform: 'uppercase' }}>
                Table of Contents
              </Typography>

              {/* TOC Table list with dot leaders */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', mt: '10px' }}>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #aaa', pb: '4px' }}>
                  <Typography sx={{ fontSize: '13px', fontWeight: 600, fontFamily: 'serif' }}>Abstract</Typography>
                  <Typography sx={{ fontSize: '13px', fontWeight: 600, fontFamily: 'serif' }}>{tocPageNumbers['abstract'] || 'iv'}</Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #aaa', pb: '4px' }}>
                  <Typography sx={{ fontSize: '13px', fontWeight: 600, fontFamily: 'serif' }}>1. Introduction</Typography>
                  <Typography sx={{ fontSize: '13px', fontWeight: 600, fontFamily: 'serif' }}>{tocPageNumbers['introduction'] || '5'}</Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #aaa', pb: '4px' }}>
                  <Typography sx={{ fontSize: '13px', fontWeight: 600, fontFamily: 'serif' }}>2. Proposed Methodology</Typography>
                  <Typography sx={{ fontSize: '13px', fontWeight: 600, fontFamily: 'serif' }}>{tocPageNumbers['proposedMethodology'] || '5'}</Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #aaa', pb: '4px' }}>
                  <Typography sx={{ fontSize: '13px', fontWeight: 600, fontFamily: 'serif' }}>3. Objectives</Typography>
                  <Typography sx={{ fontSize: '13px', fontWeight: 600, fontFamily: 'serif' }}>{tocPageNumbers['objectives'] || '5'}</Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #aaa', pb: '4px' }}>
                  <Typography sx={{ fontSize: '13px', fontWeight: 600, fontFamily: 'serif' }}>4. Implementation</Typography>
                  <Typography sx={{ fontSize: '13px', fontWeight: 600, fontFamily: 'serif' }}>{tocPageNumbers['implementation'] || '6'}</Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #aaa', pb: '4px', pl: '20px' }}>
                  <Typography sx={{ fontSize: '12px', fontStyle: 'italic', fontFamily: 'serif' }}>4.1 Block Diagram</Typography>
                  <Typography sx={{ fontSize: '12px', fontStyle: 'italic', fontFamily: 'serif' }}>{tocPageNumbers['implementation'] || '6'}</Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #aaa', pb: '4px', pl: '20px' }}>
                  <Typography sx={{ fontSize: '12px', fontStyle: 'italic', fontFamily: 'serif' }}>4.2 Working Principle</Typography>
                  <Typography sx={{ fontSize: '12px', fontStyle: 'italic', fontFamily: 'serif' }}>{tocPageNumbers['implementation'] || '6'}</Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #aaa', pb: '4px', pl: '20px' }}>
                  <Typography sx={{ fontSize: '12px', fontStyle: 'italic', fontFamily: 'serif' }}>4.3 Software Implementation</Typography>
                  <Typography sx={{ fontSize: '12px', fontStyle: 'italic', fontFamily: 'serif' }}>{tocPageNumbers['implementation'] || '6'}</Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #aaa', pb: '4px' }}>
                  <Typography sx={{ fontSize: '13px', fontWeight: 600, fontFamily: 'serif' }}>5. Results and Discussion</Typography>
                  <Typography sx={{ fontSize: '13px', fontWeight: 600, fontFamily: 'serif' }}>{tocPageNumbers['resultsAndDiscussion'] || '7'}</Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #aaa', pb: '4px', pl: '20px' }}>
                  <Typography sx={{ fontSize: '12px', fontStyle: 'italic', fontFamily: 'serif' }}>5.1 Results</Typography>
                  <Typography sx={{ fontSize: '12px', fontStyle: 'italic', fontFamily: 'serif' }}>{tocPageNumbers['resultsAndDiscussion'] || '7'}</Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #aaa', pb: '4px', pl: '20px' }}>
                  <Typography sx={{ fontSize: '12px', fontStyle: 'italic', fontFamily: 'serif' }}>5.2 Discussion</Typography>
                  <Typography sx={{ fontSize: '12px', fontStyle: 'italic', fontFamily: 'serif' }}>{tocPageNumbers['resultsAndDiscussion'] || '7'}</Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #aaa', pb: '4px' }}>
                  <Typography sx={{ fontSize: '13px', fontWeight: 600, fontFamily: 'serif' }}>6. Program Outcomes (POs) Mapping</Typography>
                  <Typography sx={{ fontSize: '13px', fontWeight: 600, fontFamily: 'serif' }}>{tocPageNumbers['poMapping'] || '8'}</Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #aaa', pb: '4px' }}>
                  <Typography sx={{ fontSize: '13px', fontWeight: 600, fontFamily: 'serif' }}>7. Conclusion</Typography>
                  <Typography sx={{ fontSize: '13px', fontWeight: 600, fontFamily: 'serif' }}>{tocPageNumbers['conclusion'] || '9'}</Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #aaa', pb: '4px' }}>
                  <Typography sx={{ fontSize: '13px', fontWeight: 600, fontFamily: 'serif' }}>Bibliography</Typography>
                  <Typography sx={{ fontSize: '13px', fontWeight: 600, fontFamily: 'serif' }}>{tocPageNumbers['bibliography'] || '9'}</Typography>
                </Box>
              </Box>

              <Box sx={{ flex: 1 }} />
              <Typography sx={{ fontSize: '11px', textAlign: 'center', fontFamily: 'serif' }}>iii</Typography>
            </Paper>

            {/* Page 4: Abstract Page */}
            <Paper
              className="college-report-editor-paper"
              elevation={8}
              sx={{
                width: '794px',
                height: '1123px',
                minHeight: '1123px',
                p: '80px',
                boxSizing: 'border-box',
                bgcolor: '#fff',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                color: '#000',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <Box>
                <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 700, color: '#000', borderBottom: '1px solid #000', pb: '4px', mb: '20px', textTransform: 'uppercase', fontFamily: 'serif', textAlign: 'center' }}>
                  Abstract
                </Typography>
                <Typography sx={{ fontSize: '13px', lineHeight: 1.8, color: '#111', textIndent: '24px', textAlign: 'justify', whiteSpace: 'pre-wrap', fontFamily: 'serif', mb: '24px' }}>
                  {reportData.abstract || 'Add abstract details...'}
                </Typography>
                <Typography sx={{ fontSize: '13px', lineHeight: 1.6, color: '#000', fontFamily: 'serif', textAlign: 'justify', mb: '16px' }}>
                  <b>Keywords</b>: {reportData.keywords || 'Add keywords...'}
                </Typography>
                {(reportData.abstractImageUrl || reportData.abstractImageCaption) && renderSectionImageBlock(reportData.abstractImageUrl, reportData.abstractImageCaption, reportData.abstractImageHeight, reportData.abstractImageWidth)}
              </Box>

              <Typography sx={{ fontSize: '11px', textAlign: 'center', fontFamily: 'serif' }}>iv</Typography>
            </Paper>

            {/* Page 5 onwards: Dynamic Body Pages */}
            {paginatedPages.map((pageBlocks, pageIdx) => (
              <Paper
                key={pageIdx}
                className="college-report-editor-paper"
                elevation={8}
                sx={{
                  width: '794px',
                  height: '1123px',
                  minHeight: '1123px',
                  p: '80px',
                  boxSizing: 'border-box',
                  bgcolor: '#fff',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  color: '#000',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <Box sx={{ flex: 1 }}>
                  {pageBlocks.map(block => renderBlock(block.type, block.id, block))}
                </Box>

                {/* Footer Page Number */}
                <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, bgcolor: '#fff', py: '12px', zIndex: 2 }}>
                  <Typography sx={{ fontSize: '11px', textAlign: 'center', fontFamily: 'serif' }}>
                    {5 + pageIdx}
                  </Typography>
                </Box>
              </Paper>
            ))}

          </Box>
        </Grid>
        )}
      </Grid>

      {/* Hidden Measurement Container */}
      <Box
        ref={measurementRef}
        sx={{
          position: 'absolute',
          left: '-9999px',
          top: '-9999px',
          width: '634px', // 794px minus 80px * 2 padding
          visibility: 'hidden',
          pointerEvents: 'none'
        }}
      >
        {getMeasurementBlocks(reportData).map(block => renderBlock(block.type, block.id, block))}
      </Box>

      {/* Feedback Toast */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} severity={snackbar.severity} sx={{ width: '100%', borderRadius: '8px' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CollegeReportEditor;
