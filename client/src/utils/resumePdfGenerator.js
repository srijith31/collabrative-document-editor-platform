import { jsPDF } from 'jspdf';

/**
 * Generates a native-text A4 PDF from resumeData using jsPDF text APIs.
 * All text is selectable, searchable, and copy-pastable.
 */

const A4_WIDTH = 210; // mm
const A4_HEIGHT = 297; // mm
const MARGIN_LEFT = 20;
const MARGIN_RIGHT = 20;
const MARGIN_TOP = 18;
const MARGIN_BOTTOM = 18;
const USABLE_WIDTH = A4_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
const MAX_Y = A4_HEIGHT - MARGIN_BOTTOM;

/**
 * Get template-specific font settings
 */
function getTemplateConfig(templateType) {
  switch (templateType) {
    case 'Software Engineer':
      return {
        headingFont: 'helvetica',
        bodyFont: 'helvetica',
        nameFontSize: 18,
        sectionFontSize: 11,
        bodyFontSize: 10,
        subheadingFontSize: 10.5,
        contactFontSize: 8.5,
        lineSpacing: 4.2,
        sectionGap: 5,
        accentColor: [79, 70, 229], // indigo
      };
    case 'Student Resume':
      return {
        headingFont: 'helvetica',
        bodyFont: 'helvetica',
        nameFontSize: 16,
        sectionFontSize: 10,
        bodyFontSize: 9.5,
        subheadingFontSize: 10,
        contactFontSize: 8.5,
        lineSpacing: 4,
        sectionGap: 4.5,
        accentColor: [13, 148, 136], // teal
      };
    case 'Professional ATS':
    default:
      return {
        headingFont: 'times',
        bodyFont: 'times',
        nameFontSize: 20,
        sectionFontSize: 11.5,
        bodyFontSize: 10,
        subheadingFontSize: 10.5,
        contactFontSize: 9,
        lineSpacing: 4.2,
        sectionGap: 5,
        accentColor: [0, 0, 0], // black
      };
  }
}

/**
 * Helper: check if we need a new page, and if so, add one.
 * Returns the new Y position.
 */
function checkPageBreak(doc, y, neededHeight = 10) {
  if (y + neededHeight > MAX_Y) {
    doc.addPage();
    return MARGIN_TOP;
  }
  return y;
}

/**
 * Helper: render wrapped text and return new Y position.
 */
function renderWrappedText(doc, text, x, y, maxWidth, lineHeight) {
  if (!text) return y;
  const paragraphs = text.split(/\r?\n/);
  for (let p = 0; p < paragraphs.length; p++) {
    const paragraph = paragraphs[p];
    if (paragraph.trim() === '' && paragraphs.length > 1) {
      y += lineHeight / 2; // small gap for explicit blank line
      continue;
    }
    const lines = doc.splitTextToSize(paragraph, maxWidth);
    for (let i = 0; i < lines.length; i++) {
      y = checkPageBreak(doc, y, lineHeight);
      doc.text(lines[i], x, y);
      y += lineHeight;
    }
  }
  return y;
}

/**
 * Helper: render a section header with underline.
 */
function renderSectionHeader(doc, title, y, cfg) {
  y = checkPageBreak(doc, y, cfg.sectionGap + 8);
  y += cfg.sectionGap;

  doc.setFont(cfg.headingFont, 'bold');
  doc.setFontSize(cfg.sectionFontSize);
  doc.setTextColor(...cfg.accentColor);
  doc.text(title.toUpperCase(), MARGIN_LEFT, y);

  // Underline
  const textWidth = doc.getTextWidth(title.toUpperCase());
  const lineWidth = Math.max(textWidth, USABLE_WIDTH);
  doc.setDrawColor(...cfg.accentColor);
  doc.setLineWidth(0.3);
  doc.line(MARGIN_LEFT, y + 1, MARGIN_LEFT + lineWidth, y + 1);

  doc.setTextColor(0, 0, 0);
  y += 5;
  return y;
}

/**
 * Main export function.
 */
