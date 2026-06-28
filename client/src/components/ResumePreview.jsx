import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Typography, IconButton, Tooltip, Paper } from '@mui/material';
import CommentIcon from '@mui/icons-material/Comment';
import EditIcon from '@mui/icons-material/Edit';

export const ResumePreview = ({
  resumeData = {},
  onCommentClick,
  onSuggestionClick,
  userRole = 'VIEWER',
}) => {
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

  const showActions = userRole !== 'VIEWER';
  const measurementRef = useRef(null);
  const containerRef = useRef(null);
  
  const [paginatedPages, setPaginatedPages] = useState([]);
  const [scale, setScale] = useState(1);

  // Auto-scale ResizeObserver to fit available width
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const width = entry.contentRect.width;
        // A4 page width is 794px. Leave 32px padding gap.
        const usableWidth = width - 32;
        if (usableWidth > 0) {
          const newScale = Math.min(1, Math.max(0.3, usableWidth / 794));
          setScale(newScale);
        }
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Helper to render section action buttons (Comment & Suggest)
  const renderItemActions = (section, sectionId, fieldName, currentValue) => {
    if (!showActions) return null;
    return (
      <Box
        className="resume-actions-overlay"
        sx={{
          position: 'absolute',
          right: 4,
          top: -2,
          display: 'none',
          gap: 0.5,
          zIndex: 10,
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '4px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
          padding: '2px',
        }}
      >
        {onCommentClick && (
          <Tooltip title="Comment on this section">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onCommentClick(section, sectionId);
              }}
              sx={{ color: '#6366f1', p: 0.5 }}
            >
              <CommentIcon sx={{ fontSize: '14px' }} />
            </IconButton>
          </Tooltip>
        )}
        {onSuggestionClick && fieldName && (
          <Tooltip title="Suggest edit">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onSuggestionClick(section, sectionId, fieldName, currentValue);
              }}
              sx={{ color: '#8a2be2', p: 0.5 }}
            >
              <EditIcon sx={{ fontSize: '14px' }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    );
  };

  // Styles wrapper for different templates
  const getTemplateStyles = useCallback(() => {
    switch (templateType) {
      case 'Software Engineer':
        return {
          fontFamily: '"Calibri", "Arial", sans-serif',
          primaryColor: '#000000',
          accentColor: '#4f46e5',
          fontSizeName: '28px',
          fontSizeHeader: '16px',
          letterSpacing: '0.02em',
        };
      case 'Student Resume':
        return {
          fontFamily: '"Calibri", "Arial", sans-serif',
          primaryColor: '#000000',
          accentColor: '#0d9488',
          fontSizeName: '28px',
          fontSizeHeader: '16px',
          letterSpacing: '0.02em',
        };
      case 'Professional ATS':
      default:
        return {
          fontFamily: '"Times New Roman", Times, serif',
          primaryColor: '#000000',
          accentColor: '#000000',
          fontSizeName: '28px',
          fontSizeHeader: '16px',
          letterSpacing: '0.02em',
        };
    }
  }, [templateType]);

  const style = getTemplateStyles();

  // Helper to split paragraph text into standard bullets
  const renderBullets = (text) => {
    if (!text) return null;
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return null;
    return (
      <Box
        component="ul"
        sx={{
          margin: '4px 0 0 0',
          paddingLeft: '20px',
          listStyleType: 'disc',
          fontFamily: style.fontFamily,
        }}
      >
        {lines.map((line, idx) => {
          const cleanLine = line.replace(/^[•\-\*\s\u2022]+/, '').trim();
          return (
            <Box
              component="li"
              key={idx}
              sx={{
                fontSize: '11px',
                color: '#1e293b',
                lineHeight: 1.4,
                mb: 0.3,
                wordBreak: 'break-word',
              }}
            >
              {cleanLine}
            </Box>
          );
        })}
      </Box>
    );
  };

  // Sub-renders
  const renderHeader = () => {
    const contactParts = [];
    if (personalInfo.email) contactParts.push(personalInfo.email);
    if (personalInfo.phone) contactParts.push(personalInfo.phone);
    if (personalInfo.location) contactParts.push(personalInfo.location);
    
    if (personalInfo.linkedin) {
      const cleanLinkedin = personalInfo.linkedin.replace(/^(https?:\/\/)?(www\.)?/, '');
      contactParts.push(`LinkedIn: ${cleanLinkedin}`);
    }
    if (personalInfo.github) {
      const cleanGithub = personalInfo.github.replace(/^(https?:\/\/)?(www\.)?/, '');
      contactParts.push(`GitHub: ${cleanGithub}`);
    }
    if (personalInfo.portfolio) {
      const cleanPortfolio = personalInfo.portfolio.replace(/^(https?:\/\/)?(www\.)?/, '');
      contactParts.push(`Portfolio: ${cleanPortfolio}`);
    }

    return (
      <Box sx={{ textAlign: 'center', mb: 2, position: 'relative' }}>
        <Typography
          sx={{
            fontFamily: style.fontFamily,
            fontWeight: 'bold',
            fontSize: '28px',
            color: style.primaryColor,
            lineHeight: 1.2,
            textTransform: 'uppercase',
          }}
        >
          {personalInfo.fullName || 'Your Name'}
        </Typography>
        
        {contactParts.length > 0 && (
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '6px 12px',
              mt: 0.5,
              fontSize: '11px',
              color: '#334155',
              fontFamily: style.fontFamily,
              lineHeight: 1.4,
            }}
          >
            {contactParts.map((part, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span style={{ color: '#94a3b8' }}>|</span>}
                {part.includes(': ') ? (
                  <span>
                    {part.split(': ')[0]}: <a
                      href={part.split(': ')[1].startsWith('http') ? part.split(': ')[1] : `https://${part.split(': ')[1]}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#334155', textDecoration: 'underline' }}
                    >
                      {part.split(': ')[1]}
                    </a>
                  </span>
                ) : (
                  <span>{part}</span>
                )}
              </React.Fragment>
            ))}
          </Box>
        )}
        {renderItemActions('personalInfo', 'header', 'fullName', personalInfo.fullName)}
      </Box>
    );
  };

  const renderSectionHeader = (title) => {
    return (
      <Box sx={{ mt: '16px', mb: '8px' }}>
        <Typography
          sx={{
            fontFamily: style.fontFamily,
            fontWeight: 700,
            fontSize: '16px',
            color: style.accentColor,
            textTransform: 'uppercase',
            letterSpacing: style.letterSpacing,
            borderBottom: `2px solid ${style.accentColor || '#333'}`,
            pb: '4px',
            lineHeight: 1.2,
          }}
        >
          {title}
        </Typography>
      </Box>
    );
  };

  const renderSummarySection = () => {
    if (!summary) return null;
    return (
      <Box
        className="resume-preview-section"
        sx={{ position: 'relative', '&:hover .resume-actions-overlay': { display: 'flex' } }}
      >
        {renderSectionHeader('Professional Summary')}
        <Typography
          sx={{
            fontFamily: style.fontFamily,
            fontSize: '11px',
            color: '#1e293b',
            lineHeight: 1.4,
            textAlign: 'justify',
            whiteSpace: 'pre-line',
          }}
        >
          {summary}
        </Typography>
        {renderItemActions('summary', 'summary', 'text', summary)}
      </Box>
    );
  };

  const renderSkillsSection = () => {
    const skillKeys = Object.keys(skills || {});
    const hasSkills = skillKeys.some(k => skills[k] && skills[k].length > 0);
    if (!hasSkills) return null;

    return (
      <Box
        className="resume-preview-section"
        sx={{ position: 'relative', '&:hover .resume-actions-overlay': { display: 'flex' } }}
      >
        {renderSectionHeader('Technical Skills')}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {skillKeys.map((key) => {
            const list = skills[key] || [];
            if (list.length === 0) return null;
            const label = key.charAt(0).toUpperCase() + key.slice(1);
            return (
              <Typography
                key={key}
                sx={{
                  fontFamily: style.fontFamily,
                  fontSize: '11px',
                  color: '#1e293b',
                  lineHeight: 1.4,
                }}
              >
                <strong style={{ textTransform: 'capitalize', color: '#000000' }}>{label}: </strong>
                {list.join(', ')}
              </Typography>
            );
          })}
        </Box>
        {renderItemActions('skills', 'skills', null, null)}
      </Box>
    );
  };

  // Block Rendering dispatcher
  const renderBlock = (block) => {
    switch (block.type) {
      case 'personalInfo':
        return renderHeader();
      case 'summary':
        return renderSummarySection();
      case 'skills':
        return renderSkillsSection();
      case 'education-item': {
        const edu = education[block.index];
        if (!edu) return null;
        return (
          <Box key={edu.id || edu._id} sx={{ mb: '8px' }}>
            {block.index === 0 && renderSectionHeader('Education')}
            <Box
              className="resume-preview-section"
              sx={{
                position: 'relative',
                '&:hover .resume-actions-overlay': { display: 'flex' },
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <Typography sx={{ fontFamily: style.fontFamily, fontWeight: 'bold', fontSize: '14px', color: '#000000' }}>
                  {edu.college} <span style={{ fontWeight: 'normal', color: '#475569', fontSize: '11px' }}>— {edu.location}</span>
                </Typography>
                <Typography sx={{ fontFamily: style.fontFamily, fontSize: '11px', color: '#000000' }}>
                  {edu.startYear} - {edu.endYear}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.2 }}>
                <Typography sx={{ fontFamily: style.fontFamily, fontSize: '13px', color: '#475569', fontStyle: 'italic' }}>
                  {edu.degree}
                </Typography>
                {edu.cgpa && (
                  <Typography sx={{ fontFamily: style.fontFamily, fontSize: '11px', fontWeight: 'bold', color: '#475569' }}>
                    GPA: {edu.cgpa}
                  </Typography>
                )}
              </Box>
              {renderItemActions('education', edu.id || edu._id, 'degree', edu.degree)}
            </Box>
          </Box>
        );
      }
      case 'experience-item': {
        const exp = experience[block.index];
        if (!exp) return null;
        return (
          <Box key={exp.id || exp._id} sx={{ mb: '8px' }}>
            {block.index === 0 && renderSectionHeader('Experience')}
            <Box
              className="resume-preview-section"
              sx={{
                position: 'relative',
                '&:hover .resume-actions-overlay': { display: 'flex' },
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', mb: 0.2 }}>
                <Typography sx={{ fontFamily: style.fontFamily, fontWeight: 'bold', fontSize: '14px', color: '#000000', lineHeight: 1.2 }}>
                  {exp.role}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mt: 0.2 }}>
                  <Typography sx={{ fontFamily: style.fontFamily, fontSize: '13px', fontStyle: 'italic', color: '#475569' }}>
                    {exp.company}
                  </Typography>
                  <Typography sx={{ fontFamily: style.fontFamily, fontSize: '11px', color: '#475569' }}>
                    {exp.startDate} - {exp.endDate}
                  </Typography>
                </Box>
              </Box>
              {renderBullets(exp.description)}
              {renderItemActions('experience', exp.id || exp._id, 'description', exp.description)}
            </Box>
          </Box>
        );
      }
      case 'projects-item': {
        const proj = projects[block.index];
        if (!proj) return null;
        return (
          <Box key={proj.id || proj._id} sx={{ mb: '8px' }}>
            {block.index === 0 && renderSectionHeader('Projects')}
            <Box
              className="resume-preview-section"
              sx={{
                position: 'relative',
                '&:hover .resume-actions-overlay': { display: 'flex' },
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', mb: 0.2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <Typography sx={{ fontFamily: style.fontFamily, fontWeight: 'bold', fontSize: '14px', color: '#000000' }}>
                    {proj.projectName}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, fontSize: '11px', fontFamily: style.fontFamily }}>
                    {proj.githubLink && (
                      <a
                        href={proj.githubLink.startsWith('http') ? proj.githubLink : `https://${proj.githubLink}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: style.accentColor === '#000000' ? '#2563eb' : style.accentColor, textDecoration: 'underline' }}
                      >
                        GitHub
                      </a>
                    )}
                    {proj.githubLink && proj.liveLink && <span style={{ color: '#94a3b8' }}>|</span>}
                    {proj.liveLink && (
                      <a
                        href={proj.liveLink.startsWith('http') ? proj.liveLink : `https://${proj.liveLink}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: style.accentColor === '#000000' ? '#2563eb' : style.accentColor, textDecoration: 'underline' }}
                      >
                        Live Demo
                      </a>
                    )}
                  </Box>
                </Box>
                {proj.technologies && (
                  <Typography sx={{ fontFamily: style.fontFamily, fontSize: '11px', color: '#475569', fontStyle: 'italic', mt: 0.1 }}>
                    {proj.technologies}
                  </Typography>
                )}
              </Box>
              {renderBullets(proj.description)}
              {renderItemActions('projects', proj.id || proj._id, 'description', proj.description)}
            </Box>
          </Box>
        );
      }
      case 'certifications': {
        if (!certifications || certifications.length === 0) return null;
        return (
          <Box sx={{ mb: 0.5 }}>
            {renderSectionHeader('Certifications')}
            {certifications.map((cert) => (
              <Box
                key={cert.id || cert._id}
                className="resume-preview-section"
                sx={{
                  position: 'relative',
                  '&:hover .resume-actions-overlay': { display: 'flex' },
                  mb: '4px',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <Typography sx={{ fontFamily: style.fontFamily, fontWeight: 'bold', fontSize: '12px', color: '#000000' }}>
                    {cert.name} <span style={{ fontWeight: 'normal', color: '#475569' }}>— {cert.issuer}</span>
                  </Typography>
                  <Typography sx={{ fontFamily: style.fontFamily, fontSize: '11px', color: '#64748b' }}>
                    {cert.date}
                  </Typography>
                </Box>
                {renderItemActions('certifications', cert.id || cert._id, 'name', cert.name)}
              </Box>
            ))}
          </Box>
        );
      }
      case 'achievements': {
        if (!achievements || achievements.length === 0) return null;
        return (
          <Box sx={{ mb: 0.3 }}>
            {renderSectionHeader('Achievements')}
            <Box
              component="ul"
              sx={{
                margin: 0,
                paddingLeft: '20px',
                fontSize: '11px',
                fontFamily: style.fontFamily,
                color: '#1e293b',
                listStyleType: 'disc',
              }}
            >
              {achievements.map((ach) => (
                <Box
                  key={ach.id || ach._id}
                  component="li"
                  className="resume-preview-section"
                  sx={{
                    position: 'relative',
                    '&:hover .resume-actions-overlay': { display: 'flex' },
                    mb: 0.3,
                  }}
                >
                  <span style={{ wordBreak: 'break-word', lineHeight: 1.4 }}>{ach.text}</span>
                  {renderItemActions('achievements', ach.id || ach._id, 'text', ach.text)}
                </Box>
              ))}
            </Box>
          </Box>
        );
      }
      default:
        return null;
    }
  };

  // Helper to build list of active blocks depending on template order rules
  const getBlocksList = useCallback(() => {
    const list = [];
    list.push({ type: 'personalInfo', id: 'personalInfo' });

    const sectionsOrder = [];
    const isStudent = templateType === 'Student Resume';

    if (isStudent) {
      sectionsOrder.push('education');
      sectionsOrder.push('summary');
    } else {
      sectionsOrder.push('summary');
      sectionsOrder.push('education');
    }

    sectionsOrder.push('skills');
    sectionsOrder.push('experience');
    sectionsOrder.push('projects');
    sectionsOrder.push('certifications');
    sectionsOrder.push('achievements');

    sectionsOrder.forEach((section) => {
      if (section === 'summary' && summary) {
        list.push({ type: 'summary', id: 'summary' });
      } else if (section === 'skills') {
        const skillKeys = Object.keys(skills || {});
        const hasSkills = skillKeys.some(k => skills[k] && skills[k].length > 0);
        if (hasSkills) {
          list.push({ type: 'skills', id: 'skills' });
        }
      } else if (section === 'education' && education && education.length > 0) {
        education.forEach((_, idx) => {
          list.push({ type: 'education-item', id: `education-${idx}`, index: idx });
        });
      } else if (section === 'experience' && experience && experience.length > 0) {
        experience.forEach((_, idx) => {
          list.push({ type: 'experience-item', id: `experience-${idx}`, index: idx });
        });
      } else if (section === 'projects' && projects && projects.length > 0) {
        projects.forEach((_, idx) => {
          list.push({ type: 'projects-item', id: `projects-${idx}`, index: idx });
        });
      } else if (section === 'certifications' && certifications && certifications.length > 0) {
        list.push({ type: 'certifications', id: 'certifications' });
      } else if (section === 'achievements' && achievements && achievements.length > 0) {
        list.push({ type: 'achievements', id: 'achievements' });
      }
    });

    return list;
  }, [summary, skills, education, experience, projects, certifications, achievements, templateType]);

  const blocks = getBlocksList();

  // ── A4 Pagination Engine ──────────────────────────────────────────────────
  // A4 Page Height = 1123px. Padding = 15mm top + 15mm bottom = 113px.
  // Usable vertical height is 1123px - 113px = 1010px.
  const MAX_PAGE_CONTENT_HEIGHT = 1010;

  const calculatePagination = useCallback(() => {
    const container = measurementRef.current;
    if (!container) return;

    const children = container.children;
    if (!children || children.length === 0) return;

    const measuredBlocks = [];
    const activeBlocks = getBlocksList();

    let allZero = true;
    for (let i = 0; i < children.length; i++) {
      const el = children[i];
      const height = el.getBoundingClientRect().height;
      if (height > 0) {
        allZero = false;
      }
      if (activeBlocks[i]) {
        measuredBlocks.push({
          ...activeBlocks[i],
          height: height,
        });
      }
    }

    // If heights haven't been computed/laid out by the browser yet, retry shortly
    if (allZero && children.length > 0) {
      setTimeout(calculatePagination, 50);
      return;
    }

    const pages = [];
    let currentPage = [];
    let currentHeight = 0;

    measuredBlocks.forEach((block) => {
      const blockHeight = block.height;

      // Case 1: Block fits on the current page
      if (currentHeight + blockHeight <= MAX_PAGE_CONTENT_HEIGHT) {
        currentPage.push(block);
        currentHeight += blockHeight;
        return;
      }

      // Case 2: Block doesn't fit, but there are already items on this page.
      // Flush the current page and start a new one with this block.
      if (currentPage.length > 0) {
        pages.push(currentPage);
        currentPage = [block];
        currentHeight = blockHeight;
        return;
      }

      // Case 3: Block is the first item on a fresh page but is taller than
      // MAX_PAGE_CONTENT_HEIGHT (oversized). Place it alone on this page.
      currentPage.push(block);
      pages.push(currentPage);
      currentPage = [];
      currentHeight = 0;
    });

    if (currentPage.length > 0) {
      pages.push(currentPage);
    }

    setPaginatedPages(prev => {
      const isSameLayout = prev.length === pages.length &&
        prev.every((page, pIdx) =>
          page.length === pages[pIdx].length &&
          page.every((block, bIdx) => block.id === pages[pIdx][bIdx].id && Math.abs(block.height - pages[pIdx][bIdx].height) < 0.5)
        );
      return isSameLayout ? prev : pages;
    });
  }, [getBlocksList]);

  // Recalculate pagination reactively on layout/resize events of the elements
  useEffect(() => {
    const el = measurementRef.current;
    if (!el) return;

    const observer = new ResizeObserver(() => {
      calculatePagination();
    });

    // Observe children sizes dynamically to trigger instant paginations
    Array.from(el.children).forEach(child => observer.observe(child));
    observer.observe(el);

    // Run initial call
    calculatePagination();

    return () => observer.disconnect();
  }, [calculatePagination]);

  return (
    <Box
      ref={containerRef}
      sx={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        boxSizing: 'border-box',
        overflowX: 'auto',
      }}
    >
      {/* ── Hidden Measurement Container ─────────────────────────────── */}
      <Box
        ref={measurementRef}
        sx={{
          position: 'absolute',
          left: '-9999px',
          top: '-9999px',
          width: '680px', // 794px A4 pixel width - 114px (15mm left + 15mm right padding)
          visibility: 'hidden',
          pointerEvents: 'none',
          backgroundColor: '#ffffff',
          color: '#000000',
        }}
      >
        {blocks.map((block) => (
          <Box key={block.id} data-block-id={block.id} sx={{ display: 'flow-root' }}>
            {renderBlock(block)}
          </Box>
        ))}
      </Box>

      {/* ── Scaled Pages Wrapper ─────────────────────────────────────── */}
      <Box
        className="resume-preview-pages-wrapper"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
          width: '794px', // fixed unscaled width of A4 page
          height: paginatedPages.length > 0
            ? `${(paginatedPages.length * 1123 + (paginatedPages.length - 1) * 24 + 16) * scale}px`
            : `${(1123 + 16) * scale}px`,
          transition: 'transform 0.1s ease, height 0.15s ease',
          flexShrink: 0,
        }}
      >
        {/* ── Paginated A4 Page Sheets ─────────────────────────────────── */}
        {paginatedPages.length > 0 ? (
          paginatedPages.map((pageBlocks, pageIdx) => (
            <Paper
              key={pageIdx}
              className="resume-preview-paper"
              elevation={4}
              sx={{
                width: '210mm',
                height: '297mm',
                minHeight: '297mm',
                maxHeight: '297mm',
                backgroundColor: '#ffffff',
                borderRadius: '0px',
                color: '#000000',
                padding: '15mm',
                boxSizing: 'border-box',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
                position: 'relative',
                flexShrink: 0,
                overflow: 'hidden',
                mb: 3,
              }}
            >
              {pageBlocks.map((block) => (
                <Box key={block.id} sx={{ display: 'flow-root' }}>
                  {renderBlock(block)}
                </Box>
              ))}
            </Paper>
          ))
        ) : (
          /* Fallback first render page while calculations load */
          <Paper
            className="resume-preview-paper"
            elevation={4}
            sx={{
              width: '210mm',
              height: '297mm',
              minHeight: '297mm',
              maxHeight: '297mm',
              backgroundColor: '#ffffff',
              borderRadius: '0px',
              color: '#000000',
              padding: '15mm',
              boxSizing: 'border-box',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
              position: 'relative',
            }}
          >
            {blocks.map((block) => (
              <Box key={block.id} sx={{ display: 'flow-root' }}>
                {renderBlock(block)}
              </Box>
            ))}
          </Paper>
        )}
      </Box>
    </Box>
  );
};

export default ResumePreview;
