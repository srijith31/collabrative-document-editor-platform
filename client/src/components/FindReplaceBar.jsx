import React, { useState, useEffect, useRef } from 'react';
import { Box, TextField, IconButton, Typography, Button, Paper } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import ReplaceAllIcon from '@mui/icons-material/FindReplace';

export const FindReplaceBar = ({ quill, isOpen, onClose }) => {
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [matches, setMatches] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus();
      }, 100);
    }
  }, [isOpen]);

  const performSearch = () => {
    if (!quill || !findText) {
      setMatches([]);
      setCurrentIndex(-1);
      return;
    }

    const text = quill.getText();
    const query = findText.toLowerCase();
    const positions = [];
    let pos = text.toLowerCase().indexOf(query);

    while (pos !== -1) {
      positions.push(pos);
      pos = text.toLowerCase().indexOf(query, pos + query.length || pos + 1);
      if (query.length === 0) break; // Avoid infinite loop
    }

    setMatches(positions);
    
    if (positions.length > 0) {
      setCurrentIndex(0);
      quill.setSelection(positions[0], findText.length);
    } else {
      setCurrentIndex(-1);
    }
  };

  // Perform search on query change
  useEffect(() => {
    performSearch();
  }, [findText]);

  const handleNext = () => {
    if (matches.length === 0) return;
    const nextIndex = (currentIndex + 1) % matches.length;
    setCurrentIndex(nextIndex);
    quill.setSelection(matches[nextIndex], findText.length);
  };

  const handlePrev = () => {
    if (matches.length === 0) return;
    const prevIndex = (currentIndex - 1 + matches.length) % matches.length;
    setCurrentIndex(prevIndex);
    quill.setSelection(matches[prevIndex], findText.length);
  };

  const handleReplace = () => {
    if (!quill || currentIndex === -1 || matches.length === 0) return;
    
    const startPos = matches[currentIndex];
    
    // Replace text using Quill APIs
    quill.deleteText(startPos, findText.length);
    quill.insertText(startPos, replaceText);
    
    // Refresh search
    const text = quill.getText();
    const query = findText.toLowerCase();
    const positions = [];
    let pos = text.toLowerCase().indexOf(query);
    while (pos !== -1) {
      positions.push(pos);
      pos = text.toLowerCase().indexOf(query, pos + query.length || pos + 1);
      if (query.length === 0) break;
    }
    setMatches(positions);

    // Set index to the next match at or after replaced position
    if (positions.length > 0) {
      const nextMatchIdx = positions.findIndex(p => p >= startPos);
      const targetIdx = nextMatchIdx !== -1 ? nextMatchIdx : 0;
      setCurrentIndex(targetIdx);
      quill.setSelection(positions[targetIdx], findText.length);
    } else {
      setCurrentIndex(-1);
    }
  };

  const handleReplaceAll = () => {
    if (!quill || matches.length === 0) return;

    // Apply replacements from back to front to avoid shifting indices
    const reversedMatches = [...matches].reverse();
    
    quill.history.cutoff(); // Group into undo history
    for (const startPos of reversedMatches) {
      quill.deleteText(startPos, findText.length);
      quill.insertText(startPos, replaceText);
    }
    
    setMatches([]);
    setCurrentIndex(-1);
    setFindText('');
  };

  if (!isOpen) return null;

  return (
    <Paper
      elevation={8}
      className="glass-panel"
      sx={{
        position: 'absolute',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        px: 2.5,
        py: 1.5,
        zIndex: 1000,
        background: 'rgba(18, 18, 23, 0.95)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
        width: 'auto',
        maxWidth: '90%',
        flexWrap: 'wrap',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TextField
          inputRef={inputRef}
          placeholder="Find text..."
          size="small"
          value={findText}
          onChange={(e) => setFindText(e.target.value)}
          sx={{
            width: 180,
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
              fontSize: '13px',
              height: '36px',
            }
          }}
        />
        <Typography variant="caption" sx={{ color: 'var(--text-muted)', minWidth: 45, textAlign: 'center' }}>
          {matches.length > 0 ? `${currentIndex + 1}/${matches.length}` : '0/0'}
        </Typography>
        <IconButton onClick={handlePrev} disabled={matches.length === 0} size="small" sx={{ color: '#fff' }}>
          <NavigateBeforeIcon fontSize="small" />
        </IconButton>
        <IconButton onClick={handleNext} disabled={matches.length === 0} size="small" sx={{ color: '#fff' }}>
          <NavigateNextIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TextField
          placeholder="Replace with..."
          size="small"
          value={replaceText}
          onChange={(e) => setReplaceText(e.target.value)}
          sx={{
            width: 180,
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
              fontSize: '13px',
              height: '36px',
            }
          }}
        />
        <Button
          onClick={handleReplace}
          disabled={matches.length === 0 || currentIndex === -1}
          variant="contained"
          size="small"
          sx={{
            textTransform: 'none',
            height: '36px',
            borderRadius: '8px',
            background: 'var(--accent-primary)',
            fontSize: '12px',
            px: 1.5,
          }}
        >
          Replace
        </Button>
        <Button
          onClick={handleReplaceAll}
          disabled={matches.length === 0}
          variant="outlined"
          size="small"
          startIcon={<ReplaceAllIcon sx={{ width: 14, height: 14 }} />}
          sx={{
            textTransform: 'none',
            height: '36px',
            borderRadius: '8px',
            borderColor: 'var(--accent-secondary)',
            color: '#fff',
            fontSize: '12px',
            px: 1.5,
          }}
        >
          All
        </Button>
      </Box>

      <IconButton onClick={onClose} size="small" sx={{ color: 'var(--text-muted)', '&:hover': { color: '#f44336' } }}>
        <CloseIcon fontSize="small" />
      </IconButton>
    </Paper>
  );
};
