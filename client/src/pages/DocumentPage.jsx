import React, { useEffect, useState } from 'react';
import { Box, Typography, IconButton, Tab, Tabs, Tooltip, CircularProgress, Paper, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CommentIcon from '@mui/icons-material/Comment';
import DynamicFeedIcon from '@mui/icons-material/DynamicFeed';
import HistoryIcon from '@mui/icons-material/History';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SaveIcon from '@mui/icons-material/Save';
import PeopleIcon from '@mui/icons-material/People';
import { useParams, useNavigate } from 'react-router-dom';
import Quill from 'quill';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Document as DocxDocument, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { generateResumePDF } from '../utils/resumePdfGenerator';
import { useSocket } from '../contexts/SocketContext';
import html2pdf from 'html2pdf.js';
import { downloadResumeDOCX } from '../utils/resumeDocxGenerator';
import { documentService } from '../services/documentService';
import { commentService } from '../services/commentService';
import { DocumentEditor } from '../components/DocumentEditor';
import { ResumeEditor } from '../components/ResumeEditor';
import { ProposalEditor } from '../components/ProposalEditor';
import { CollegeReportEditor } from '../components/CollegeReportEditor';
import { ActivePresence } from '../components/ActivePresence';
import { CommentsPanel } from '../components/CommentsPanel';
import { SuggestionsPanel } from '../components/SuggestionsPanel';
import { VersionHistory } from '../components/VersionHistory';
import { ActivityFeed } from '../components/ActivityFeed';
import { MenuBar } from '../components/MenuBar';
import { FindReplaceBar } from '../components/FindReplaceBar';
import { CollaboratorsPanel } from '../components/CollaboratorsPanel';

export const DocumentPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();

  const [doc, setDoc] = useState(null);
  const [userRole, setUserRole] = useState('VIEWER');
  const [loading, setLoading] = useState(true);
  const [presence, setPresence] = useState([]);
  const [collaborators, setCollaborators] = useState({});

  const [quill, setQuill] = useState(null);
  const [currentSelection, setCurrentSelection] = useState(null);
  const [selectedText, setSelectedText] = useState('');
  const [restoreContent, setRestoreContent] = useState(null);

  const [activePanel, setActivePanel] = useState(null);

  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);

  const [findReplaceOpen, setFindReplaceOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const fetchDocumentDetails = async () => {
    if (!id) return;
    try {
      const data = await documentService.getDocumentById(id);
      setDoc(data.document);
      setUserRole(data.userRole);
    } catch (err) {
      console.error('Failed to load document details:', err);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocumentDetails();
  }, [id]);

  useEffect(() => {
    if (!socket || !id) return;

    socket.emit('join-document', { documentId: id });

    const handlePresenceUpdate = (presenceArray) => {
      setCollaborators(prev => {
        const next = {};
        presenceArray.forEach(p => {
          const existing = prev[p.socketId];
          next[p.socketId] = {
            ...p,
            lastActive: existing ? existing.lastActive : Date.now(),
          };
        });
        return next;
      });
      setPresence(presenceArray);
    };

    const handleCursorUpdate = (cursorData) => {
      setCollaborators(prev => {
        if (!prev[cursorData.socketId]) return prev;
        return {
          ...prev,
          [cursorData.socketId]: {
            ...prev[cursorData.socketId],
            range: cursorData.range,
            lastActive: Date.now(),
          }
        };
      });
    };

    socket.on('presence-update', handlePresenceUpdate);
    socket.on('cursor-update', handleCursorUpdate);

    return () => {
      socket.emit('leave-document', { documentId: id });
      socket.off('presence-update', handlePresenceUpdate);
      socket.off('cursor-update', handleCursorUpdate);
    };
  }, [socket, id]);

  const handleSelectionChange = (range, text) => {
    setCurrentSelection(range);
    setSelectedText(text);

    // Update current user's local presence range and lastActive
    setCollaborators(prev => {
      if (!socket) return prev;
      const sid = socket.id;
      if (!prev[sid]) return prev;
      return {
        ...prev,
        [sid]: {
          ...prev[sid],
          range,
          lastActive: Date.now(),
        }
      };
    });
  };

  const handleEditorReady = (quillInstance) => {
    setQuill(quillInstance);
  };

  const handleAcceptSuggestion = async (suggestion) => {
    if (!quill || !id) return;

    const Delta = Quill.import('delta');
    const changeDelta = new Delta()
      .retain(suggestion.range.index)
      .delete(suggestion.range.length)
      .insert(suggestion.suggestedText);
    
    quill.updateContents(changeDelta, 'user');

    await commentService.acceptSuggestion(id, suggestion._id, quill.getContents());
  };

  const handleRestoreVersionContent = (content) => {
    setRestoreContent(content);
  };

  const handleManualSave = () => {
    const isResume = doc?.type === 'RESUME';
    const isProposal = doc?.type === 'PROPOSAL';
    const isReport = doc?.type === 'COLLEGE_REPORT';
    if (!isResume && !isProposal && !isReport && (!quill || !id)) return;
    setSaveTitle(doc?.title || 'Untitled Document');
    setSaveDialogOpen(true);
  };

  const handleSaveConfirm = async () => {
    const isResume = doc?.type === 'RESUME';
    const isProposal = doc?.type === 'PROPOSAL';
    const isReport = doc?.type === 'COLLEGE_REPORT';
    if (!isResume && !isProposal && !isReport && (!quill || !id)) return;
    setSaveLoading(true);
    try {
      const payload = {
        title: saveTitle || 'Untitled Document'
      };
      if (!isResume && !isProposal && !isReport) {
        payload.content = quill.getContents();
      }
      const updated = await documentService.updateDocument(id, payload);
      setDoc(updated);
      setSaveDialogOpen(false);
      alert('Document saved successfully. Your local PDF download will now start.');
      await handleExportPDF();
    } catch (err) {
      console.error('Failed to save document:', err);
      alert('Failed to save document.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleNewDocument = async () => {
    try {
      const newDoc = await documentService.createDocument();
      navigate(`/document/${newDoc._id}`);
    } catch (err) {
      console.error('Failed to create new document:', err);
    }
  };

  const handleExportPDF = async () => {
    const isResume = doc?.type === 'RESUME';
    const isProposal = doc?.type === 'PROPOSAL';
    const isReport = doc?.type === 'COLLEGE_REPORT';

    if (isProposal || isReport) {
      const pages = document.querySelectorAll(isReport ? '.college-report-editor-paper' : '.proposal-editor-paper');
      const wrapper = isReport ? document.querySelector('.college-report-preview-wrapper') : null;
      if (pages.length === 0) {
        alert(isReport ? 'Report preview not found.' : 'Proposal preview not found.');
        return;
      }

      const originalZoom = wrapper ? wrapper.style.zoom : '';

      try {
        if (wrapper) {
          wrapper.style.zoom = '1';
        }

        // Wait for layout updates to apply after resetting zoom
        await new Promise(r => setTimeout(r, 150));

        const docPdf = new jsPDF('p', 'mm', 'a4');
        for (let i = 0; i < pages.length; i++) {
          if (i > 0) docPdf.addPage();
          const canvas = await html2canvas(pages[i], {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            width: pages[i].offsetWidth,
            height: pages[i].offsetHeight
          });
          const imgData = canvas.toDataURL('image/jpeg', 0.95);
          docPdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);

          // Preserve clickable hyperlink annotations in the PDF
          const links = pages[i].querySelectorAll('a');
          links.forEach(linkEl => {
            const href = linkEl.getAttribute('href');
            if (href) {
              const rect = linkEl.getBoundingClientRect();
              const pageRect = pages[i].getBoundingClientRect();
              const relLeft = rect.left - pageRect.left;
              const relTop = rect.top - pageRect.top;
              
              if (rect.width > 0 && rect.height > 0) {
                const x = relLeft * (210 / pages[i].offsetWidth);
                const y = relTop * (297 / pages[i].offsetHeight);
                const w = rect.width * (210 / pages[i].offsetWidth);
                const h = rect.height * (297 / pages[i].offsetHeight);
                docPdf.link(x, y, w, h, { url: href });
              }
            }
          });
        }
        docPdf.save(`${doc?.title || (isReport ? 'college-report' : 'proposal')}.pdf`);

        if (wrapper) {
          wrapper.style.zoom = originalZoom;
        }
      } catch (err) {
        console.error(err);
        alert('Failed to export PDF.');
        if (wrapper) {
          wrapper.style.zoom = originalZoom;
        }
      }
      return;
    }

    if (!isResume) {
      // Standard paginated document export
      const pageStack = document.querySelector('.page-stack-container');
      if (!pageStack) {
        alert('Editor content not found.');
        return;
      }

      try {
        const originalTransform = pageStack.style.transform;
        const originalTransition = pageStack.style.transition;
        
        // Temporarily reset transform for clean capture
        pageStack.style.transform = 'none';
        pageStack.style.transition = 'none';

        const canvas = await html2canvas(pageStack, {
          scale: 2, // high resolution
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
        });

        // Restore zoom transform
        pageStack.style.transform = originalTransform;
        pageStack.style.transition = originalTransition;

        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = 794;   // pixel width of A4 at 96 DPI
        const pageHeight = 1123;  // pixel height of A4 at 96 DPI
        const gap = 40;           // gap between pages in px

        const scale = canvas.width / pageWidth; // html2canvas scale factor

        // Compute total pages from the canvas height
        const totalPages = Math.max(1, Math.round((canvas.height / scale + gap) / (pageHeight + gap)));

        for (let i = 0; i < totalPages; i++) {
          if (i > 0) pdf.addPage();

          const pageTop = i * (pageHeight + gap);

          // Create a canvas for the single page
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = pageWidth * 2; // high quality export
          pageCanvas.height = pageHeight * 2;
          const ctx = pageCanvas.getContext('2d');

          // Crop page from the giant canvas
          ctx.drawImage(
            canvas,
            0, pageTop * scale, pageWidth * scale, pageHeight * scale, // source
            0, 0, pageWidth * 2, pageHeight * 2                       // destination
          );

          const imgData = pageCanvas.toDataURL('image/jpeg', 0.95);
          pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
        }

        pdf.save(`${doc?.title || 'document'}.pdf`);
      } catch (err) {
        console.error('Failed to export PDF:', err);
        alert('Failed to export PDF.');
      }
      return;
    }
    
    // High-quality page-by-page resume PDF export
    const wrapper = document.querySelector('.resume-preview-pages-wrapper');
    const pages = document.querySelectorAll('.resume-preview-paper');
    if (pages.length === 0) {
      alert('Resume preview not found.');
      return;
    }

    const originalTransform = wrapper ? wrapper.style.transform : '';
    const originalHeight = wrapper ? wrapper.style.height : '';
    const originalTransition = wrapper ? wrapper.style.transition : '';

    try {
      if (wrapper) {
        wrapper.style.transform = 'none';
        wrapper.style.height = 'auto';
        wrapper.style.transition = 'none';
      }

      // Wait for layout updates to complete after resetting scale
      await new Promise(r => setTimeout(r, 150));

      const pdf = new jsPDF('p', 'mm', 'a4');
      for (let i = 0; i < pages.length; i++) {
        if (i > 0) pdf.addPage();

        // Temporarily clear box shadow and margin bottom for print output
        const originalBoxShadow = pages[i].style.boxShadow;
        const originalMarginBottom = pages[i].style.marginBottom;
        pages[i].style.boxShadow = 'none';
        pages[i].style.marginBottom = '0';

        const canvas = await html2canvas(pages[i], {
          scale: 3, // High quality text rendering
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          width: pages[i].offsetWidth,
          height: pages[i].offsetHeight
        });

        // Restore styles immediately
        pages[i].style.boxShadow = originalBoxShadow;
        pages[i].style.marginBottom = originalMarginBottom;

        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);

        // Preserve clickable hyperlink annotations in the PDF
        const links = pages[i].querySelectorAll('a');
        links.forEach(linkEl => {
          const href = linkEl.getAttribute('href');
          if (href) {
            const rect = linkEl.getBoundingClientRect();
            const pageRect = pages[i].getBoundingClientRect();
            const relLeft = rect.left - pageRect.left;
            const relTop = rect.top - pageRect.top;
            
            if (rect.width > 0 && rect.height > 0) {
              const x = relLeft * (210 / pages[i].offsetWidth);
              const y = relTop * (297 / pages[i].offsetHeight);
              const w = rect.width * (210 / pages[i].offsetWidth);
              const h = rect.height * (297 / pages[i].offsetHeight);
              pdf.link(x, y, w, h, { url: href });
            }
          }
        });
      }

      pdf.save(`${doc?.title || 'resume'}.pdf`);

      if (wrapper) {
        wrapper.style.transform = originalTransform;
        wrapper.style.height = originalHeight;
        wrapper.style.transition = originalTransition;
      }
    } catch (err) {
      console.error('Failed to export resume PDF:', err);
      alert('Failed to export PDF.');
      if (wrapper) {
        wrapper.style.transform = originalTransform;
        wrapper.style.height = originalHeight;
        wrapper.style.transition = originalTransition;
      }
    }
  };

  // ── Export as DOCX ─────────────────────────────────────────────────────────
  const handleExportDOCX = async () => {
    const isResume = doc?.type === 'RESUME';
    if (isResume) {
      try {
        await downloadResumeDOCX(doc.resumeData, doc?.title || 'resume');
      } catch (err) {
        console.error('Failed to export DOCX:', err);
        alert('Failed to export DOCX.');
      }
      return;
    }

    if (!quill) return;
    const delta = quill.getContents();

    const paragraphs = [];
    let currentRuns = [];
    let currentLineAttrs = {};

    const flushParagraph = (lineAttrs = {}) => {
      const heading =
        lineAttrs.header === 1 ? HeadingLevel.HEADING_1 :
        lineAttrs.header === 2 ? HeadingLevel.HEADING_2 :
        lineAttrs.header === 3 ? HeadingLevel.HEADING_3 :
        lineAttrs.header === 4 ? HeadingLevel.HEADING_4 : undefined;
      const align =
        lineAttrs.align === 'center'  ? AlignmentType.CENTER :
        lineAttrs.align === 'right'   ? AlignmentType.RIGHT  :
        lineAttrs.align === 'justify' ? AlignmentType.JUSTIFIED : AlignmentType.LEFT;
      paragraphs.push(
        new Paragraph({ children: currentRuns.length ? currentRuns : [new TextRun('')], heading, alignment: align })
      );
      currentRuns = [];
      currentLineAttrs = {};
    };

    for (const op of delta.ops) {
      if (typeof op.insert !== 'string') continue; // skip embeds (images)
      const attrs = op.attributes || {};
      const segments = op.insert.split('\n');

      segments.forEach((seg, idx) => {
        if (seg) {
          currentRuns.push(new TextRun({
            text: seg,
            bold:       attrs.bold      || false,
            italics:    attrs.italic    || false,
            underline:  attrs.underline ? {} : undefined,
            strike:     attrs.strike    || false,
            color:      attrs.color    ? attrs.color.replace('#', '') : undefined,
            font:       attrs.font     || 'Calibri',
            size:       attrs.size     ? parseInt(attrs.size) * 2 : 24, // half-points; 12pt = 24
            superScript: attrs.script === 'super' || false,
            subScript:   attrs.script === 'sub'   || false,
          }));
        }
        if (idx < segments.length - 1) {
          // A '\n' in Quill carries line-level attributes on the op
          flushParagraph(attrs);
        }
      });
    }
    if (currentRuns.length) flushParagraph(currentLineAttrs);

    try {
      const docx = new DocxDocument({ sections: [{ children: paragraphs }] });
      const blob = await Packer.toBlob(docx);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${doc?.title || 'document'}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('DOCX export failed:', err);
      alert('Failed to export DOCX.');
    }
  };

  // ── Export as TXT ──────────────────────────────────────────────────────────
  const handleExportTXT = () => {
    if (!quill) return;
    const text = quill.getText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${doc?.title || 'document'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const changeFontSize = (direction) => {
    if (!quill) return;
    quill.focus();
    const currentFormat = quill.getFormat();
    const sizes = ['small', false, 'large', 'huge'];
    const currentIndex = sizes.indexOf(currentFormat.size || false);

    if (direction === 'increase' && currentIndex < sizes.length - 1) {
      quill.format('size', sizes[currentIndex + 1]);
    } else if (direction === 'decrease' && currentIndex > 0) {
      quill.format('size', sizes[currentIndex - 1]);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      const isMac = /Mac/i.test(navigator.platform);
      const isMod = isMac ? e.metaKey : e.ctrlKey;
      const isAlt = isMac ? e.altKey : e.altKey;

      // Cmd/Ctrl + S: Save
      if (isMod && e.key.toLowerCase() === 's' && !e.shiftKey) {
        e.preventDefault();
        handleManualSave();
      }
      // Cmd/Ctrl + Shift + S: Save As
      if (isMod && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        setSaveDialogOpen(true);
      }
      // Cmd/Ctrl + N: New document
      if (isMod && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleNewDocument();
      }
      // Cmd/Ctrl + O: Open document (Dashboard)
      if (isMod && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        navigate('/dashboard');
      }
      // Cmd/Ctrl + P: Print
      if (isMod && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        window.print();
      }
      // Cmd/Ctrl + F: Find & Replace
      if (isMod && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setFindReplaceOpen(prev => !prev);
      }
      // Cmd/Ctrl + H: Find & Replace
      if (isMod && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        setFindReplaceOpen(true);
      }

      // Formatting shortcuts inside focused editor
      if (quill && quill.hasFocus()) {
        // Heading 1: Cmd/Ctrl + Option/Alt + 1
        if (isMod && isAlt && e.key === '1') {
          e.preventDefault();
          const current = quill.getFormat().header;
          quill.format('header', current === 1 ? false : 1);
        }
        // Heading 2: Cmd/Ctrl + Option/Alt + 2
        if (isMod && isAlt && e.key === '2') {
          e.preventDefault();
          const current = quill.getFormat().header;
          quill.format('header', current === 2 ? false : 2);
        }
        // Heading 3: Cmd/Ctrl + Option/Alt + 3
        if (isMod && isAlt && e.key === '3') {
          e.preventDefault();
          const current = quill.getFormat().header;
          quill.format('header', current === 3 ? false : 3);
        }
        // Bullet List: Cmd/Ctrl + Shift + L
        if (isMod && e.shiftKey && e.key.toLowerCase() === 'l') {
          e.preventDefault();
          const current = quill.getFormat().list;
          quill.format('list', current === 'bullet' ? false : 'bullet');
        }
        // Numbered List: Cmd/Ctrl + Option/Alt + L
        if (isMod && isAlt && e.key.toLowerCase() === 'l') {
          e.preventDefault();
          const current = quill.getFormat().list;
          quill.format('list', current === 'ordered' ? false : 'ordered');
        }
        // Hyperlink: Cmd/Ctrl + K
        if (isMod && e.key.toLowerCase() === 'k') {
          e.preventDefault();
          const url = prompt('Enter hyperlink URL:');
          if (url) quill.format('link', url);
        }
        // Increase Font Size: Cmd/Ctrl + Shift + >
        if (isMod && e.shiftKey && e.key === '>') {
          e.preventDefault();
          changeFontSize('increase');
        }
        // Decrease Font Size: Cmd/Ctrl + Shift + <
        if (isMod && e.shiftKey && e.key === '<') {
          e.preventDefault();
          changeFontSize('decrease');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [quill, doc]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', bgcolor: '#0b0b0e' }}>
        <CircularProgress color="secondary" />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#0b0b0e', overflow: 'hidden' }}>
      {/* Left Column: Scrollable Workspace (Header, MenuBar, Editor) */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          height: '100vh',
          overflowY: doc?.type === 'RESUME' || doc?.type === 'PROPOSAL' || doc?.type === 'COLLEGE_REPORT' ? 'hidden' : 'auto',
        }}
      >
        <Box className="no-print" sx={{ borderBottom: '1px solid var(--border-color)', py: 1.5, background: 'var(--bg-secondary)', px: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => navigate('/dashboard')} sx={{ color: 'var(--text-muted)' }}>
              <ArrowBackIcon />
            </IconButton>
            <Box>
              <Typography variant="subtitle1" noWrap sx={{ fontWeight: 700, maxWidth: 300 }}>
                {doc?.title || 'Untitled Document'}
              </Typography>
              <Typography variant="caption" color="var(--text-muted)">
                Role: {userRole}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <ActivePresence presence={presence} />

            {userRole !== 'VIEWER' && (
              <Tooltip title="Force Save">
                <IconButton onClick={handleManualSave} sx={{ color: 'var(--text-muted)', '&:hover': { color: 'var(--accent-secondary)' } }}>
                  <SaveIcon />
                </IconButton>
              </Tooltip>
            )}

            <Tabs
              value={activePanel || false}
              onChange={(_, val) => setActivePanel(val || null)}
              sx={{
                minHeight: 40,
                '& .MuiTabs-indicator': { backgroundColor: 'var(--accent-secondary)' },
                '& .MuiTab-root': { minHeight: 40, py: 0, textTransform: 'none', color: 'var(--text-muted)', '&.Mui-selected': { color: '#fff' } }
              }}
            >
              <Tab icon={<CommentIcon fontSize="small" />} iconPosition="start" label="Comments" value="comments" />
              <Tab icon={<DynamicFeedIcon fontSize="small" />} iconPosition="start" label="Suggestions" value="suggestions" />
              <Tab icon={<HistoryIcon fontSize="small" />} iconPosition="start" label="Versions" value="versions" />
              <Tab icon={<AssessmentIcon fontSize="small" />} iconPosition="start" label="Logs" value="activity" />
              <Tab icon={<PeopleIcon fontSize="small" />} iconPosition="start" label="Collaborators" value="collaborators" />
            </Tabs>
          </Box>
        </Box>

        <Box className="no-print">
          <MenuBar
            quill={quill}
            onNewDocument={handleNewDocument}
            onOpenDocument={() => navigate('/dashboard')}
            onSave={handleManualSave}
            onSaveAs={() => setSaveDialogOpen(true)}
            onPrint={() => window.print()}
            onExportPDF={handleExportPDF}
            onExportDOCX={handleExportDOCX}
            onExportTXT={handleExportTXT}
            onFindReplace={() => setFindReplaceOpen(prev => !prev)}
            onShowShortcuts={() => setShortcutsOpen(true)}
          />
        </Box>

        <Box
          className="main-workspace-content"
          sx={{
            flex: 1,
            p: doc?.type === 'RESUME' || doc?.type === 'PROPOSAL' || doc?.type === 'COLLEGE_REPORT' ? 3 : 0,
            boxSizing: 'border-box',
            overflow: doc?.type === 'RESUME' || doc?.type === 'PROPOSAL' || doc?.type === 'COLLEGE_REPORT' ? 'hidden' : 'visible',
            position: 'relative',
          }}
        >
          {doc && id && doc.type === 'PROPOSAL' ? (
            <ProposalEditor
              documentId={id}
              userRole={userRole}
              initialProposalData={doc.proposalData}
              restoreContent={restoreContent}
              onSelectionChange={handleSelectionChange}
            />
          ) : doc && id && doc.type === 'COLLEGE_REPORT' ? (
            <CollegeReportEditor
              documentId={id}
              userRole={userRole}
              initialReportData={doc.collegeReportData}
              restoreContent={restoreContent}
              onSelectionChange={handleSelectionChange}
            />
          ) : doc && id && doc.type === 'RESUME' ? (
            <ResumeEditor
              documentId={id}
              userRole={userRole}
              initialResumeData={doc.resumeData}
              restoreContent={restoreContent}
              onSelectionChange={handleSelectionChange}
            />
          ) : doc && id ? (
            <DocumentEditor
              documentId={id}
              userRole={userRole}
              initialContent={doc.content}
              restoreContent={restoreContent}
              onSelectionChange={handleSelectionChange}
              presence={presence}
              onEditorReady={handleEditorReady}
            />
          ) : null}
          {doc?.type !== 'RESUME' && doc?.type !== 'PROPOSAL' && (
            <FindReplaceBar
              quill={quill}
              isOpen={findReplaceOpen}
              onClose={() => setFindReplaceOpen(false)}
            />
          )}
        </Box>
      </Box>

      {/* Right Column: Fixed Sidebar */}
      {activePanel && id && (
        <Paper
          className="no-print"
          square
          sx={{
            width: 320,
            borderLeft: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            overflow: 'hidden',
            boxShadow: '-4px 0 20px rgba(0,0,0,0.25)',
          }}
        >
          {activePanel === 'comments' && (
            <CommentsPanel
              documentId={id}
              userRole={userRole}
              currentSelection={currentSelection}
              selectedText={selectedText}
            />
          )}
            {activePanel === 'suggestions' && (
              <SuggestionsPanel
                documentId={id}
                userRole={userRole}
                currentSelection={currentSelection}
                selectedText={selectedText}
                onAccept={handleAcceptSuggestion}
              />
            )}
            {activePanel === 'versions' && (
              <VersionHistory
                documentId={id}
                userRole={userRole}
                onRestore={handleRestoreVersionContent}
              />
            )}
            {activePanel === 'activity' && (
              <ActivityFeed documentId={id} />
            )}
            {activePanel === 'collaborators' && (
              <CollaboratorsPanel collaborators={collaborators} />
            )}
          </Paper>
        )}

      {/* Save Document Dialog */}
      <Dialog
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
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
        <DialogTitle sx={{ fontWeight: 600 }}>Save Document As</DialogTitle>
        <DialogContent>
          <TextField
            label="Document Title"
            variant="outlined"
            fullWidth
            size="small"
            value={saveTitle}
            onChange={(e) => setSaveTitle(e.target.value)}
            sx={{ mt: 1.5 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSaveDialogOpen(false)} color="inherit" sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveConfirm}
            variant="contained"
            disabled={saveLoading}
            sx={{ textTransform: 'none', background: 'var(--accent-primary)', '&:hover': { background: 'var(--accent-secondary)' } }}
          >
            {saveLoading ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Keyboard Shortcuts Help Dialog */}
      <Dialog
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              p: 2.5,
              color: '#f1f5f9',
            }
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: '20px', borderBottom: '1px solid var(--border-color)', pb: 1.5 }}>
          Keyboard Shortcuts Cheat Sheet
        </DialogTitle>
        <DialogContent sx={{ mt: 2, maxHeight: 400, overflowY: 'auto' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            {/* Column 1: Document & Editing */}
            <Box>
              <Typography variant="subtitle2" color="var(--accent-secondary)" sx={{ fontWeight: 700, mb: 1.5 }}>
                Document Operations
              </Typography>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}><td style={{ padding: '8px 0', fontWeight: 500 }}>New Document</td><td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>Ctrl / ⌘ + N</td></tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}><td style={{ padding: '8px 0', fontWeight: 500 }}>Open Document</td><td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>Ctrl / ⌘ + O</td></tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}><td style={{ padding: '8px 0', fontWeight: 500 }}>Save</td><td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>Ctrl / ⌘ + S</td></tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}><td style={{ padding: '8px 0', fontWeight: 500 }}>Save As</td><td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>Ctrl / ⌘ + Shift + S</td></tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}><td style={{ padding: '8px 0', fontWeight: 500 }}>Print</td><td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>Ctrl / ⌘ + P</td></tr>
                </tbody>
              </table>

              <Typography variant="subtitle2" color="var(--accent-secondary)" sx={{ fontWeight: 700, mt: 3, mb: 1.5 }}>
                Text Selection & Editing
              </Typography>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}><td style={{ padding: '8px 0', fontWeight: 500 }}>Undo</td><td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>Ctrl / ⌘ + Z</td></tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}><td style={{ padding: '8px 0', fontWeight: 500 }}>Redo</td><td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>Ctrl + Y / ⌘ + Shift + Z</td></tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}><td style={{ padding: '8px 0', fontWeight: 500 }}>Cut / Copy / Paste</td><td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>Ctrl / ⌘ + X / C / V</td></tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}><td style={{ padding: '8px 0', fontWeight: 500 }}>Select All</td><td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>Ctrl / ⌘ + A</td></tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}><td style={{ padding: '8px 0', fontWeight: 500 }}>Find / Replace</td><td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>Ctrl / ⌘ + F</td></tr>
                </tbody>
              </table>
            </Box>

            {/* Column 2: Formatting */}
            <Box>
              <Typography variant="subtitle2" color="var(--accent-secondary)" sx={{ fontWeight: 700, mb: 1.5 }}>
                Formatting Actions
              </Typography>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}><td style={{ padding: '8px 0', fontWeight: 500 }}>Bold / Italic / Underline</td><td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>Ctrl / ⌘ + B / I / U</td></tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}><td style={{ padding: '8px 0', fontWeight: 500 }}>Heading 1 / 2 / 3</td><td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>Ctrl+Alt + 1 / 2 / 3</td></tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}><td style={{ padding: '8px 0', fontWeight: 500 }}>Bullet List</td><td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>Ctrl / ⌘ + Shift + L</td></tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}><td style={{ padding: '8px 0', fontWeight: 500 }}>Numbered List</td><td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>Ctrl+Alt+L / ⌘+Option+L</td></tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}><td style={{ padding: '8px 0', fontWeight: 500 }}>Font Size Increase</td><td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>Ctrl / ⌘ + Shift + &gt;</td></tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}><td style={{ padding: '8px 0', fontWeight: 500 }}>Font Size Decrease</td><td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>Ctrl / ⌘ + Shift + &lt;</td></tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}><td style={{ padding: '8px 0', fontWeight: 500 }}>Insert Link</td><td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>Ctrl / ⌘ + K</td></tr>
                </tbody>
              </table>

              <Typography variant="subtitle2" color="var(--accent-secondary)" sx={{ fontWeight: 700, mt: 3, mb: 1.5 }}>
                Navigation Shortcuts
              </Typography>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}><td style={{ padding: '8px 0', fontWeight: 500 }}>Beginning / End of Doc</td><td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>Ctrl+Home / End</td></tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}><td style={{ padding: '8px 0', fontWeight: 500 }}>Move Word Left / Right</td><td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>Ctrl / Option + ← / →</td></tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}><td style={{ padding: '8px 0', fontWeight: 500 }}>Select by Word</td><td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>Ctrl+Shift / Option+Shift + ← / →</td></tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}><td style={{ padding: '8px 0', fontWeight: 500 }}>Beginning / End of Line</td><td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>Home / End</td></tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}><td style={{ padding: '8px 0', fontWeight: 500 }}>Delete Previous Word</td><td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>Ctrl+Backspace / Opt+Del</td></tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}><td style={{ padding: '8px 0', fontWeight: 500 }}>Delete Next Word</td><td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>Ctrl+Delete / Fn+Opt+Del</td></tr>
                </tbody>
              </table>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid var(--border-color)', mt: 1.5 }}>
          <Button
            onClick={() => setShortcutsOpen(false)}
            variant="contained"
            sx={{
              textTransform: 'none',
              background: 'linear-gradient(90deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
              borderRadius: '8px',
              px: 3,
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
export default DocumentPage;
