import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Box, Typography } from '@mui/material';
import Quill from 'quill';
import { useSocket } from '../contexts/SocketContext';
import { documentService } from '../services/documentService';
import { WordRibbon } from './WordRibbon';
import './quillConfig'; // register fonts & sizes once

// ── Register the horizontal-rule blot ────────────────────────────────────────
const BlockEmbed = Quill.import('blots/block/embed');
class HrBlot extends BlockEmbed {
  static create() {
    const node = super.create();
    node.setAttribute('style', 'border:none;border-top:2px solid #c8c8d0;margin:12px 0;');
    return node;
  }
}
HrBlot.blotName = 'hr';
HrBlot.tagName  = 'hr';
try { Quill.register(HrBlot); } catch (_) { /* already registered on HMR */ }

// ── Ruler ─────────────────────────────────────────────────────────────────────
// Shows the A4 content-width ruler (159.2mm) above the page with 1 inch (25.4mm) margins.
const Ruler = ({ zoom = 1, onZoomChange }) => {
  const PAGE_MM   = 159.2;   // content width in mm for A4 (210 - 2 * 25.4)
  const PX_PER_MM = 3.78 * zoom;
  const totalPx   = PAGE_MM * PX_PER_MM;
  const ticks = [];

  for (let mm = 0; mm <= PAGE_MM; mm += 5) {
    const isMajor = mm % 10 === 0;
    ticks.push(
      <Box key={mm} sx={{
        position: 'absolute',
        left: `${mm * PX_PER_MM}px`,
        bottom: 0,
        width: '1px',
        height: isMajor ? '8px' : '4px',
        bgcolor: isMajor ? '#94a3b8' : '#64748b',
      }}>
        {isMajor && mm > 0 && mm < PAGE_MM && (
          <Typography sx={{
            position: 'absolute', bottom: '10px', left: '50%',
            transform: 'translateX(-50%)', fontSize: '9px',
            color: '#64748b', whiteSpace: 'nowrap',
          }}>
            {Math.round(mm)}
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{
      display: 'flex', justifyContent: 'center',
      bgcolor: '#1e1e2e', borderBottom: '1px solid rgba(255,255,255,0.07)',
      height: 24, flexShrink: 0, position: 'relative',
    }}>
      {/* Left margin block */}
      <Box sx={{ width: `${25.4 * PX_PER_MM}px`, bgcolor: 'rgba(255,255,255,0.03)', height: '100%', flexShrink: 0 }} />
      {/* Content area with ticks */}
      <Box sx={{ width: `${totalPx}px`, position: 'relative', height: '100%', flexShrink: 0 }}>
        {ticks}
      </Box>
      {/* Right margin block */}
      <Box sx={{ width: `${25.4 * PX_PER_MM}px`, bgcolor: 'rgba(255,255,255,0.03)', height: '100%', flexShrink: 0 }} />

      {/* Zoom Controls */}
      <Box sx={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography sx={{ color: '#94a3b8', fontSize: '10px', fontWeight: 600 }}>Zoom:</Typography>
        <select
          value={zoom}
          onChange={(e) => onZoomChange && onZoomChange(parseFloat(e.target.value))}
          style={{
            background: '#0f0f1a',
            color: '#c4c4d0',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '4px',
            fontSize: '10px',
            padding: '1px 4px',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <option value="0.5">50%</option>
          <option value="0.75">75%</option>
          <option value="1">100%</option>
          <option value="1.25">125%</option>
        </select>
      </Box>
    </Box>
  );
};

// ── Status bar ────────────────────────────────────────────────────────────────
const StatusBar = ({ wordCount, charCount, pageCount, cursorLine }) => (
  <Box sx={{
    display: 'flex', alignItems: 'center', gap: 2.5,
    px: 2, py: 0.4, bgcolor: '#0f0f1a',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    flexShrink: 0,
  }}>
    {[
      { label: 'Words', value: wordCount.toLocaleString() },
      { label: 'Characters', value: charCount.toLocaleString() },
      { label: 'Pages', value: pageCount },
    ].map(({ label, value }) => (
      <Typography key={label} variant="caption" sx={{ color: '#64748b', fontSize: '11px' }}>
        {label}: <span style={{ color: '#94a3b8' }}>{value}</span>
      </Typography>
    ))}
  </Box>
);

// ─────────────────────────────────────────────────────────────────────────────
// DocumentEditor
// ─────────────────────────────────────────────────────────────────────────────
export const DocumentEditor = ({
  documentId,
  userRole,
  initialContent,
  restoreContent,
  onSelectionChange,
  presence,
  onEditorReady,
}) => {
  const editorContainerRef = useRef(null);
  const quillRef           = useRef(null);
  const saveTimeoutRef     = useRef(null);
  const { socket }         = useSocket();

  const [quill,      setQuill]      = useState(null);
  const [peerCursors, setPeerCursors] = useState({});
  const [wordCount,   setWordCount]   = useState(0);
  const [charCount,   setCharCount]   = useState(0);
  const [pageCount,   setPageCount]   = useState(1);
  const [zoom,        setZoom]        = useState(1);

  // ── Calculate stats from text ──────────────────────────────────────────────
  const updateStats = useCallback((q) => {
    if (!q) return;
    const text  = q.getText().trim();
    const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
    const chars = text.length;
    setWordCount(words);
    setCharCount(chars);
  }, []);

  // ── Pagination logic ────────────────────────────────────────────────────────
  const paginateEditor = useCallback(() => {
    const q = quillRef.current;
    if (!q) return;
    const editorEl = q.root;
    if (!editorEl) return;

    const children = Array.from(editorEl.children);
    if (children.length === 0) return;

    // Reset margins to measure natural heights
    children.forEach((child) => {
      child.style.marginTop = '';
    });

    const pageHeight = 1123; // A4 height in px at 96 DPI (297mm)
    const margin = 96;       // 1 inch in px (25.4mm)
    const gap = 40;          // Gray space gap between pages
    const contentEnd = pageHeight - margin; // 1027px

    let currentPageIndex = 0;

    for (let k = 0; k < children.length; k++) {
      const child = children[k];
      const offsetHeight = child.offsetHeight;
      const offsetTop = child.offsetTop;

      // Current page boundaries
      const pageStart = currentPageIndex * (pageHeight + gap);
      const currentContentStart = pageStart + margin;
      const currentContentEnd = pageStart + contentEnd;

      // If the element crosses the page bottom boundary
      if (offsetTop > currentContentStart && offsetTop + offsetHeight > currentContentEnd) {
        currentPageIndex++;
        const nextPageStart = currentPageIndex * (pageHeight + gap);
        const nextContentStart = nextPageStart + margin;

        const push = nextContentStart - offsetTop;
        if (push > 0) {
          child.style.marginTop = `${push}px`;
        }
      }
    }

    // Calculate total pages
    const lastChild = children[children.length - 1];
    const totalHeight = lastChild
      ? lastChild.offsetTop + lastChild.offsetHeight + margin
      : margin;
    const computedPages = Math.max(1, Math.ceil(totalHeight / (pageHeight + gap)));
    setPageCount(computedPages);
  }, []);

  // ── Initialise Quill ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!editorContainerRef.current) return;

    // Mount target
    const el = document.createElement('div');
    el.id = `ql-editor-${documentId}`;
    editorContainerRef.current.innerHTML = '';
    editorContainerRef.current.appendChild(el);

    const q = new Quill(el, {
      theme: 'snow',
      modules: {
        toolbar: false,
        history: { delay: 800, maxStack: 200, userOnly: true },
        clipboard: { matchVisual: false },
      },
      placeholder: 'Start typing…',
    });

    // Enable spell check on the contenteditable root
    if (q.root) {
      q.root.setAttribute('spellcheck', 'true');
      q.root.setAttribute('lang', 'en');
    }

    quillRef.current = q;
    setQuill(q);

    if (initialContent) q.setContents(initialContent);
    q.enable(userRole !== 'VIEWER');

    if (onEditorReady) onEditorReady(q);
    updateStats(q);

    // Run pagination initially
    setTimeout(paginateEditor, 100);

    return () => {
      quillRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId, userRole]);

  // ── Restore version ────────────────────────────────────────────────────────
  useEffect(() => {
    if (quillRef.current && restoreContent) {
      quillRef.current.setContents(restoreContent);
      setTimeout(paginateEditor, 50);
    }
  }, [restoreContent, paginateEditor]);

  // ── Auto-save + socket send-changes ───────────────────────────────────────
  useEffect(() => {
    const q = quillRef.current;
    if (!q || !socket || userRole === 'VIEWER') return;

    const onTextChange = (delta, _old, source) => {
      if (source !== 'user') return;
      socket.emit('send-changes', { documentId, delta });
      updateStats(q);
      setTimeout(paginateEditor, 0);

      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await documentService.updateDocument(documentId, { content: q.getContents() });
        } catch (err) {
          console.error('Autosave failed:', err);
        }
      }, 2000);
    };

    q.on('text-change', onTextChange);
    return () => {
      q.off('text-change', onTextChange);
      clearTimeout(saveTimeoutRef.current);
    };
  }, [documentId, socket, userRole, updateStats, paginateEditor]);

  // ── Receive remote changes ─────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;
    const onReceive = (delta) => {
      quillRef.current?.updateContents(delta);
      updateStats(quillRef.current);
      setTimeout(paginateEditor, 0);
    };
    socket.on('receive-changes', onReceive);
    return () => socket.off('receive-changes', onReceive);
  }, [socket, updateStats, paginateEditor]);

  // ── Selection change → cursor broadcast + parent callback ─────────────────
  useEffect(() => {
    const q = quillRef.current;
    if (!q || !socket) return;

    const onSel = (range, _old, _src) => {
      socket.emit('cursor-move', { documentId, range });
      if (range) {
        const text = q.getText(range.index, range.length);
        onSelectionChange({ index: range.index, length: range.length }, text);
      } else {
        onSelectionChange(null, '');
      }
    };
    q.on('selection-change', onSel);
    return () => q.off('selection-change', onSel);
  }, [documentId, socket, onSelectionChange]);

  // ── Peer cursors ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;
    const onCursor = (data) => setPeerCursors(p => ({ ...p, [data.socketId]: data }));
    socket.on('cursor-update', onCursor);
    return () => socket.off('cursor-update', onCursor);
  }, [socket]);

  useEffect(() => {
    const ids = new Set(presence.map(p => p.socketId));
    setPeerCursors(prev => {
      const next = { ...prev };
      let changed = false;
      Object.keys(next).forEach(sid => { if (!ids.has(sid)) { delete next[sid]; changed = true; } });
      return changed ? next : prev;
    });
  }, [presence]);

  // ── Window Resize Listener ─────────────────────────────────────────────────
  useEffect(() => {
    window.addEventListener('resize', paginateEditor);
    return () => window.removeEventListener('resize', paginateEditor);
  }, [paginateEditor]);

  const renderCursors = () => {
    const q = quillRef.current;
    if (!q) return null;
    return Object.values(peerCursors).map(peer => {
      if (!peer.range) return null;
      try {
        const b = q.getBounds(peer.range.index, peer.range.length);
        if (!b) return null;
        return (
          <Box key={peer.socketId} className="peer-cursor" style={{ left: `${b.left}px`, top: `${b.top}px`, color: peer.avatarColor }}>
            <div className="peer-cursor-caret" style={{ backgroundColor: peer.avatarColor }} />
            <div className="peer-cursor-flag" style={{ backgroundColor: peer.avatarColor }}>{peer.username}</div>
          </Box>
        );
      } catch { return null; }
    });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      {/* Sticky Ribbon & Ruler */}
      <Box sx={{ position: 'sticky', top: 0, zIndex: 10, bgcolor: '#0b0b0e', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <WordRibbon quill={quill} disabled={userRole === 'VIEWER'} />
        <Ruler zoom={zoom} onZoomChange={setZoom} />
      </Box>

      {/* A4 canvas — scrollable grey workspace */}
      <Box
        sx={{
          flex: 1, overflowX: 'auto',
          bgcolor: '#d0d0d8',
          display: 'flex', justifyContent: 'center',
          alignItems: 'flex-start',
          pt: 3, pb: 4,
        }}
      >
        {/* Page stack container */}
        <Box
          className="page-stack-container"
          sx={{
            width: '210mm',
            position: 'relative',
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
            height: `${pageCount * 1123 + (pageCount - 1) * 40}px`,
            flexShrink: 0,
            transition: 'transform 0.2s ease-in-out',
          }}
        >
          {/* 1. Background Pages (the white sheets of paper) */}
          <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
            {Array.from({ length: pageCount }).map((_, index) => {
              const pageTop = index * (1123 + 40);
              return (
                <Box
                  key={index}
                  sx={{
                    position: 'absolute',
                    top: `${pageTop}px`,
                    left: 0,
                    width: '100%',
                    height: '1123px',
                    bgcolor: '#ffffff',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    p: '20px 96px', // margins for header/footer inside the 96px page margins
                  }}
                >
                  {/* Header */}
                  <Box sx={{ borderBottom: '1px solid #e2e8f0', pb: 0.5, opacity: 0.8, display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: '10px', color: '#64748b', fontFamily: 'Calibri, Arial' }}>Meeting Notes</Typography>
                    <Typography sx={{ fontSize: '10px', color: '#64748b', fontFamily: 'Calibri, Arial' }}>Draft</Typography>
                  </Box>

                  {/* Footer with page number */}
                  <Box sx={{ borderTop: '1px solid #e2e8f0', pt: 0.5, opacity: 0.8, display: 'flex', justifyContent: 'center' }}>
                    <Typography sx={{ fontSize: '10px', color: '#64748b', fontFamily: 'Calibri, Arial' }}>
                      Page {index + 1} of {pageCount}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>

          {/* 2. Quill Editor (overlay on top of the background pages) */}
          <Box
            ref={editorContainerRef}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: 2,
              bgcolor: 'transparent',
              '& .ql-container': {
                border: 'none !important',
                fontFamily: 'inherit',
                fontSize: '12pt',
                height: '100%',
              },
              '& .ql-editor': {
                padding: '96px 96px !important', // Exactly 1 inch (25.4mm = 96px) margins
                minHeight: '100%',
                height: '100%',
                overflow: 'visible !important',
                lineHeight: 1.6,
                color: '#000',
                fontSize: '12pt',
                fontFamily: 'Calibri, Arial, sans-serif',
                background: 'transparent !important',
              },
              '& .ql-editor p': { marginBottom: '6px' },
              '& .ql-editor h1': { fontSize: '24pt', fontWeight: 700, marginBottom: '12px', color: '#1e293b' },
              '& .ql-editor h2': { fontSize: '18pt', fontWeight: 700, marginBottom: '10px', color: '#1e293b' },
              '& .ql-editor h3': { fontSize: '14pt', fontWeight: 600, marginBottom: '8px', color: '#334155' },
              '& .ql-editor h4': { fontSize: '12pt', fontWeight: 600, marginBottom: '6px', color: '#334155' },
              '& .ql-editor blockquote': {
                borderLeft: '3px solid #6366f1 !important',
                paddingLeft: '16px !important',
                color: '#475569 !important',
                fontStyle: 'italic',
                margin: '12px 0 !important',
              },
              '& .ql-editor table': {
                borderCollapse: 'collapse', width: '100%', margin: '8px 0',
              },
              '& .ql-editor td, & .ql-editor th': {
                border: '1px solid #cbd5e1', padding: '6px 10px',
              },
              '& .ql-editor img': { maxWidth: '100%', height: 'auto', display: 'block', margin: '8px 0' },
              '& .ql-editor .ql-size-8pt':  { fontSize: '8pt'  },
              '& .ql-editor .ql-size-9pt':  { fontSize: '9pt'  },
              '& .ql-editor .ql-size-10pt': { fontSize: '10pt' },
              '& .ql-editor .ql-size-11pt': { fontSize: '11pt' },
              '& .ql-editor .ql-size-12pt': { fontSize: '12pt' },
              '& .ql-editor .ql-size-14pt': { fontSize: '14pt' },
              '& .ql-editor .ql-size-16pt': { fontSize: '16pt' },
              '& .ql-editor .ql-size-18pt': { fontSize: '18pt' },
              '& .ql-editor .ql-size-24pt': { fontSize: '24pt' },
              '& .ql-editor .ql-size-28pt': { fontSize: '28pt' },
              '& .ql-editor .ql-size-32pt': { fontSize: '32pt' },
              '& .ql-editor .ql-size-36pt': { fontSize: '36pt' },
              '& .ql-editor .ql-size-48pt': { fontSize: '48pt' },
              '& .ql-editor .ql-size-72pt': { fontSize: '72pt' },
              '& .ql-editor.ql-blank::before': {
                color: '#94a3b8', fontStyle: 'italic', left: '96px',
              },
            }}
          />

          {/* Peer cursors overlay */}
          <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3 }}>
            {renderCursors()}
          </Box>
        </Box>
      </Box>

      {/* Status bar */}
      <Box sx={{ position: 'sticky', bottom: 0, zIndex: 10 }}>
        <StatusBar
          wordCount={wordCount}
          charCount={charCount}
          pageCount={pageCount}
          cursorLine={1}
        />
      </Box>
    </Box>
  );
};

export default DocumentEditor;
