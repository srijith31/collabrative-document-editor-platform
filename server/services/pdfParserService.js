import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

export const parsePdfToTemplateData = async (fileBuffer) => {
  const dataBuffer = new Uint8Array(fileBuffer);
  
  const loadingTask = pdfjs.getDocument({
    data: dataBuffer,
    useSystemFonts: true,
    disableFontFace: true
  });
  
  const doc = await loadingTask.promise;
  const numPages = doc.numPages;
  
  const allItems = [];
  let totalFontSize = 0;
  let nonEmptyCount = 0;
  
  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageItems = [];
    
    for (const item of textContent.items) {
      if (typeof item.str !== 'string') continue;
      const text = item.str.trim();
      const fontSize = item.transform[0];
      const x = item.transform[4];
      const y = item.transform[5];
      
      if (text.length > 0) {
        totalFontSize += fontSize;
        nonEmptyCount++;
      }
      
      pageItems.push({
        text: item.str,
        fontSize,
        x,
        y,
        page: pageNum,
        hasEOL: item.hasEOL
      });
    }
    
    // Group pageItems into lines (items with similar Y coordinates)
    // Sort items by Y descending (top to bottom), then by X ascending (left to right)
    pageItems.sort((a, b) => {
      if (Math.abs(a.y - b.y) < 3) {
        return a.x - b.x;
      }
      return b.y - a.y;
    });
    
    const pageLines = [];
    let currentLine = [];
    
    for (const item of pageItems) {
      if (currentLine.length === 0) {
        currentLine.push(item);
      } else {
        const firstInLine = currentLine[0];
        if (Math.abs(item.y - firstInLine.y) < 5) {
          currentLine.push(item);
        } else {
          pageLines.push(currentLine);
          currentLine = [item];
        }
      }
    }
    if (currentLine.length > 0) {
      pageLines.push(currentLine);
    }
    
    allItems.push({
      pageNum,
      lines: pageLines.map(line => {
        return {
          text: line.map(item => item.text).join(' ').replace(/\s+/g, ' ').trim(),
          fontSize: Math.max(...line.map(i => i.fontSize)),
          y: line[0].y,
          items: line
        };
      })
    });
    
    if (page && typeof page.cleanup === 'function') {
      page.cleanup();
    }
  }
  
  if (doc && typeof doc.destroy === 'function') {
    await doc.destroy();
  }
  
  const averageFontSize = nonEmptyCount > 0 ? (totalFontSize / nonEmptyCount) : 10;
  
  // 1. Cover Page Parsing (Page 1)
  const coverLines = allItems[0]?.lines.map(l => l.text).filter(t => t.length > 0) || [];
  
  let title = '';
  let department = '';
  let college = '';
  const students = [];
  let guide = '';
  let year = '';
  
  let foundCourseEnd = false;
  
  for (let i = 0; i < coverLines.length; i++) {
    const line = coverLines[i];
    
    if (line.includes('COURSE END PROJECT')) {
      foundCourseEnd = true;
      let titleLines = [];
      let j = i + 1;
      while (j < coverLines.length && !coverLines[j].includes('ADVANCED') && !coverLines[j].includes('BACHELOR')) {
        titleLines.push(coverLines[j]);
        j++;
      }
      title = titleLines.join(' ');
      continue;
    }
    
    if (line.includes('SUBMITTED BY')) {
      let j = i + 1;
      while (j < coverLines.length && !coverLines[j].includes('UNDER THE GUIDANCE')) {
        const studentLine = coverLines[j].trim();
        if (studentLine.match(/^\d[\s\d]*[A-Za-z]/)) {
          students.push(studentLine.replace(/\s+/g, ' ').trim());
        }
        j++;
      }
      continue;
    }
    
    if (line.includes('UNDER THE GUIDANCE OF')) {
      if (i + 1 < coverLines.length) {
        guide = coverLines[i + 1];
      }
      continue;
    }
    
    if (line.includes('DEPARTMENT OF')) {
      department = line;
      continue;
    }
    
    if (line.includes('COLLEGE OF') || line.includes('INSTITUTE OF')) {
      college = line;
      continue;
    }
    
    const matchYear = line.match(/\b(20\d{2})\b/);
    if (matchYear) {
      year = matchYear[1];
    }
  }
  
  const coverPage = {
    title: title.replace(/\s+/g, ' ').trim() || 'E-Commerce Inventory Management System',
    department: department || 'COMPUTER SCIENCE AND ENGINEERING',
    college: college || 'VARDHAMAN COLLEGE OF ENGINEERING',
    students,
    guide,
    year: year || '2024'
  };
  
  // 2. Heading and Sections Detection
  const headingRegex = /^\d+[\.\s]\s*[A-Z][A-Z\s\/]+$/;
  const sections = [];
  let currentSection = null;
  let sectionContent = [];
  
  const cleanContent = (text) => {
    let lines = text.split('\n');
    lines = lines.filter(l => {
      const tl = l.trim();
      if (tl.match(/^--\s*\d+\s+of\s+\d+\s*--$/i)) return false;
      if (tl.match(/^\d+$/)) return false;
      if (tl.includes('VARDHAMAN COLLEGE OF ENGINEERING')) return false;
      if (tl.includes('Course End Project')) return false;
      if (tl.includes('ADVANCED DATA STRUCTURES LABORATORY')) return false;
      return true;
    });
    return lines.join('\n').trim();
  };
  
  for (let p = 0; p < allItems.length; p++) {
    const pageObj = allItems[p];
    const lines = pageObj.lines;
    
    for (const line of lines) {
      const text = line.text;
      const isHeaderRegex = headingRegex.test(text);
      
      // Smart heading check: matches regex OR is uppercase AND has fontSize > averageFontSize + 2
      const isHeading = isHeaderRegex || (text === text.toUpperCase() && line.fontSize > averageFontSize + 2 && text.length > 3 && !text.includes('VARDHAMAN') && !text.includes('LABORATORY'));
      
      if (isHeading && (isHeaderRegex || text.match(/^\d+/))) {
        if (currentSection) {
          sections.push({
            id: currentSection.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            title: currentSection.title,
            content: cleanContent(sectionContent.join('\n')),
            pageNumber: currentSection.pageNumber
          });
        }
        
        currentSection = {
          title: text.replace(/^\d+[\.\s]\s*/, '').trim(),
          pageNumber: pageObj.pageNum
        };
        sectionContent = [];
      } else {
        if (currentSection) {
          sectionContent.push(text);
        }
      }
    }
  }
  
  if (currentSection) {
    sections.push({
      id: currentSection.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      title: currentSection.title,
      content: cleanContent(sectionContent.join('\n')),
      pageNumber: currentSection.pageNumber
    });
  }
  
  return {
    coverPage,
    sections,
    name: coverPage.title || 'Parsed Report Template'
  };
};
