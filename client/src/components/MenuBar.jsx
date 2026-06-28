import React, { useState } from 'react';
import {
  Box, Button, Menu, MenuItem, ListItemIcon, ListItemText,
  Divider, Typography,
} from '@mui/material';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import ImageIcon from '@mui/icons-material/Image';
import GridOnIcon from '@mui/icons-material/GridOn';
import LinkIcon from '@mui/icons-material/Link';
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';

export const MenuBar = ({
  quill,
  onNewDocument,
  onOpenDocument,
  onSave,
  onSaveAs,
  onPrint,
  onExportPDF,
  onExportDOCX,
  onExportTXT,
  onFindReplace,
  onShowShortcuts,
}) => {
  const [anchorEls, setAnchorEls] = useState({
    file: null, edit: null, insert: null, format: null, view: null, help: null,
  });

  const isMac  = /Mac/i.test(navigator.platform);
  const modKey = isMac ? '⌘' : 'Ctrl+';
  const optKey = isMac ? '⌥' : 'Alt+';

  const open  = (menu) => (e) => setAnchorEls(p => ({ ...p, [menu]: e.currentTarget }));
  const close = (menu) => ()  => setAnchorEls(p => ({ ...p, [menu]: null }));
  const run   = (fn, menu)    => { close(menu)(); fn?.(); };

  const fmtEditor = (name, value) => {
    if (!quill) return;
    quill.focus();
    const cur = quill.getFormat()[name];
    if (name === 'list')   quill.format('list',   cur === value ? false : value);
    else if (name === 'header') quill.format('header', cur === value ? false : value);
    else                   quill.format(name, !cur);
  };

  const handleInsertImage = () => {
    if (!quill) return;
    const inp = document.createElement('input');
    inp.type   = 'file';
    inp.accept = 'image/*';
    inp.onchange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const range = quill.getSelection(true);
        quill.insertEmbed(range.index, 'image', ev.target.result);
        quill.setSelection(range.index + 1);
      };
      reader.readAsDataURL(file);
    };
    inp.click();
  };

  const handleInsertTable = () => {
    if (!quill) return;
    const cell = `<td style="border:1px solid #ccc;padding:6px 10px;min-width:60px;">&nbsp;</td>`;
    const row  = `<tr>${cell.repeat(3)}</tr>`;
    const html = `<br/><table style="border-collapse:collapse;width:100%">${row.repeat(3)}</table><br/>`;
    const range = quill.getSelection(true);
    quill.clipboard.dangerouslyPasteHTML(range.index, html);
  };

  const handleInsertLink = () => {
    if (!quill) return;
    const url = prompt('Enter URL (e.g. https://example.com):');
    if (url) { quill.focus(); quill.format('link', url); }
  };

  const handleInsertHR = () => {
    if (!quill) return;
    const range = quill.getSelection(true);
    quill.insertEmbed(range.index, 'hr', true);
    quill.setSelection(range.index + 1);
  };

  // ── Shared styles ──────────────────────────────────────────────────────────
  const menuSx = {
    '& .MuiPaper-root': {
      bgcolor: 'rgba(20,20,38,0.97)', border: '1px solid rgba(255,255,255,0.1)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)', borderRadius: '8px',
      minWidth: '220px', backdropFilter: 'blur(12px)',
    },
  };
  const itemSx = {
    py: 0.9, px: 2, fontSize: '13px', color: '#e2e8f0',
    '&:hover': { bgcolor: 'rgba(99,102,241,0.15)' },
  };
  const shortSx = { color: 'rgba(255,255,255,0.35)', fontSize: '11px', ml: 3 };
  const btnSx = {
    textTransform: 'none', color: '#e2e8f0', fontSize: '13px',
    px: 1.5, minWidth: 'auto', borderRadius: '4px',
    '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
    '&[aria-expanded=true]': { bgcolor: 'rgba(99,102,241,0.15)' },
  };

  const MenuBtn = ({ label, menu }) => (
    <Button size="small" onClick={open(menu)} aria-expanded={Boolean(anchorEls[menu])} sx={btnSx}>
      {label}
    </Button>
  );
  const MI = ({ label, shortcut, onClick, icon }) => (
    <MenuItem onClick={onClick} sx={itemSx}>
      {icon && <ListItemIcon sx={{ color: 'rgba(255,255,255,0.5)', minWidth: 32 }}>{icon}</ListItemIcon>}
      <ListItemText sx={{ '& .MuiListItemText-primary': { fontSize: '13px' } }}>{label}</ListItemText>
      {shortcut && <Typography sx={shortSx}>{shortcut}</Typography>}
    </MenuItem>
  );

  return (
    <Box sx={{
      display: 'flex', alignItems: 'center', gap: 0.25,
      px: 2, py: 0.4,
      bgcolor: '#0f0f1a',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      flexShrink: 0,
    }}>

      {/* ── FILE ── */}
      <MenuBtn label="File" menu="file" />
      <Menu anchorEl={anchorEls.file} open={Boolean(anchorEls.file)} onClose={close('file')} sx={menuSx}>
        <MI label="New Document"  shortcut={`${modKey}N`} onClick={() => run(onNewDocument, 'file')} />
        <MI label="Open Document" shortcut={`${modKey}O`} onClick={() => run(onOpenDocument, 'file')} />
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />
        <MI label="Save"    shortcut={`${modKey}S`}        onClick={() => run(onSave, 'file')} />
        <MI label="Save As" shortcut={`${modKey}Shift+S`}  onClick={() => run(onSaveAs, 'file')} />
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />
        <MI label="Export as PDF"  icon={<PictureAsPdfIcon fontSize="small" />} onClick={() => run(onExportPDF, 'file')} />
        <MI label="Export as DOCX" icon={<DescriptionIcon fontSize="small" />}  onClick={() => run(onExportDOCX, 'file')} />
        <MI label="Export as TXT"  icon={<TextSnippetIcon fontSize="small" />}  onClick={() => run(onExportTXT, 'file')} />
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />
        <MI label="Print" shortcut={`${modKey}P`} onClick={() => run(onPrint, 'file')} />
      </Menu>

      {/* ── EDIT ── */}
      <MenuBtn label="Edit" menu="edit" />
      <Menu anchorEl={anchorEls.edit} open={Boolean(anchorEls.edit)} onClose={close('edit')} sx={menuSx}>
        <MI label="Undo"       shortcut={`${modKey}Z`}        onClick={() => run(() => quill?.history.undo(), 'edit')} />
        <MI label="Redo"       shortcut={isMac ? '⌘⇧Z' : 'Ctrl+Y'} onClick={() => run(() => quill?.history.redo(), 'edit')} />
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />
        <MI label="Select All" shortcut={`${modKey}A`} onClick={() => run(() => { quill?.focus(); quill?.setSelection(0, quill.getLength() - 1); }, 'edit')} />
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />
        <MI label="Find & Replace" shortcut={`${modKey}F`} onClick={() => run(onFindReplace, 'edit')} />
      </Menu>

      {/* ── INSERT ── */}
      <MenuBtn label="Insert" menu="insert" />
      <Menu anchorEl={anchorEls.insert} open={Boolean(anchorEls.insert)} onClose={close('insert')} sx={menuSx}>
        <MI label="Image…"           icon={<ImageIcon fontSize="small" />}          onClick={() => run(handleInsertImage, 'insert')} />
        <MI label="Table (3×3)"      icon={<GridOnIcon fontSize="small" />}          onClick={() => run(handleInsertTable, 'insert')} />
        <MI label="Hyperlink…"       icon={<LinkIcon fontSize="small" />}            shortcut={`${modKey}K`} onClick={() => run(handleInsertLink, 'insert')} />
        <MI label="Horizontal Rule"  icon={<HorizontalRuleIcon fontSize="small" />} onClick={() => run(handleInsertHR, 'insert')} />
      </Menu>

      {/* ── FORMAT ── */}
      <MenuBtn label="Format" menu="format" />
      <Menu anchorEl={anchorEls.format} open={Boolean(anchorEls.format)} onClose={close('format')} sx={menuSx}>
        <MI label="Heading 1"  shortcut={`${modKey}${optKey}1`} onClick={() => run(() => fmtEditor('header', 1), 'format')} />
        <MI label="Heading 2"  shortcut={`${modKey}${optKey}2`} onClick={() => run(() => fmtEditor('header', 2), 'format')} />
        <MI label="Heading 3"  shortcut={`${modKey}${optKey}3`} onClick={() => run(() => fmtEditor('header', 3), 'format')} />
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />
        <MI label="Bold"        shortcut={`${modKey}B`} onClick={() => run(() => fmtEditor('bold'), 'format')} />
        <MI label="Italic"      shortcut={`${modKey}I`} onClick={() => run(() => fmtEditor('italic'), 'format')} />
        <MI label="Underline"   shortcut={`${modKey}U`} onClick={() => run(() => fmtEditor('underline'), 'format')} />
        <MI label="Strikethrough"                       onClick={() => run(() => fmtEditor('strike'), 'format')} />
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />
        <MI label="Bullet List"   shortcut={`${modKey}Shift+L`} onClick={() => run(() => fmtEditor('list', 'bullet'), 'format')} />
        <MI label="Numbered List"                                onClick={() => run(() => fmtEditor('list', 'ordered'), 'format')} />
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />
        <MI label="Insert Link"   shortcut={`${modKey}K`} onClick={() => run(handleInsertLink, 'format')} />
        <MI label="Clear Formatting" onClick={() => run(() => { if (!quill) return; quill.focus(); const r = quill.getSelection(); if (r) quill.removeFormat(r.index, r.length); }, 'format')} />
      </Menu>

      {/* ── VIEW ── */}
      <MenuBtn label="View" menu="view" />
      <Menu anchorEl={anchorEls.view} open={Boolean(anchorEls.view)} onClose={close('view')} sx={menuSx}>
        <MI label="Word Count" onClick={() => {
          close('view')();
          if (!quill) return;
          const t = quill.getText().trim();
          const w = t ? t.split(/\s+/).filter(Boolean).length : 0;
          alert(`Word count: ${w}\nCharacters: ${t.length}`);
        }} />
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />
        <MI label="Find & Replace" shortcut={`${modKey}F`} onClick={() => run(onFindReplace, 'view')} />
      </Menu>

      {/* ── HELP ── */}
      <MenuBtn label="Help" menu="help" />
      <Menu anchorEl={anchorEls.help} open={Boolean(anchorEls.help)} onClose={close('help')} sx={menuSx}>
        <MI label="Keyboard Shortcuts" icon={<KeyboardIcon fontSize="small" />} onClick={() => run(onShowShortcuts, 'help')} />
      </Menu>
    </Box>
  );
};

export default MenuBar;
