import { Document, Paragraph, TextRun, AlignmentType, Packer } from 'docx';

/**
 * Generates a professional ATS-friendly DOCX resume from resumeData.
 */
export function generateResumeDOCX(resumeData) {
  const {
    personalInfo = {},
    summary = '',
    education = [],
    skills = {},
    experience = [],
    projects = [],
    certifications = [],
    achievements = [],
  } = resumeData;

  const children = [];

  // Name (centered, bold, 28pt = 56 half-points)
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: (personalInfo.fullName || 'YOUR NAME').toUpperCase(),
          bold: true,
          size: 56,
          font: 'Times New Roman',
        }),
      ],
    })
  );

  // Contact Info (centered, 11pt = 22 half-points)
  const contactParts = [];
  if (personalInfo.email) contactParts.push(personalInfo.email);
  if (personalInfo.phone) contactParts.push(personalInfo.phone);
  if (personalInfo.location) contactParts.push(personalInfo.location);
  if (personalInfo.linkedin) contactParts.push(personalInfo.linkedin);
  if (personalInfo.github) contactParts.push(personalInfo.github);
  if (personalInfo.portfolio) contactParts.push(personalInfo.portfolio);

  if (contactParts.length > 0) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 180 },
        children: [
          new TextRun({
            text: contactParts.join('  |  '),
            size: 22,
            font: 'Times New Roman',
            color: '333333',
          }),
        ],
      })
    );
  }

  // Helper to add Section Heading (16pt = 32 half-points)
  const addSectionHeader = (title) => {
    children.push(
      new Paragraph({
        spacing: { before: 200, after: 100 },
        border: {
          bottom: {
            color: '333333',
            space: 4,
            value: 'single',
            size: 12, // 1.5 pt
          },
        },
        children: [
          new TextRun({
            text: title.toUpperCase(),
            bold: true,
            size: 32,
            font: 'Times New Roman',
          }),
        ],
      })
    );
  };

  // Helper to parse description bullets
  const parseBullets = (text) => {
    if (!text) return [];
    return text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0).map(line => {
      return line.replace(/^[•\-\*\s]+/, '');
    });
  };

  // Summary
  if (summary) {
    addSectionHeader('Professional Summary');
    children.push(
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: summary,
            size: 22,
            font: 'Times New Roman',
          }),
        ],
      })
    );
  }

  // Skills
  const skillKeys = Object.keys(skills || {});
  const hasSkills = skillKeys.some(k => skills[k] && skills[k].length > 0);
  if (hasSkills) {
    addSectionHeader('Technical Skills');
    skillKeys.forEach(cat => {
      const list = skills[cat] || [];
      if (list.length === 0) return;
      const label = cat.charAt(0).toUpperCase() + cat.slice(1);
      children.push(
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({
              text: `${label}: `,
              bold: true,
              size: 22,
              font: 'Times New Roman',
            }),
            new TextRun({
              text: list.join(', '),
              size: 22,
              font: 'Times New Roman',
            }),
          ],
        })
      );
    });
  }

  // Experience
  if (experience && experience.length > 0) {
    addSectionHeader('Experience');
    experience.forEach(exp => {
      // Role & Date (Right tab at 10206 dxa for 15mm margins)
      children.push(
        new Paragraph({
          spacing: { before: 100, after: 40 },
          tabStops: [
            {
              type: 'right',
              position: 10206,
            },
          ],
          children: [
            new TextRun({
              text: exp.role || 'Job Title',
              bold: true,
              size: 28, // 14pt
              font: 'Times New Roman',
            }),
            new TextRun({
              text: `\t${exp.startDate || ''} - ${exp.endDate || ''}`,
              bold: false,
              size: 22,
              font: 'Times New Roman',
            }),
          ],
        })
      );

      // Company Name
      if (exp.company) {
        children.push(
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({
                text: exp.company,
                italics: true,
                size: 26, // 13pt
                font: 'Times New Roman',
              }),
            ],
          })
        );
      }

      // Bullets
      const bullets = parseBullets(exp.description);
      bullets.forEach(bullet => {
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: bullet,
                size: 22,
                font: 'Times New Roman',
              }),
            ],
          })
        );
      });
    });
  }

  // Projects
  if (projects && projects.length > 0) {
    addSectionHeader('Projects');
    projects.forEach(proj => {
      const links = [];
      if (proj.githubLink) links.push('GitHub');
      if (proj.liveLink) links.push('Demo');
      const linksText = links.join('  |  ');

      children.push(
        new Paragraph({
          spacing: { before: 100, after: 40 },
          tabStops: [
            {
              type: 'right',
              position: 10206,
            },
          ],
          children: [
            new TextRun({
              text: proj.projectName || 'Project Name',
              bold: true,
              size: 28, // 14pt
              font: 'Times New Roman',
            }),
            new TextRun({
              text: linksText ? `\t${linksText}` : '',
              bold: true,
              size: 22,
              color: '4f46e5',
              font: 'Times New Roman',
            }),
          ],
        })
      );

      // Technologies
      if (proj.technologies) {
        children.push(
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({
                text: proj.technologies,
                size: 22,
                italics: true,
                color: '555555',
                font: 'Times New Roman',
              }),
            ],
          })
        );
      }

      // Bullets
      const bullets = parseBullets(proj.description);
      bullets.forEach(bullet => {
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: bullet,
                size: 22,
                font: 'Times New Roman',
              }),
            ],
          })
        );
      });
    });
  }

  // Education
  if (education && education.length > 0) {
    addSectionHeader('Education');
    education.forEach(edu => {
      children.push(
        new Paragraph({
          spacing: { before: 100, after: 40 },
          tabStops: [
            {
              type: 'right',
              position: 10206,
            },
          ],
          children: [
            new TextRun({
              text: edu.college || 'Institution',
              bold: true,
              size: 28, // 14pt
              font: 'Times New Roman',
            }),
            new TextRun({
              text: `\t${edu.startYear || ''} - ${edu.endYear || ''}`,
              size: 22,
              font: 'Times New Roman',
            }),
          ],
        })
      );

      children.push(
        new Paragraph({
          spacing: { after: 60 },
          tabStops: [
            {
              type: 'right',
              position: 10206,
            },
          ],
          children: [
            new TextRun({
              text: edu.degree || 'Degree',
              italics: true,
              size: 26, // 13pt
              font: 'Times New Roman',
            }),
            new TextRun({
              text: edu.cgpa ? `\tGPA: ${edu.cgpa}` : '',
              bold: true,
              size: 22,
              font: 'Times New Roman',
            }),
          ],
        })
      );
    });
  }

  // Certifications
  if (certifications && certifications.length > 0) {
    addSectionHeader('Certifications');
    certifications.forEach(cert => {
      children.push(
        new Paragraph({
          spacing: { after: 60 },
          tabStops: [
            {
              type: 'right',
              position: 10206,
            },
          ],
          children: [
            new TextRun({
              text: cert.name || 'Certification',
              bold: true,
              size: 22,
              font: 'Times New Roman',
            }),
            new TextRun({
              text: cert.issuer ? ` (${cert.issuer})` : '',
              size: 22,
              font: 'Times New Roman',
            }),
            new TextRun({
              text: cert.date ? `\t${cert.date}` : '',
              size: 22,
              font: 'Times New Roman',
            }),
          ],
        })
      );
    });
  }

  // Achievements
  if (achievements && achievements.length > 0) {
    addSectionHeader('Achievements');
    achievements.forEach(ach => {
      if (!ach.text) return;
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 40 },
          children: [
            new TextRun({
              text: ach.text,
              size: 22,
              font: 'Times New Roman',
            }),
          ],
        })
      );
    });
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 850,    // 15mm twips
              bottom: 850, // 15mm twips
              left: 850,   // 15mm twips
              right: 850,  // 15mm twips
            },
          },
        },
        children: children,
      },
    ],
  });

  return doc;
}

/**
 * Helper to download the generated resume DOCX file.
 */
export async function downloadResumeDOCX(resumeData, title = 'resume') {
  const doc = generateResumeDOCX(resumeData);
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}
