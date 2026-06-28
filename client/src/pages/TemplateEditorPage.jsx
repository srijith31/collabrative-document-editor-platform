import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, Button, TextField, Card, CardContent,
  IconButton, CircularProgress, Alert, Tooltip, Tab, Tabs, Divider, List, ListItem, ListItemText, ListItemSecondaryAction
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import SchoolIcon from '@mui/icons-material/School';
import GroupIcon from '@mui/icons-material/Group';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import BusinessIcon from '@mui/icons-material/Business';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import Quill from 'quill';

import templateService from '../services/templateService';

export const TemplateEditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [templateName, setTemplateName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [coverPage, setCoverPage] = useState({
    title: '',
    department: '',
    college: '',
    students: [],
    guide: '',
    year: ''
  });
  const [sections, setSections] = useState([]);
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('sections'); // 'sections' or 'cover'
  const [showPreview, setShowPreview] = useState(true);

  // Refs to avoid Quill cursor jumping on state changes
  const sectionsRef = useRef([]);
  const activeSectionIndexRef = useRef(0);
  const quillRef = useRef(null);
  const editorContainerRef = useRef(null);

  // Autosave states
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved', 'saving', 'unsaved', 'error'
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // For inline renaming
  const [renamingIndex, setRenamingIndex] = useState(null);
  const [renamingTitle, setRenamingTitle] = useState('');

  // Student list temp state
  const [newStudent, setNewStudent] = useState('');

  // 1. Fetch template data on mount
  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const data = await templateService.getTemplateById(id);
        setTemplateName(data.name);
        setCoverPage(data.coverPage || {
          title: '',
          department: '',
          college: '',
          students: [],
          guide: '',
          year: ''
        });
        setSections(data.sections || []);
        
        sectionsRef.current = data.sections || [];
        activeSectionIndexRef.current = 0;
        setActiveSectionIndex(0);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load template:', err);
        setError('Failed to load the PDF template. Please try again.');
        setLoading(false);
      }
    };
    fetchTemplate();
  }, [id]);

  // 2. Initialize Quill editor once loading is finished
  useEffect(() => {
    if (loading || error || !editorContainerRef.current) return;

    // Clear and build the editor DOM element
    editorContainerRef.current.innerHTML = '<div id="quill-template-editor"></div>';

    const quill = new Quill('#quill-template-editor', {
      theme: 'snow',
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ color: [] }, { background: [] }],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['clean'],
        ],
      },
    });

    quillRef.current = quill;

    // Load initial section content formatted as HTML
    const currentSec = sectionsRef.current[activeSectionIndexRef.current];
    if (currentSec) {
      quill.root.innerHTML = formatContentToHtml(currentSec.content);
    }

    // Bind text-change event to update internal ref structure and trigger autosave
    const handleTextChange = (delta, oldDelta, source) => {
      if (source !== 'user') return;
      
      const html = quill.root.innerHTML;
      if (sectionsRef.current[activeSectionIndexRef.current]) {
        sectionsRef.current[activeSectionIndexRef.current].content = html;
        setSections([...sectionsRef.current]);
        setHasUnsavedChanges(true);
        setSaveStatus('unsaved');
      }
    };

    quill.on('text-change', handleTextChange);

    return () => {
      quill.off('text-change', handleTextChange);
      quillRef.current = null;
    };
  }, [loading, error]);

  // Helper to ensure line breaks map to HTML paragraphs for Quill
  const formatContentToHtml = (content) => {
    if (!content) return '<p><br></p>';
    if (content.startsWith('<p>') || content.startsWith('<div>') || content.includes('</p>')) {
      return content;
    }
    return content.split('\n')
      .map(p => p.trim() ? `<p>${p.trim()}</p>` : '<p><br></p>')
      .join('');
  };

  // 3. Debounced Autosave (5 seconds trigger)
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const saveTimer = setTimeout(async () => {
      await saveTemplateData();
    }, 5000);

    return () => clearTimeout(saveTimer);
  }, [hasUnsavedChanges, templateName, coverPage, sections]);

  const saveTemplateData = async () => {
    setSaveStatus('saving');
    try {
      // Sync editor's current content before saving
      if (quillRef.current && sectionsRef.current[activeSectionIndexRef.current]) {
        sectionsRef.current[activeSectionIndexRef.current].content = quillRef.current.root.innerHTML;
      }

      await templateService.updateTemplate(id, {
        name: templateName,
        coverPage,
        sections: sectionsRef.current
      });
      setHasUnsavedChanges(false);
      setSaveStatus('saved');
    } catch (err) {
      console.error('Failed to autosave template:', err);
      setSaveStatus('error');
    }
  };

  // Switch sections without cursor jumping
  const handleSectionSelect = (index) => {
    if (index === activeSectionIndex) return;

    // 1. Sync current editor content to current section in ref
    if (quillRef.current && sectionsRef.current[activeSectionIndexRef.current]) {
      sectionsRef.current[activeSectionIndexRef.current].content = quillRef.current.root.innerHTML;
    }

    // 2. Update indices
    activeSectionIndexRef.current = index;
    setActiveSectionIndex(index);

    // 3. Load the new section content into Quill editor
    const newSec = sectionsRef.current[index];
    if (quillRef.current && newSec) {
      quillRef.current.root.innerHTML = formatContentToHtml(newSec.content);
    }
  };

  // Edit actions: Add, Delete, Duplicate, Rename, Reorder
  const handleAddSection = () => {
    const newId = `section-${Date.now()}`;
    const newSec = {
      id: newId,
      title: 'New Section',
      content: '<p><br></p>',
      pageNumber: sections.length > 0 ? (sections[sections.length - 1].pageNumber || 1) : 1
    };

    const newSectionsArray = [...sectionsRef.current, newSec];
    sectionsRef.current = newSectionsArray;
    setSections(newSectionsArray);
    setHasUnsavedChanges(true);
    setSaveStatus('unsaved');

    // Automatically select the new section
    handleSectionSelect(newSectionsArray.length - 1);
  };

  const handleDeleteSection = (index, e) => {
    e.stopPropagation();
    if (sections.length <= 1) {
      alert("A template must have at least one section.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this section?")) return;

    const newSectionsArray = sectionsRef.current.filter((_, i) => i !== index);
    sectionsRef.current = newSectionsArray;
    setSections(newSectionsArray);
    setHasUnsavedChanges(true);
    setSaveStatus('unsaved');

    // Readjust active section index if current was deleted or shifted
    if (activeSectionIndex === index) {
      const targetIndex = index === 0 ? 0 : index - 1;
      activeSectionIndexRef.current = targetIndex;
      setActiveSectionIndex(targetIndex);
      
      const targetSec = newSectionsArray[targetIndex];
      if (quillRef.current && targetSec) {
        quillRef.current.root.innerHTML = formatContentToHtml(targetSec.content);
      }
    } else if (activeSectionIndex > index) {
      const targetIndex = activeSectionIndex - 1;
      activeSectionIndexRef.current = targetIndex;
      setActiveSectionIndex(targetIndex);
    }
  };

  const handleDuplicateSection = (index, e) => {
    e.stopPropagation();
    const sourceSec = sectionsRef.current[index];
    const newId = `section-dup-${Date.now()}`;
    const duplicatedSec = {
      ...sourceSec,
      id: newId,
      title: `${sourceSec.title} - Copy`,
      content: sourceSec.content
    };

    // Insert duplicated section right after the source
    const newSectionsArray = [...sectionsRef.current];
    newSectionsArray.splice(index + 1, 0, duplicatedSec);

    sectionsRef.current = newSectionsArray;
    setSections(newSectionsArray);
    setHasUnsavedChanges(true);
    setSaveStatus('unsaved');

    // Select the duplicated section
    handleSectionSelect(index + 1);
  };

  const handleStartRename = (index, e) => {
    e.stopPropagation();
    setRenamingIndex(index);
    setRenamingTitle(sections[index].title);
  };

  const handleConfirmRename = (index, e) => {
    if (e) e.stopPropagation();
    if (!renamingTitle.trim()) return;

    const newSectionsArray = [...sectionsRef.current];
    newSectionsArray[index].title = renamingTitle.trim();
    
    sectionsRef.current = newSectionsArray;
    setSections(newSectionsArray);
    setRenamingIndex(null);
    setHasUnsavedChanges(true);
    setSaveStatus('unsaved');
  };

  const handleReorderSection = (index, direction, e) => {
    e.stopPropagation();
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === sections.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const newSectionsArray = [...sectionsRef.current];
    
    // Swap items
    const temp = newSectionsArray[index];
    newSectionsArray[index] = newSectionsArray[targetIndex];
    newSectionsArray[targetIndex] = temp;

    sectionsRef.current = newSectionsArray;
    setSections(newSectionsArray);
    setHasUnsavedChanges(true);
    setSaveStatus('unsaved');

    // Adjust active section pointer
    if (activeSectionIndex === index) {
      activeSectionIndexRef.current = targetIndex;
      setActiveSectionIndex(targetIndex);
    } else if (activeSectionIndex === targetIndex) {
      activeSectionIndexRef.current = index;
      setActiveSectionIndex(index);
    }
  };

  // Cover Page mutations
  const handleCoverPageChange = (field, value) => {
    setCoverPage(prev => ({
      ...prev,
      [field]: value
    }));
    setHasUnsavedChanges(true);
    setSaveStatus('unsaved');
  };

  const handleAddStudent = () => {
    if (!newStudent.trim()) return;
    setCoverPage(prev => ({
      ...prev,
      students: [...prev.students, newStudent.trim()]
    }));
    setNewStudent('');
    setHasUnsavedChanges(true);
    setSaveStatus('unsaved');
  };

  const handleRemoveStudent = (index) => {
    setCoverPage(prev => ({
      ...prev,
      students: prev.students.filter((_, i) => i !== index)
    }));
    setHasUnsavedChanges(true);
    setSaveStatus('unsaved');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0b0b0e' }}>
        <CircularProgress color="primary" size={60} />
        <Typography variant="body1" sx={{ mt: 3, color: 'var(--text-muted)' }}>Loading report template...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0b0b0e', p: 3 }}>
        <Alert severity="error" sx={{ maxWidth: 500, borderRadius: '12px', mb: 3 }}>{error}</Alert>
        <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={() => navigate('/dashboard')} sx={{ borderRadius: '8px' }}>Back to Dashboard</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-primary)' }}>
      {/* Header Bar */}
      <Box
        sx={{
          height: 64,
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          background: 'rgba(18, 18, 23, 0.8)',
          backdropFilter: 'blur(8px)',
          zIndex: 10
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/dashboard')} sx={{ color: '#fff', '&:hover': { background: 'rgba(255,255,255,0.05)' } }}>
            <ArrowBackIcon />
          </IconButton>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isEditingName ? (
              <TextField
                value={templateName}
                onChange={(e) => {
                  setTemplateName(e.target.value);
                  setHasUnsavedChanges(true);
                  setSaveStatus('unsaved');
                }}
                onBlur={() => setIsEditingName(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                size="small"
                autoFocus
                sx={{
                  input: { color: '#fff', fontWeight: 600, fontSize: '18px', padding: '4px 8px' },
                  '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: 'var(--accent-secondary)' } }
                }}
              />
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#f1f5f9' }}>
                  {templateName}
                </Typography>
                <IconButton size="small" onClick={() => setIsEditingName(true)} sx={{ color: 'var(--text-muted)' }}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Box>
            )}
            <Typography variant="caption" sx={{ color: '#a855f7', background: 'rgba(168, 85, 247, 0.1)', px: 1, py: 0.3, borderRadius: '4px', fontWeight: 600, ml: 1 }}>
              PDF Template
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          {/* Autosave Status Indicator */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, color: 'var(--text-muted)' }}>
            {saveStatus === 'saved' && (
              <>
                <CloudDoneIcon sx={{ color: '#10b981', fontSize: 18 }} />
                <Typography variant="caption" sx={{ color: '#10b981' }}>Saved to Cloud</Typography>
              </>
            )}
            {saveStatus === 'saving' && (
              <>
                <CircularProgress size={14} color="inherit" />
                <Typography variant="caption">Saving...</Typography>
              </>
            )}
            {saveStatus === 'unsaved' && (
              <>
                <CloudQueueIcon sx={{ fontSize: 18 }} />
                <Typography variant="caption">Unsaved Changes</Typography>
              </>
            )}
            {saveStatus === 'error' && (
              <>
                <CloudQueueIcon sx={{ color: '#f44336', fontSize: 18 }} />
                <Typography variant="caption" sx={{ color: '#f44336' }}>Save Failed</Typography>
              </>
            )}
          </Box>

          <Button
            variant="outlined"
            startIcon={showPreview ? <VisibilityOffIcon /> : <VisibilityIcon />}
            onClick={() => setShowPreview(!showPreview)}
            sx={{
              borderColor: 'rgba(255,255,255,0.1)',
              color: '#fff',
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                borderColor: 'var(--accent-secondary)',
                background: 'rgba(99, 102, 241, 0.04)'
              }
            }}
          >
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </Button>

          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={saveTemplateData}
            sx={{
              background: 'linear-gradient(135deg, var(--accent-secondary) 0%, var(--accent-primary) 100%)',
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)'
            }}
          >
            Save Now
          </Button>
        </Box>
      </Box>

      {/* Main Workspace Panels */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* Left Side Sidebar */}
        <Box
          sx={{
            width: 340,
            borderRight: '1px solid var(--border-color)',
            background: 'rgba(18, 18, 23, 0.4)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Navigation Tabs */}
          <Box sx={{ borderBottom: '1px solid var(--border-color)' }}>
            <Tabs
              value={activeTab}
              onChange={(_, val) => setActiveTab(val)}
              variant="fullWidth"
              sx={{
                '& .MuiTabs-indicator': { backgroundColor: 'var(--accent-secondary)' },
                '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, color: 'var(--text-muted)', '&.Mui-selected': { color: '#fff' } }
              }}
            >
              <Tab label="Report Sections" value="sections" />
              <Tab label="Cover Page" value="cover" />
            </Tabs>
          </Box>

          {/* Tab Content Panels */}
          <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
            
            {activeTab === 'sections' ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, height: '100%' }}>
                <Typography variant="caption" sx={{ color: 'var(--text-muted)', px: 0.5, textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5 }}>
                  Section hierarchy
                </Typography>

                <List sx={{ p: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {sections.map((sec, idx) => {
                    const isActive = idx === activeSectionIndex;
                    const isRenaming = renamingIndex === idx;

                    return (
                      <ListItem
                        key={sec.id}
                        onClick={() => handleSectionSelect(idx)}
                        sx={{
                          borderRadius: '8px',
                          background: isActive ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255, 255, 255, 0.01)',
                          border: isActive ? '1px solid var(--accent-secondary)' : '1px solid var(--border-color)',
                          cursor: 'pointer',
                          px: 2,
                          py: 1.5,
                          transition: 'all 0.15s ease',
                          '&:hover': {
                            background: isActive ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                            borderColor: isActive ? 'var(--accent-secondary)' : 'rgba(255, 255, 255, 0.1)'
                          }
                        }}
                      >
                        <Box sx={{ width: '100%', mr: 8 }}>
                          {isRenaming ? (
                            <TextField
                              value={renamingTitle}
                              onChange={(e) => setRenamingTitle(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              onBlur={() => handleConfirmRename(idx)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleConfirmRename(idx);
                                if (e.key === 'Escape') setRenamingIndex(null);
                              }}
                              size="small"
                              autoFocus
                              fullWidth
                              sx={{
                                input: { color: '#fff', fontSize: '14px', py: 0.5, px: 1 },
                                '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: 'var(--accent-secondary)' } }
                              }}
                            />
                          ) : (
                            <>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: isActive ? '#fff' : '#cbd5e1', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                {sec.title}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'var(--text-muted)' }}>
                                Page {sec.pageNumber || 1}
                              </Typography>
                            </>
                          )}
                        </Box>

                        {!isRenaming && (
                          <ListItemSecondaryAction sx={{ right: 8, display: 'flex', gap: 0.2 }}>
                            <Tooltip title="Move Up">
                              <span>
                                <IconButton
                                  size="small"
                                  disabled={idx === 0}
                                  onClick={(e) => handleReorderSection(idx, 'up', e)}
                                  sx={{ color: 'var(--text-muted)', p: 0.5, '&:disabled': { color: 'rgba(255,255,255,0.05)' } }}
                                >
                                  <ArrowUpwardIcon fontSize="inherit" />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Move Down">
                              <span>
                                <IconButton
                                  size="small"
                                  disabled={idx === sections.length - 1}
                                  onClick={(e) => handleReorderSection(idx, 'down', e)}
                                  sx={{ color: 'var(--text-muted)', p: 0.5, '&:disabled': { color: 'rgba(255,255,255,0.05)' } }}
                                >
                                  <ArrowDownwardIcon fontSize="inherit" />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Rename">
                              <IconButton size="small" onClick={(e) => handleStartRename(idx, e)} sx={{ color: 'var(--text-muted)', p: 0.5 }}>
                                <EditIcon fontSize="inherit" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Duplicate">
                              <IconButton size="small" onClick={(e) => handleDuplicateSection(idx, e)} sx={{ color: 'var(--text-muted)', p: 0.5 }}>
                                <FileCopyIcon fontSize="inherit" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton size="small" onClick={(e) => handleDeleteSection(idx, e)} sx={{ color: 'var(--text-muted)', p: 0.5, '&:hover': { color: '#f44336' } }}>
                                <DeleteIcon fontSize="inherit" />
                              </IconButton>
                            </Tooltip>
                          </ListItemSecondaryAction>
                        )}
                      </ListItem>
                    );
                  })}
                </List>

                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<AddIcon />}
                  onClick={handleAddSection}
                  sx={{
                    mt: 2,
                    borderRadius: '8px',
                    borderColor: 'rgba(255,255,255,0.1)',
                    color: '#fff',
                    textTransform: 'none',
                    fontWeight: 600,
                    py: 1,
                    '&:hover': {
                      borderColor: 'var(--accent-secondary)',
                      background: 'rgba(99, 102, 241, 0.04)'
                    }
                  }}
                >
                  Add Section
                </Button>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <Typography variant="caption" sx={{ color: 'var(--text-muted)', px: 0.5, textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5 }}>
                  Cover page details
                </Typography>

                <Card className="glass-panel" sx={{ p: 2, background: 'rgba(255, 255, 255, 0.01)' }}>
                  <Typography variant="caption" color="var(--text-muted)" sx={{ mb: 1, display: 'block' }}>Report Title</Typography>
                  <TextField
                    fullWidth
                    size="small"
                    value={coverPage.title}
                    onChange={(e) => handleCoverPageChange('title', e.target.value)}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                  />
                </Card>

                <Card className="glass-panel" sx={{ p: 2, background: 'rgba(255, 255, 255, 0.01)' }}>
                  <Typography variant="caption" color="var(--text-muted)" sx={{ mb: 1, display: 'block' }}>Department</Typography>
                  <TextField
                    fullWidth
                    size="small"
                    value={coverPage.department}
                    onChange={(e) => handleCoverPageChange('department', e.target.value)}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                  />
                </Card>

                <Card className="glass-panel" sx={{ p: 2, background: 'rgba(255, 255, 255, 0.01)' }}>
                  <Typography variant="caption" color="var(--text-muted)" sx={{ mb: 1, display: 'block' }}>College</Typography>
                  <TextField
                    fullWidth
                    size="small"
                    value={coverPage.college}
                    onChange={(e) => handleCoverPageChange('college', e.target.value)}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                  />
                </Card>

                <Card className="glass-panel" sx={{ p: 2, background: 'rgba(255, 255, 255, 0.01)' }}>
                  <Typography variant="caption" color="var(--text-muted)" sx={{ mb: 1, display: 'block' }}>Guide Name</Typography>
                  <TextField
                    fullWidth
                    size="small"
                    value={coverPage.guide}
                    onChange={(e) => handleCoverPageChange('guide', e.target.value)}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                  />
                </Card>

                <Card className="glass-panel" sx={{ p: 2, background: 'rgba(255, 255, 255, 0.01)' }}>
                  <Typography variant="caption" color="var(--text-muted)" sx={{ mb: 1, display: 'block' }}>Academic Year</Typography>
                  <TextField
                    fullWidth
                    size="small"
                    value={coverPage.year}
                    onChange={(e) => handleCoverPageChange('year', e.target.value)}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                  />
                </Card>

                <Card className="glass-panel" sx={{ p: 2, background: 'rgba(255, 255, 255, 0.01)' }}>
                  <Typography variant="caption" color="var(--text-muted)" sx={{ mb: 1, display: 'block' }}>Students</Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <TextField
                      placeholder="Add student name..."
                      size="small"
                      fullWidth
                      value={newStudent}
                      onChange={(e) => setNewStudent(e.target.value)}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    />
                    <IconButton onClick={handleAddStudent} sx={{ color: 'var(--accent-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                      <AddIcon />
                    </IconButton>
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {coverPage.students.map((student, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: 'rgba(255,255,255,0.02)',
                          p: 1,
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)'
                        }}
                      >
                        <Typography variant="body2" sx={{ fontSize: 13, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>
                          {student}
                        </Typography>
                        <IconButton size="small" onClick={() => handleRemoveStudent(idx)} sx={{ color: 'var(--text-muted)', '&:hover': { color: '#f44336' } }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                </Card>
              </Box>
            )}
          </Box>
        </Box>

        {/* Right Side Editor Panel */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            p: 3,
            background: 'var(--bg-primary)'
          }}
        >
          {/* Active Section Info Header */}
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="subtitle2" sx={{ color: 'var(--accent-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
                Editing Section
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 600, color: '#f1f5f9' }}>
                {sections[activeSectionIndex]?.title || 'Loading...'}
              </Typography>
            </Box>
          </Box>

          {/* Quill Editor Wrap */}
          <Box
            sx={{
              flex: 1,
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              background: 'rgba(18, 18, 23, 0.4)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              overflow: 'hidden',
              '& .ql-toolbar': {
                border: 'none !important',
                background: 'rgba(18, 18, 23, 0.8)',
                borderBottom: '1px solid var(--border-color) !important',
                py: 1.5,
                px: 2
              },
              '& .ql-container': {
                flex: 1,
                overflowY: 'auto',
                background: 'transparent'
              }
            }}
          >
            <Box ref={editorContainerRef} sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }} />
          </Box>
        </Box>

        {/* Live Document Preview Panel */}
        {showPreview && (
          <Box
            sx={{
              width: 440,
              borderLeft: '1px solid var(--border-color)',
              background: 'rgba(18, 18, 23, 0.6)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            <Box sx={{ p: 2, borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(18, 18, 23, 0.4)' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#f1f5f9' }}>
                Live Document Preview
              </Typography>
              <IconButton size="small" onClick={() => setShowPreview(false)} sx={{ color: 'var(--text-muted)' }}>
                <VisibilityOffIcon fontSize="small" />
              </IconButton>
            </Box>

            <Box sx={{ flex: 1, overflowY: 'auto', p: 3, background: '#1c1c24' }}>
              <style>{`
                .preview-page-container {
                  font-family: 'Times New Roman', Times, serif;
                  color: #000000;
                  box-sizing: border-box;
                }
                .preview-section-content {
                  font-family: 'Times New Roman', Times, serif;
                  font-size: 11px;
                  color: #222222;
                  line-height: 1.6;
                  text-align: justify;
                }
                .preview-section-content p {
                  margin: 0 0 10px 0;
                  text-indent: 20px;
                }
                .preview-section-content h1,
                .preview-section-content h2,
                .preview-section-content h3 {
                  font-family: 'Outfit', 'Inter', sans-serif;
                  margin: 15px 0 8px 0;
                  color: #000000;
                }
                .preview-section-content ul,
                .preview-section-content ol {
                  margin: 0 0 10px 0;
                  padding-left: 20px;
                }
                .preview-section-content li {
                  margin-bottom: 4px;
                }
                .preview-section-content pre, 
                .preview-section-content code {
                  font-family: monospace;
                  background-color: #f1f5f9;
                  padding: 2px 4px;
                  border-radius: 4px;
                  font-size: 10px;
                  color: #bf4040;
                }
                .preview-section-content pre {
                  display: block;
                  padding: 8px;
                  background-color: #f8fafc;
                  border: 1px solid #cbd5e1;
                  white-space: pre-wrap;
                  color: #334155;
                  margin-bottom: 10px;
                }
              `}</style>

              <Box className="preview-page-container" sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* 1. Cover Page */}
                <Box
                  sx={{
                    width: '100%',
                    aspectRatio: '1 / 1.414',
                    backgroundColor: '#ffffff',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
                    p: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    textAlign: 'center',
                    border: '1px solid #cbd5e1'
                  }}
                >
                  {/* Top: College & Dept */}
                  <Box>
                    <Typography sx={{ fontSize: '10px', fontWeight: 'bold', fontFamily: 'inherit', letterSpacing: 0.5 }}>
                      {coverPage.college ? coverPage.college.toUpperCase() : 'VARDHAMAN COLLEGE OF ENGINEERING'}
                    </Typography>
                    <Typography sx={{ fontSize: '8px', color: '#666', mt: 0.5, fontFamily: 'inherit' }}>
                      (AUTONOMOUS)
                    </Typography>
                    <Typography sx={{ fontSize: '9px', fontWeight: 'bold', mt: 1.5, fontFamily: 'inherit', color: '#111' }}>
                      {coverPage.department ? coverPage.department.toUpperCase() : 'DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING'}
                    </Typography>
                  </Box>

                  {/* Middle: Title */}
                  <Box sx={{ my: 3 }}>
                    <Typography sx={{ fontSize: '8px', fontStyle: 'italic', fontFamily: 'inherit', color: '#444' }}>
                      A Course End Project Report on
                    </Typography>
                    <Typography sx={{ fontSize: '13px', fontWeight: 'bold', mt: 1.5, mb: 1.5, fontFamily: 'inherit', color: '#000', lineHeight: 1.3 }}>
                      {coverPage.title ? coverPage.title.toUpperCase() : 'PROJECT TITLE'}
                    </Typography>
                  </Box>

                  {/* Middle: Submitted By */}
                  <Box>
                    <Typography sx={{ fontSize: '8px', fontStyle: 'italic', mb: 1, fontFamily: 'inherit', color: '#444' }}>
                      Submitted By:
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {coverPage.students && coverPage.students.length > 0 ? (
                        coverPage.students.map((student, idx) => (
                          <Typography key={idx} sx={{ fontSize: '9px', fontWeight: 'bold', fontFamily: 'inherit', color: '#111' }}>
                            {student}
                          </Typography>
                        ))
                      ) : (
                        <Typography sx={{ fontSize: '9px', fontStyle: 'italic', color: '#999', fontFamily: 'inherit' }}>
                          No students added
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  {/* Guidance and Date Footer */}
                  <Box sx={{ width: '100%' }}>
                    <Typography sx={{ fontSize: '8px', fontStyle: 'italic', mb: 0.5, fontFamily: 'inherit', color: '#444' }}>
                      Under the Guidance of:
                    </Typography>
                    <Typography sx={{ fontSize: '9px', fontWeight: 'bold', mb: 3, fontFamily: 'inherit', color: '#111' }}>
                      {coverPage.guide || 'Project Guide'}
                    </Typography>
                    
                    <Divider sx={{ my: 1.5, borderColor: '#ddd' }} />
                    
                    <Typography sx={{ fontSize: '9px', fontWeight: 'bold', fontFamily: 'inherit', color: '#222' }}>
                      Academic Year: {coverPage.year || '2024'}
                    </Typography>
                  </Box>
                </Box>

                {/* 2. Compiled Content Sections */}
                {sections.map((sec, idx) => (
                  <Box
                    key={sec.id}
                    sx={{
                      width: '100%',
                      minHeight: '450px',
                      backgroundColor: '#ffffff',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
                      p: 4,
                      border: '1px solid #cbd5e1',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    {/* Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', pb: 1, mb: 2 }}>
                      <Typography sx={{ fontSize: '8px', color: '#666', textTransform: 'uppercase', fontFamily: 'inherit' }}>
                        {templateName}
                      </Typography>
                      <Typography sx={{ fontSize: '8px', color: '#666', fontFamily: 'inherit' }}>
                        Page {idx + 2}
                      </Typography>
                    </Box>

                    {/* Section Title */}
                    <Typography sx={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', mb: 2, fontFamily: 'inherit', color: '#000', borderBottom: '1px double #000', pb: 0.5 }}>
                      {idx + 1}. {sec.title}
                    </Typography>

                    {/* Section Body */}
                    <Box 
                      className="preview-section-content"
                      dangerouslySetInnerHTML={{ __html: sec.content || '<p>No content in this section.</p>' }}
                    />
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default TemplateEditorPage;
