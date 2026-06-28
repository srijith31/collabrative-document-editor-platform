import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Tooltip, IconButton, Select, MenuItem, Divider, Popover,
  Typography, Input,
} from '@mui/material';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import StrikethroughSIcon from '@mui/icons-material/StrikethroughS';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';
import FormatAlignJustifyIcon from '@mui/icons-material/FormatAlignJustify';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import FormatIndentDecreaseIcon from '@mui/icons-material/FormatIndentDecrease';
import FormatIndentIncreaseIcon from '@mui/icons-material/FormatIndentIncrease';
import FormatColorTextIcon from '@mui/icons-material/FormatColorText';
import BorderColorIcon from '@mui/icons-material/BorderColor';
import FormatClearIcon from '@mui/icons-material/FormatClear';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';
import LinkIcon from '@mui/icons-material/Link';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import GridOnIcon from '@mui/icons-material/GridOn';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import { FONT_FAMILIES, FONT_SIZES } from './quillConfig';

// ── Colour palettes ────────────────────────────────────────────────────────────
const TEXT_COLORS = [
  '#000000','#434343','#666666','#999999','#b7b7b7','#ffffff',
  '#ff0000','#e91e63','#9c27b0','#3f51b5','#2196f3','#00bcd4',
  '#009688','#4caf50','#cddc39','#ffeb3b','#ffc107','#ff5722',
  '#795548','#607d8b','#f44336','#ff9800','#8bc34a','#03a9f4',
];
const HIGHLIGHT_COLORS = [
  '#ffff00','#00ff00','#00ffff','#ff00ff','#0000ff','#ff0000',
  '#ffc107','#8bc34a','#f48fb1','#b39ddb','#80cbc4','#fff9c4',
  '#ffccbc','#d7ccc8','#cfd8dc','#ffffff',
];

// ── Paragraph styles ───────────────────────────────────────────────────────────
const PARA_STYLES = [
  { label: 'Normal',    header: false },
  { label: 'Heading 1', header: 1 },
  { label: 'Heading 2', header: 2 },
  { label: 'Heading 3', header: 3 },
  { label: 'Heading 4', header: 4 },
];

// ── Thin separator ─────────────────────────────────────────────────────────────
const Sep = () => (
  <Box sx={{ width: '1px', height: 24, bgcolor: 'rgba(255,255,255,0.1)', mx: 0.5, alignSelf: 'center', flexShrink: 0 }} />
);

// ── Small icon button wrapper ──────────────────────────────────────────────────
const RibbonBtn = ({ title, onClick, active, disabled, children, sx = {} }) => (
  <Tooltip title={title} placement="bottom" arrow>
    <span>
      <IconButton
        onMouseDown={(e) => { e.preventDefault(); onClick && onClick(); }}
        disabled={disabled}
        size="small"
        sx={{
          width: 28, height: 28, borderRadius: '4px', p: 0,
          color: active ? '#a78bfa' : '#c4c4d0',
          bgcolor: active ? 'rgba(139,92,246,0.18)' : 'transparent',
          '&:hover': { bgcolor: 'rgba(255,255,255,0.08)', color: '#fff' },
          transition: 'all 0.15s',
          ...sx,
        }}
      >
        {children}
      </IconButton>
    </span>
  </Tooltip>
);

