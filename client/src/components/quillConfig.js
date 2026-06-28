/**
 * quillConfig.js
 * Registers custom fonts and sizes with Quill v2 ONCE at module load time.
 * Import this file before creating any Quill instance.
 */
import Quill from 'quill';

// ── Font family (style-based so no extra CSS classes needed) ──────────────────
const FontStyle = Quill.import('attributors/style/font');
FontStyle.whitelist = [
  'Arial',
  'Calibri',
  'Georgia',
  'Times New Roman',
  'Courier New',
  'Verdana',
  'Trebuchet MS',
  'Outfit',
  'Impact',
  'Comic Sans MS',
];
Quill.register(FontStyle, true);

// ── Font size (pt-based, maps to CSS font-size: Xpt) ─────────────────────────
const SizeStyle = Quill.import('attributors/style/size');
SizeStyle.whitelist = [
  '8pt', '9pt', '10pt', '11pt', '12pt', '14pt', '16pt',
  '18pt', '20pt', '22pt', '24pt', '28pt', '32pt', '36pt',
  '48pt', '72pt',
];
Quill.register(SizeStyle, true);

export const FONT_FAMILIES = FontStyle.whitelist;

export const FONT_SIZES = [
  { label: '8',  value: '8pt'  },
  { label: '9',  value: '9pt'  },
  { label: '10', value: '10pt' },
  { label: '11', value: '11pt' },
  { label: '12', value: '12pt' },
  { label: '14', value: '14pt' },
  { label: '16', value: '16pt' },
  { label: '18', value: '18pt' },
  { label: '20', value: '20pt' },
  { label: '22', value: '22pt' },
  { label: '24', value: '24pt' },
  { label: '28', value: '28pt' },
  { label: '32', value: '32pt' },
  { label: '36', value: '36pt' },
  { label: '48', value: '48pt' },
  { label: '72', value: '72pt' },
];
