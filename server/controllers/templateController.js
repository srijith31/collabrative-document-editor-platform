import Template from '../models/Template.js';
import { parsePdfToTemplateData } from '../services/pdfParserService.js';
import Activity from '../models/Activity.js';

export const importPdfToTemplate = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No PDF file uploaded' });
    }
    
    const parsedData = await parsePdfToTemplateData(req.file.buffer);
    
    const template = await Template.create({
      name: parsedData.name,
      coverPage: parsedData.coverPage,
      sections: parsedData.sections,
      createdBy: req.user._id
    });
    
    await Activity.create({
      documentId: template._id, // Map it cleanly as templateId / documentId
      user: req.user._id,
      actionType: 'CREATE',
      details: `Imported PDF report template: ${parsedData.name}`
    });
    
    res.status(201).json(template);
  } catch (error) {
    console.error('Failed to import template from PDF:', error);
    res.status(500).json({ message: 'Failed to import template from PDF', error: error.message });
  }
};

export const getUserTemplates = async (req, res) => {
  try {
    const templates = await Template.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
    res.json(templates);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get templates', error: error.message });
  }
};

export const getTemplateById = async (req, res) => {
  try {
    const template = await Template.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    res.json(template);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get template', error: error.message });
  }
};

export const updateTemplate = async (req, res) => {
  try {
    const { name, coverPage, sections } = req.body;
    const template = await Template.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      { name, coverPage, sections },
      { new: true }
    );
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    res.json(template);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update template', error: error.message });
  }
};

export const deleteTemplate = async (req, res) => {
  try {
    const template = await Template.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete template', error: error.message });
  }
};