// ── Colour picker popover ──────────────────────────────────────────────────────
const ColorPicker = ({ colors, onSelect, onClose, anchorEl }) => (
  <Popover
    open={Boolean(anchorEl)}
    anchorEl={anchorEl}
    onClose={onClose}
    anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
    slotProps={{ paper: { sx: { bgcolor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', p: 1 } } }}
  >
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 0.4, width: 156 }}>
      {colors.map(c => (
        <Box
          key={c}
          onMouseDown={(e) => { e.preventDefault(); onSelect(c); onClose(); }}
          sx={{
            width: 20, height: 20, borderRadius: '3px', bgcolor: c, cursor: 'pointer',
            border: c === '#ffffff' ? '1px solid rgba(255,255,255,0.3)' : '1px solid transparent',
            '&:hover': { transform: 'scale(1.2)', boxShadow: '0 0 0 2px rgba(167,139,250,0.8)' },
            transition: 'transform 0.1s',
          }}
        />
      ))}
    </Box>
  </Popover>
);

// ── Table picker popover ───────────────────────────────────────────────────────
const TablePicker = ({ onInsert, onClose, anchorEl }) => {
  const [hovered, setHovered] = useState({ r: 0, c: 0 });
  const MAX = 8;
  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      slotProps={{ paper: { sx: { bgcolor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', p: 1.5 } } }}
    >
      <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 1, textAlign: 'center' }}>
        {hovered.r > 0 ? `${hovered.r} × ${hovered.c} Table` : 'Hover to select size'}
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${MAX},1fr)`, gap: 0.3 }}>
        {Array.from({ length: MAX * MAX }, (_, i) => {
          const r = Math.floor(i / MAX) + 1;
          const c = (i % MAX) + 1;
          const isActive = r <= hovered.r && c <= hovered.c;
          return (
            <Box
              key={i}
              onMouseEnter={() => setHovered({ r, c })}
              onMouseLeave={() => setHovered({ r: 0, c: 0 })}
              onMouseDown={(e) => { e.preventDefault(); onInsert(r, c); onClose(); }}
              sx={{
                width: 18, height: 18, borderRadius: '2px', cursor: 'pointer',
                bgcolor: isActive ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.08)',
                border: isActive ? '1px solid rgba(139,92,246,0.8)' : '1px solid rgba(255,255,255,0.15)',
                transition: 'all 0.1s',
              }}
            />
          );
        })}
      </Box>
    </Popover>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main WordRibbon component
// ─────────────────────────────────────────────────────────────────────────────
export const WordRibbon = ({ quill, disabled = false }) => {
  const [fmt, setFmt] = useState({});
  const [textColorAnchor, setTextColorAnchor] = useState(null);
  const [hlColorAnchor, setHlColorAnchor] = useState(null);
  const [tableAnchor, setTableAnchor] = useState(null);
  const [activeTextColor, setActiveTextColor] = useState('#000000');
  const [activeHlColor, setActiveHlColor]  = useState('#ffff00');
  const imgInputRef = useRef(null);

  // ── Track current format at cursor ────────────────────────────────────────
  const updateFormat = useCallback(() => {
    if (!quill) return;
    const f = quill.getFormat();
    setFmt(f);
    if (f.color) setActiveTextColor(f.color);
    if (f.background) setActiveHlColor(f.background);
  }, [quill]);

  useEffect(() => {
    if (!quill) return;
    quill.on('selection-change', updateFormat);
    quill.on('text-change', updateFormat);
    return () => {
      quill.off('selection-change', updateFormat);
      quill.off('text-change', updateFormat);
    };
  }, [quill, updateFormat]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const applyFmt = (name, value) => {
    if (!quill) return;
    quill.focus();
    if (name === 'list') {
      quill.format('list', fmt.list === value ? false : value);
    } else if (name === 'header') {
      quill.format('header', fmt.header === value ? false : value);
    } else if (name === 'align') {
      quill.format('align', fmt.align === value ? false : value);
    } else if (name === 'indent') {
      const cur = fmt.indent || 0;
      quill.format('indent', value === '+1' ? cur + 1 : Math.max(0, cur - 1));
    } else if (['bold','italic','underline','strike','blockquote','script'].includes(name)) {
      quill.format(name, !fmt[name]);
    } else {
      quill.format(name, value);
    }
    updateFormat();
  };

  const applyFont = (val) => { if (!quill) return; quill.focus(); quill.format('font', val || false); updateFormat(); };
  const applySize = (val) => { if (!quill) return; quill.focus(); quill.format('size', val || false); updateFormat(); };
  const applyColor = (c) => { if (!quill) return; quill.focus(); quill.format('color', c); setActiveTextColor(c); updateFormat(); };
  const applyHl    = (c) => { if (!quill) return; quill.focus(); quill.format('background', c); setActiveHlColor(c); updateFormat(); };

  const handleInsertImage = () => imgInputRef.current?.click();

  const handleImageFile = (e) => {
    const file = e.target.files?.[0];
    if (!file || !quill) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const range = quill.getSelection(true);
      quill.insertEmbed(range.index, 'image', ev.target.result);
      quill.setSelection(range.index + 1);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleInsertTable = (rows, cols) => {
    if (!quill) return;
    const cell = `<td style="border:1px solid #ccc;padding:6px 10px;min-width:60px;">&nbsp;</td>`;
    const row = `<tr>${cell.repeat(cols)}</tr>`;
    const tableHtml = `<br/><table style="border-collapse:collapse;width:100%;margin:8px 0">${row.repeat(rows)}</table><br/>`;
    const range = quill.getSelection(true);
    quill.clipboard.dangerouslyPasteHTML(range.index, tableHtml);
  };

  const handleInsertLink = () => {
    if (!quill) return;
    const url = prompt('Enter URL (e.g. https://example.com):');
    if (url) { quill.focus(); quill.format('link', url); updateFormat(); }
  };

  const handleInsertHR = () => {
    if (!quill) return;
    const range = quill.getSelection(true);
    quill.insertEmbed(range.index, 'hr', true);
    quill.setSelection(range.index + 1);
  };

  const handleClearFormat = () => {
    if (!quill) return;
    quill.focus();
    const range = quill.getSelection();
    if (range) quill.removeFormat(range.index, range.length);
  };

  // ── Select menu style ─────────────────────────────────────────────────────
  const selectSx = {
    height: 26, fontSize: '12px', color: '#c4c4d0',
    bgcolor: 'rgba(255,255,255,0.05)',
    borderRadius: '4px',
    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' },
    '& .MuiSelect-icon': { color: '#94a3b8', fontSize: '16px' },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(139,92,246,0.5)' },
    '& .MuiSelect-select': { py: 0, px: 1 },
  };
  const menuPaperSx = {
    bgcolor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '6px', maxHeight: 280,
    '& .MuiMenuItem-root': { fontSize: '12px', color: '#c4c4d0', py: 0.5, '&:hover': { bgcolor: 'rgba(139,92,246,0.15)' }, '&.Mui-selected': { bgcolor: 'rgba(139,92,246,0.25)' } },
  };

  const isDisabled = disabled || !quill;

  return (
    <Box
      sx={{
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        bgcolor: '#141420', borderBottom: '1px solid rgba(255,255,255,0.07)',
        userSelect: 'none',
      }}
    >
      {/* Hidden file input for image upload */}
      <input ref={imgInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageFile} />

      {/* ── ROW 1: Font, Size, Style, Character Formatting ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1.5, py: 0.6, flexWrap: 'nowrap', overflowX: 'auto', '&::-webkit-scrollbar': { height: 3 } }}>

        {/* Font family */}
        <Select
          value={fmt.font || ''}
          onChange={(e) => applyFont(e.target.value)}
          displayEmpty
          disabled={isDisabled}
          size="small"
          variant="outlined"
          sx={{ ...selectSx, width: 130 }}
          slotProps={{ paper: { sx: menuPaperSx } }}
          renderValue={(v) => v || 'Font'}
        >
          <MenuItem value="">Default</MenuItem>
          {FONT_FAMILIES.map(f => (
            <MenuItem key={f} value={f} style={{ fontFamily: f }}>{f}</MenuItem>
          ))}
        </Select>

        <Box sx={{ width: 4 }} />

        {/* Font size */}
        <Select
          value={fmt.size || ''}
          onChange={(e) => applySize(e.target.value)}
          displayEmpty
          disabled={isDisabled}
          size="small"
          variant="outlined"
          sx={{ ...selectSx, width: 64 }}
          slotProps={{ paper: { sx: menuPaperSx } }}
          renderValue={(v) => {
            const match = FONT_SIZES.find(s => s.value === v);
            return match ? match.label : '12';
          }}
        >
          <MenuItem value="">Default</MenuItem>
          {FONT_SIZES.map(s => (
            <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
          ))}
        </Select>

        <Box sx={{ width: 4 }} />

        {/* Paragraph style */}
        <Select
          value={fmt.header || 0}
          onChange={(e) => { const h = e.target.value; applyFmt('header', h === 0 ? false : h); }}
          disabled={isDisabled}
          size="small"
          variant="outlined"
          sx={{ ...selectSx, width: 110 }}
          slotProps={{ paper: { sx: menuPaperSx } }}
        >
          <MenuItem value={0}>Normal</MenuItem>
          <MenuItem value={1} sx={{ fontSize: '18px !important', fontWeight: '700 !important' }}>Heading 1</MenuItem>
          <MenuItem value={2} sx={{ fontSize: '16px !important', fontWeight: '700 !important' }}>Heading 2</MenuItem>
          <MenuItem value={3} sx={{ fontSize: '14px !important', fontWeight: '600 !important' }}>Heading 3</MenuItem>
          <MenuItem value={4} sx={{ fontSize: '13px !important', fontWeight: '600 !important' }}>Heading 4</MenuItem>
        </Select>

        <Sep />

        {/* Bold / Italic / Underline / Strike */}
        <RibbonBtn title="Bold (Ctrl+B)" active={!!fmt.bold} onClick={() => applyFmt('bold')} disabled={isDisabled}>
          <FormatBoldIcon sx={{ fontSize: 16 }} />
        </RibbonBtn>
        <RibbonBtn title="Italic (Ctrl+I)" active={!!fmt.italic} onClick={() => applyFmt('italic')} disabled={isDisabled}>
          <FormatItalicIcon sx={{ fontSize: 16 }} />
        </RibbonBtn>
        <RibbonBtn title="Underline (Ctrl+U)" active={!!fmt.underline} onClick={() => applyFmt('underline')} disabled={isDisabled}>
          <FormatUnderlinedIcon sx={{ fontSize: 16 }} />
        </RibbonBtn>
        <RibbonBtn title="Strikethrough" active={!!fmt.strike} onClick={() => applyFmt('strike')} disabled={isDisabled}>
          <StrikethroughSIcon sx={{ fontSize: 16 }} />
        </RibbonBtn>

        <Sep />

        {/* Superscript / Subscript */}
        <RibbonBtn title="Superscript" active={fmt.script === 'super'} onClick={() => { if (!quill) return; quill.focus(); quill.format('script', fmt.script === 'super' ? false : 'super'); updateFormat(); }} disabled={isDisabled}>
          <Box sx={{ fontSize: 11, fontWeight: 700, letterSpacing: '-0.5px', lineHeight: 1 }}>x²</Box>
        </RibbonBtn>
        <RibbonBtn title="Subscript" active={fmt.script === 'sub'} onClick={() => { if (!quill) return; quill.focus(); quill.format('script', fmt.script === 'sub' ? false : 'sub'); updateFormat(); }} disabled={isDisabled}>
          <Box sx={{ fontSize: 11, fontWeight: 700, letterSpacing: '-0.5px', lineHeight: 1 }}>x₂</Box>
        </RibbonBtn>

        <Sep />

        {/* Text colour */}
        <Tooltip title="Text Color" placement="bottom" arrow>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}
            onMouseDown={(e) => { e.preventDefault(); if (!isDisabled) setTextColorAnchor(e.currentTarget); }}>
            <FormatColorTextIcon sx={{ fontSize: 16, color: '#c4c4d0' }} />
            <Box sx={{ width: 16, height: 3, bgcolor: activeTextColor, borderRadius: '1px', mt: '2px' }} />
          </Box>
        </Tooltip>
        <ColorPicker
          colors={TEXT_COLORS}
          anchorEl={textColorAnchor}
          onSelect={applyColor}
          onClose={() => setTextColorAnchor(null)}
        />

        {/* Highlight */}
        <Tooltip title="Highlight Color" placement="bottom" arrow>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', ml: 0.5 }}
            onMouseDown={(e) => { e.preventDefault(); if (!isDisabled) setHlColorAnchor(e.currentTarget); }}>
            <BorderColorIcon sx={{ fontSize: 16, color: '#c4c4d0' }} />
            <Box sx={{ width: 16, height: 3, bgcolor: activeHlColor, borderRadius: '1px', mt: '2px' }} />
          </Box>
        </Tooltip>
        <ColorPicker
          colors={HIGHLIGHT_COLORS}
          anchorEl={hlColorAnchor}
          onSelect={applyHl}
          onClose={() => setHlColorAnchor(null)}
        />

        <Sep />

        {/* Clear formatting */}
        <RibbonBtn title="Clear Formatting" onClick={handleClearFormat} disabled={isDisabled}>
          <FormatClearIcon sx={{ fontSize: 16 }} />
        </RibbonBtn>
      </Box>

      {/* ── ROW 2: Alignment, Lists, Indent, Insert ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1.5, py: 0.5, flexWrap: 'nowrap', overflowX: 'auto', borderTop: '1px solid rgba(255,255,255,0.05)', '&::-webkit-scrollbar': { height: 3 } }}>

        {/* Alignment */}
        <RibbonBtn title="Align Left" active={!fmt.align || fmt.align === 'left'} onClick={() => applyFmt('align', 'left')} disabled={isDisabled}>
          <FormatAlignLeftIcon sx={{ fontSize: 16 }} />
        </RibbonBtn>
        <RibbonBtn title="Align Center" active={fmt.align === 'center'} onClick={() => applyFmt('align', 'center')} disabled={isDisabled}>
          <FormatAlignCenterIcon sx={{ fontSize: 16 }} />
        </RibbonBtn>
        <RibbonBtn title="Align Right" active={fmt.align === 'right'} onClick={() => applyFmt('align', 'right')} disabled={isDisabled}>
          <FormatAlignRightIcon sx={{ fontSize: 16 }} />
        </RibbonBtn>
        <RibbonBtn title="Justify" active={fmt.align === 'justify'} onClick={() => applyFmt('align', 'justify')} disabled={isDisabled}>
          <FormatAlignJustifyIcon sx={{ fontSize: 16 }} />
        </RibbonBtn>

        <Sep />

        {/* Lists */}
        <RibbonBtn title="Bullet List (Ctrl+Shift+L)" active={fmt.list === 'bullet'} onClick={() => applyFmt('list', 'bullet')} disabled={isDisabled}>
          <FormatListBulletedIcon sx={{ fontSize: 16 }} />
        </RibbonBtn>
        <RibbonBtn title="Numbered List" active={fmt.list === 'ordered'} onClick={() => applyFmt('list', 'ordered')} disabled={isDisabled}>
          <FormatListNumberedIcon sx={{ fontSize: 16 }} />
        </RibbonBtn>
        <RibbonBtn title="Checklist" active={fmt.list === 'check'} onClick={() => { if (!quill) return; quill.focus(); quill.format('list', fmt.list === 'check' ? false : 'check'); updateFormat(); }} disabled={isDisabled}>
          <CheckBoxOutlineBlankIcon sx={{ fontSize: 16 }} />
        </RibbonBtn>

        <Sep />

        {/* Indent */}
        <RibbonBtn title="Decrease Indent" onClick={() => applyFmt('indent', '-1')} disabled={isDisabled}>
          <FormatIndentDecreaseIcon sx={{ fontSize: 16 }} />
        </RibbonBtn>
        <RibbonBtn title="Increase Indent" onClick={() => applyFmt('indent', '+1')} disabled={isDisabled}>
          <FormatIndentIncreaseIcon sx={{ fontSize: 16 }} />
        </RibbonBtn>

        <Sep />

        {/* Block quote */}
        <RibbonBtn title="Block Quote" active={!!fmt.blockquote} onClick={() => applyFmt('blockquote')} disabled={isDisabled}>
          <FormatQuoteIcon sx={{ fontSize: 16 }} />
        </RibbonBtn>

        {/* Horizontal rule */}
        <RibbonBtn title="Insert Horizontal Rule" onClick={handleInsertHR} disabled={isDisabled}>
          <HorizontalRuleIcon sx={{ fontSize: 16 }} />
        </RibbonBtn>

        <Sep />

        {/* Insert image */}
        <RibbonBtn title="Insert Image" onClick={handleInsertImage} disabled={isDisabled}>
          <AddPhotoAlternateIcon sx={{ fontSize: 16 }} />
        </RibbonBtn>

        {/* Insert table */}
        <RibbonBtn title="Insert Table" onClick={(e) => setTableAnchor(e?.currentTarget)} disabled={isDisabled}>
          <GridOnIcon sx={{ fontSize: 16 }} />
        </RibbonBtn>
        <TablePicker
          anchorEl={tableAnchor}
          onInsert={handleInsertTable}
          onClose={() => setTableAnchor(null)}
        />

        {/* Insert link */}
        <RibbonBtn title="Insert Link (Ctrl+K)" active={!!fmt.link} onClick={handleInsertLink} disabled={isDisabled}>
          <LinkIcon sx={{ fontSize: 16 }} />
        </RibbonBtn>

      </Box>
    </Box>
  );
};

export default WordRibbon;