export function generateResumePDF(resumeData, docTitle) {
  const {
    personalInfo = {},
    summary = '',
    education = [],
    skills = {},
    experience = [],
    projects = [],
    certifications = [],
    achievements = [],
    templateType = 'Professional ATS',
  } = resumeData;

  const cfg = getTemplateConfig(templateType);
  const doc = new jsPDF('p', 'mm', 'a4');
  let y = MARGIN_TOP;

  const isStudent = templateType === 'Student Resume';

  // ── HEADER (Name + Contact) ──────────────────────────────────────────────
  const isATS = templateType === 'Professional ATS';

  // Name
  doc.setFont(cfg.headingFont, 'bold');
  doc.setFontSize(cfg.nameFontSize);
  doc.setTextColor(0, 0, 0);
  const name = personalInfo.fullName || 'Your Name';
  if (isATS) {
    doc.text(name, A4_WIDTH / 2, y, { align: 'center' });
  } else {
    doc.text(name, MARGIN_LEFT, y);
  }
  y += 5;

  // Contact line
  const contactParts = [];
  if (personalInfo.email) contactParts.push(personalInfo.email);
  if (personalInfo.phone) contactParts.push(personalInfo.phone);
  if (personalInfo.location) contactParts.push(personalInfo.location);
  if (personalInfo.linkedin) contactParts.push(`LinkedIn: ${personalInfo.linkedin}`);
  if (personalInfo.github) contactParts.push(`GitHub: ${personalInfo.github}`);
  if (personalInfo.portfolio) contactParts.push(`Portfolio: ${personalInfo.portfolio}`);

  if (contactParts.length > 0) {
    doc.setFont(cfg.bodyFont, 'normal');
    doc.setFontSize(cfg.contactFontSize);
    doc.setTextColor(71, 85, 105);

    const contactStr = contactParts.join('  |  ');
    if (isATS) {
      // Wrap centered contact info
      const contactLines = doc.splitTextToSize(contactStr, USABLE_WIDTH);
      for (const line of contactLines) {
        doc.text(line, A4_WIDTH / 2, y, { align: 'center' });
        y += 3.5;
      }
    } else {
      const contactLines = doc.splitTextToSize(contactStr, USABLE_WIDTH);
      for (const line of contactLines) {
        doc.text(line, MARGIN_LEFT, y);
        y += 3.5;
      }
    }
  }
  y += 2;
  doc.setTextColor(0, 0, 0);

  // ── SECTIONS (order depends on template) ─────────────────────────────────
  const sectionRenderers = {
    summary: () => {
      if (!summary) return;
      y = renderSectionHeader(doc, 'Professional Summary', y, cfg);
      doc.setFont(cfg.bodyFont, 'normal');
      doc.setFontSize(cfg.bodyFontSize);
      doc.setTextColor(51, 65, 85);
      y = renderWrappedText(doc, summary, MARGIN_LEFT, y, USABLE_WIDTH, cfg.lineSpacing);
      doc.setTextColor(0, 0, 0);
    },

    education: () => {
      if (!education || education.length === 0) return;
      y = renderSectionHeader(doc, 'Education', y, cfg);

      education.forEach((edu) => {
        y = checkPageBreak(doc, y, 14);

        // College — Location   |   Start - End
        doc.setFont(cfg.bodyFont, 'bold');
        doc.setFontSize(cfg.subheadingFontSize);
        doc.setTextColor(30, 41, 59);
        const collegeText = `${edu.college || ''}`;
        doc.text(collegeText, MARGIN_LEFT, y);

        if (edu.location) {
          doc.setFont(cfg.bodyFont, 'normal');
          doc.setFontSize(cfg.bodyFontSize - 1);
          doc.setTextColor(71, 85, 105);
          doc.text(` — ${edu.location}`, MARGIN_LEFT + doc.getTextWidth(collegeText), y);
        }

        // Date on right
        const dateText = `${edu.startYear || ''} - ${edu.endYear || ''}`;
        doc.setFont(cfg.bodyFont, 'normal');
        doc.setFontSize(cfg.bodyFontSize - 1);
        doc.setTextColor(100, 116, 139);
        doc.text(dateText, A4_WIDTH - MARGIN_RIGHT, y, { align: 'right' });
        y += cfg.lineSpacing;

        // Degree + GPA
        doc.setFont(cfg.bodyFont, 'italic');
        doc.setFontSize(cfg.bodyFontSize);
        doc.setTextColor(71, 85, 105);
        doc.text(edu.degree || '', MARGIN_LEFT, y);
        if (edu.cgpa) {
          doc.setFont(cfg.bodyFont, 'bold');
          doc.text(`GPA: ${edu.cgpa}`, A4_WIDTH - MARGIN_RIGHT, y, { align: 'right' });
        }
        y += cfg.lineSpacing + 1;
        doc.setTextColor(0, 0, 0);
      });
    },

    skills: () => {
      const skillKeys = Object.keys(skills || {});
      const hasSkills = skillKeys.some(k => skills[k] && skills[k].length > 0);
      if (!hasSkills) return;

      y = renderSectionHeader(doc, 'Technical Skills', y, cfg);

      skillKeys.forEach((key) => {
        const list = skills[key] || [];
        if (list.length === 0) return;

        y = checkPageBreak(doc, y, 6);
        const label = key.charAt(0).toUpperCase() + key.slice(1);

        doc.setFont(cfg.bodyFont, 'bold');
        doc.setFontSize(cfg.bodyFontSize);
        doc.setTextColor(30, 41, 59);
        doc.text(`${label}: `, MARGIN_LEFT, y);

        const labelWidth = doc.getTextWidth(`${label}: `);
        doc.setFont(cfg.bodyFont, 'normal');
        doc.setTextColor(51, 65, 85);

        const skillStr = list.join(', ');
        const availableWidth = USABLE_WIDTH - labelWidth;
        const skillLines = doc.splitTextToSize(skillStr, availableWidth);

        // First line after label
        if (skillLines.length > 0) {
          doc.text(skillLines[0], MARGIN_LEFT + labelWidth, y);
          y += cfg.lineSpacing;
        }
        // Remaining wrapped lines
        for (let i = 1; i < skillLines.length; i++) {
          y = checkPageBreak(doc, y, cfg.lineSpacing);
          doc.text(skillLines[i], MARGIN_LEFT, y);
          y += cfg.lineSpacing;
        }
        doc.setTextColor(0, 0, 0);
      });
    },

    experience: () => {
      if (!experience || experience.length === 0) return;
      y = renderSectionHeader(doc, 'Experience', y, cfg);

      experience.forEach((exp) => {
        y = checkPageBreak(doc, y, 16);

        // Role — Company   |   Start - End
        doc.setFont(cfg.bodyFont, 'bold');
        doc.setFontSize(cfg.subheadingFontSize);
        doc.setTextColor(30, 41, 59);
        const roleText = exp.role || '';
        doc.text(roleText, MARGIN_LEFT, y);

        if (exp.company) {
          doc.setFont(cfg.bodyFont, 'normal');
          doc.setTextColor(71, 85, 105);
          const dashText = ` — ${exp.company}`;
          doc.text(dashText, MARGIN_LEFT + doc.getTextWidth(roleText), y);
        }

        // Date on right
        const dateText = `${exp.startDate || ''} - ${exp.endDate || ''}`;
        doc.setFont(cfg.bodyFont, 'normal');
        doc.setFontSize(cfg.bodyFontSize - 1);
        doc.setTextColor(100, 116, 139);
        doc.text(dateText, A4_WIDTH - MARGIN_RIGHT, y, { align: 'right' });
        y += cfg.lineSpacing + 0.5;

        // Description
        if (exp.description) {
          doc.setFont(cfg.bodyFont, 'normal');
          doc.setFontSize(cfg.bodyFontSize);
          doc.setTextColor(71, 85, 105);
          y = renderWrappedText(doc, exp.description, MARGIN_LEFT, y, USABLE_WIDTH, cfg.lineSpacing);
        }
        y += 1.5;
        doc.setTextColor(0, 0, 0);
      });
    },

    projects: () => {
      if (!projects || projects.length === 0) return;
      y = renderSectionHeader(doc, 'Projects', y, cfg);

      projects.forEach((proj) => {
        y = checkPageBreak(doc, y, 14);

        // Project Name (Technologies)
        doc.setFont(cfg.bodyFont, 'bold');
        doc.setFontSize(cfg.subheadingFontSize);
        doc.setTextColor(30, 41, 59);
        let projHeader = proj.projectName || '';
        doc.text(projHeader, MARGIN_LEFT, y);

        if (proj.technologies) {
          doc.setFont(cfg.bodyFont, 'normal');
          doc.setFontSize(cfg.bodyFontSize - 1);
          doc.setTextColor(100, 116, 139);
          doc.text(` (${proj.technologies})`, MARGIN_LEFT + doc.getTextWidth(projHeader), y);
        }

        // Links on right
        const links = [];
        if (proj.githubLink) links.push('GitHub');
        if (proj.liveLink) links.push('Demo');
        if (links.length > 0) {
          doc.setFont(cfg.bodyFont, 'normal');
          doc.setFontSize(cfg.bodyFontSize - 1);
          doc.setTextColor(...cfg.accentColor);
          doc.text(links.join('  '), A4_WIDTH - MARGIN_RIGHT, y, { align: 'right' });
        }

        y += cfg.lineSpacing + 0.5;

        // Description
        if (proj.description) {
          doc.setFont(cfg.bodyFont, 'normal');
          doc.setFontSize(cfg.bodyFontSize);
          doc.setTextColor(71, 85, 105);
          y = renderWrappedText(doc, proj.description, MARGIN_LEFT, y, USABLE_WIDTH, cfg.lineSpacing);
        }
        y += 1.5;
        doc.setTextColor(0, 0, 0);
      });
    },

    certifications: () => {
      if (!certifications || certifications.length === 0) return;
      y = renderSectionHeader(doc, 'Certifications', y, cfg);

      certifications.forEach((cert) => {
        y = checkPageBreak(doc, y, 6);

        doc.setFont(cfg.bodyFont, 'bold');
        doc.setFontSize(cfg.bodyFontSize);
        doc.setTextColor(30, 41, 59);
        const certName = cert.name || '';
        doc.text(certName, MARGIN_LEFT, y);

        if (cert.issuer) {
          doc.setFont(cfg.bodyFont, 'normal');
          doc.setTextColor(100, 116, 139);
          doc.text(` — ${cert.issuer}`, MARGIN_LEFT + doc.getTextWidth(certName), y);
        }

        if (cert.date) {
          doc.setFont(cfg.bodyFont, 'normal');
          doc.setFontSize(cfg.bodyFontSize - 1);
          doc.setTextColor(100, 116, 139);
          doc.text(cert.date, A4_WIDTH - MARGIN_RIGHT, y, { align: 'right' });
        }

        y += cfg.lineSpacing;
        doc.setTextColor(0, 0, 0);
      });
    },

    achievements: () => {
      if (!achievements || achievements.length === 0) return;
      y = renderSectionHeader(doc, 'Achievements', y, cfg);

      achievements.forEach((ach) => {
        if (!ach.text) return;
        y = checkPageBreak(doc, y, 6);

        doc.setFont(cfg.bodyFont, 'normal');
        doc.setFontSize(cfg.bodyFontSize);
        doc.setTextColor(51, 65, 85);

        // Bullet point prefix
        const bulletX = MARGIN_LEFT + 2;
        const textX = MARGIN_LEFT + 6;
        const textWidth = USABLE_WIDTH - 6;

        doc.text('•', bulletX, y);
        const lines = doc.splitTextToSize(ach.text, textWidth);
        for (let i = 0; i < lines.length; i++) {
          y = checkPageBreak(doc, y, cfg.lineSpacing);
          doc.text(lines[i], textX, y);
          y += cfg.lineSpacing;
        }
        doc.setTextColor(0, 0, 0);
      });
    },
  };

  // Section order depends on template
  const sectionOrder = isStudent
    ? ['education', 'summary', 'skills', 'experience', 'projects', 'certifications', 'achievements']
    : ['summary', 'education', 'skills', 'experience', 'projects', 'certifications', 'achievements'];

  sectionOrder.forEach((section) => {
    if (sectionRenderers[section]) {
      sectionRenderers[section]();
    }
  });

  // Save
  doc.save(`${docTitle || 'resume'}.pdf`);
}
