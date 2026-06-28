import Document from '../models/Document.js';
import User from '../models/User.js';

export const seedTemplates = async () => {
  try {
    console.log('Seeding templates (clearing existing first)...');
    await Document.deleteMany({ isTemplate: true });

    // Get or create system user to own the templates
    let systemUser = await User.findOne({ email: 'system@collabdoc.com' });
    if (!systemUser) {
      systemUser = await User.create({
        username: 'System Templates',
        email: 'system@collabdoc.com',
        password: 'system_templates_secure_pwd_123!',
        avatarColor: '#6366f1'
      });
      console.log('Created system user for templates.');
    }

    const templates = [
      {
        title: 'Blank Document',
        content: { ops: [{ insert: '\n' }] },
        owner: systemUser._id,
        isTemplate: true,
      },
      {
        title: 'Meeting Notes',
        content: {
          ops: [
            { insert: '📝 Weekly Product Meeting\n', attributes: { header: 1 } },
            { insert: 'Date: ', attributes: { bold: true } }, { insert: 'June 13, 2026  |  ' },
            { insert: 'Time: ', attributes: { bold: true } }, { insert: '10:00 AM  |  ' },
            { insert: 'Location: ', attributes: { bold: true } }, { insert: 'https://meet.google.com/abc-def-ghi\n' },
            { insert: 'Facilitator: ', attributes: { bold: true } }, { insert: '@Srijith  |  ' },
            { insert: 'Note Taker: ', attributes: { bold: true } }, { insert: '@Rahul\n' },
            { insert: 'Attendees: ', attributes: { bold: true } }, { insert: 'Srijith, Rahul, Priya (Attendees: 5)\n\n', attributes: { italic: true } },

            { insert: 'Agenda\n', attributes: { header: 2 } },
            { insert: '1. Review sprint progress (#Productivity)\n2. Analytics dashboard updates (#Frontend)\n3. Deployment planning (#Deployment)\n4. Next sprint goals (#Productivity)\n\n' },

            { insert: 'Discussion Notes\n', attributes: { header: 2 } },
            { insert: 'Analytics Dashboard\n', attributes: { bold: true } },
            { insert: '• Monthly charts completed successfully.\n• Leaderboard implemented to track active editor commits.\n' },
            { insert: 'Comment: ', attributes: { italic: true, color: '#ec4899' } }, { insert: 'Can we add contributor charts here too? (@Rahul)\n', attributes: { italic: true } },
            { insert: 'Deployment\n', attributes: { bold: true } },
            { insert: '• Backend will use Render (#Backend)\n• Frontend will use Vercel (#Frontend)\n\n' },

            { insert: 'Decisions Made\n', attributes: { header: 2 } },
            { insert: '✓ Use MongoDB Atlas for secure cloud storage\n✓ Use Socket.io for live collaboration synchronization\n✓ Add PDF export in the next release\n\n' },

            { insert: 'Action Items\n', attributes: { header: 2 } },
            { insert: '☐ Create landing page\n' },
            { insert: '   Owner: @Srijith  |  Due: June 18  |  Priority: 🔴 High  |  Tags: #Frontend\n', attributes: { italic: true } },
            { insert: '☑ Analytics dashboard\n' },
            { insert: '   Owner: @Rahul  |  Due: June 19  |  Priority: 🟡 Medium  |  Tags: #Backend\n', attributes: { italic: true } },
            { insert: '☐ Add PDF export\n' },
            { insert: '   Owner: @Rahul  |  Due: June 20  |  Priority: 🟢 Low  |  Tags: #Frontend #Backend\n\n', attributes: { italic: true } },

            { insert: 'Risks / Blockers\n', attributes: { header: 2 } },
            { insert: '• Deployment configuration pending (Blocker)\n• Testing coverage incomplete\n\n' },

            { insert: 'Next Meeting\n', attributes: { header: 2 } },
            { insert: 'Date: ', attributes: { bold: true } }, { insert: 'June 20, 2026\n' },
            { insert: 'Time: ', attributes: { bold: true } }, { insert: '11:00 AM\n' },
            { insert: 'Topics: ', attributes: { bold: true } }, { insert: 'Final deployment and demo preparation\n' }
          ]
        },
        owner: systemUser._id,
        isTemplate: true,
      },
      {
        title: 'Project Proposal',
        type: 'PROPOSAL',
        proposalData: {
          projectTitle: 'Project Proposal',
          sectionsList: [
            { id: 'outline', label: 'Outline / Agenda', content: '', imageUrl: '' },
            { id: 'introduction', label: 'Introduction', content: '', imageUrl: '' },
            { id: 'existingVsProposed', label: 'Existing System vs Proposed System', content: '', imageUrl: '' },
            { id: 'researchGaps', label: 'Research Gaps', content: '', imageUrl: '' },
            { id: 'problemStatement', label: 'Problem Statement', content: '', imageUrl: '' },
            { id: 'objectives', label: 'Proposed Project Objectives', content: '', imageUrl: '' },
            { id: 'outcomes', label: 'Proposed Project Outcomes', content: '', imageUrl: '' },
            { id: 'requirements', label: 'Technical Stack & Requirements', content: '', imageUrl: '' },
            { id: 'architecture', label: 'System Architecture Diagram', content: '', imageUrl: '' },
            { id: 'methodology', label: 'Methodology / Implementation Details', content: '', imageUrl: '' },
            { id: 'results', label: 'Results', content: '', imageUrl: '' },
            { id: 'paperAcceptance', label: 'Research Paper / Acceptance Proof', content: '', imageUrl: '' },
            { id: 'conclusion', label: 'Conclusion', content: '', imageUrl: '' },
            { id: 'references', label: 'References & Thank You', content: '', imageUrl: '' }
          ],
          notes: [
            { type: 'idea', text: 'Provide drag and drop LaTeX elements block builder.' },
            { type: 'suggestion', text: 'Add pdf.js to extract margins and sections from uploaded records.' },
            { type: 'risk', text: 'Puppeteer heavy CPU rendering under parallel export requests.' }
          ]
        },
        content: { ops: [{ insert: '\n' }] },
        owner: systemUser._id,
        isTemplate: true,
      },
      {
        title: 'Research Notes',
        content: {
          ops: [
            { insert: '🔬 Scientific Research Notes\n', attributes: { header: 1 } },
            { insert: 'Project Title: ', attributes: { bold: true } }, { insert: 'Neural Collaborative Filtering\n' },
            { insert: 'Author: ', attributes: { bold: true } }, { insert: 'Dr. John Doe\n\n' },
            { insert: 'Abstract\n', attributes: { header: 2 } },
            { insert: 'This document contains experimental observations and sprint timelines for evaluating deep learning collaborative filtering recommendation frameworks.\n\n' },
            { insert: 'Experimental Methodology\n', attributes: { header: 2 } },
            { insert: '• Dataset split: 80% training, 10% validation, 10% test.\n• Training Epochs: 50 with Early Stopping patience of 5 epochs.\n• Optimizer: Adam with learning rate of 0.001.\n' }
          ]
        },
        owner: systemUser._id,
        isTemplate: true,
      },
      {
        title: 'Resume Builder',
        type: 'RESUME',
        resumeData: {
          personalInfo: {
            fullName: 'John Doe',
            email: 'johndoe@example.com',
            phone: '(123) 456-7890',
            location: 'San Francisco, CA',
            linkedin: 'linkedin.com/in/johndoe',
            github: 'github.com/johndoe',
            portfolio: 'johndoe.dev'
          },
          summary: 'Passionate and detail-oriented Software Engineer with experience in building responsive web applications and real-time collaboration platforms.',
          education: [
            {
              id: 'edu-1',
              degree: 'B.S. in Computer Science',
              college: 'State University',
              cgpa: '3.8/4.0',
              startYear: '2019',
              endYear: '2023',
              location: 'City, State'
            }
          ],
          skills: {
            languages: ['JavaScript', 'TypeScript', 'Python', 'Go', 'HTML/CSS'],
            frontend: ['React', 'Next.js', 'Redux', 'Material UI', 'Tailwind CSS'],
            backend: ['Node.js', 'Express', 'GraphQL', 'REST APIs'],
            database: ['MongoDB', 'PostgreSQL', 'Redis'],
            cloud: ['AWS (S3, EC2)', 'Vercel', 'Heroku', 'Docker'],
            tools: ['Git', 'VS Code', 'Webpack', 'Postman', 'Jira']
          },
          experience: [
            {
              id: 'exp-1',
              company: 'Tech Solutions Inc.',
              role: 'Software Engineer',
              startDate: '2023-06',
              endDate: 'Present',
              description: 'Developed and optimized collaborative document tools using MERN stack.\nImprove page load times by 20% by implementing caching and bundle optimization.'
            }
          ],
          projects: [
            {
              id: 'proj-1',
              projectName: 'CollabDoc Editor',
              description: 'A real-time collaborative document editor with visual cursor presence and suggestion workflows.',
              technologies: 'React, Node.js, Express, Socket.io, MongoDB',
              githubLink: 'https://github.com/johndoe/collabdoc',
              liveLink: 'https://collabdoc-live.example.com'
            }
          ],
          certifications: [
            {
              id: 'cert-1',
              name: 'AWS Certified Cloud Practitioner',
              issuer: 'Amazon Web Services',
              date: '2024'
            }
          ],
          achievements: [
            {
              id: 'ach-1',
              text: 'First place winner at State College Hackathon 2022'
            }
          ],
          templateType: 'Professional ATS'
        },
        content: { ops: [{ insert: '\n' }] },
        owner: systemUser._id,
        isTemplate: true,
      },
      {
        title: 'Vardhaman College Report Builder',
        type: 'COLLEGE_REPORT',
        collegeReportData: {
          collegeName: 'Vardhaman College of Engineering',
          projectTitle: 'Smart Home Automation using Internet of Things',
          courseCodeName: 'A6543 - Internet of Things Laboratory',
          submittedBy: [
            { name: 'Student Name 1', roll: '22881A0501' },
            { name: 'Student Name 2', roll: '22881A0502' },
            { name: 'Student Name 3', roll: '22881A0503' }
          ],
          courseFacilitator: 'Dr. A. K. Smith',
          courseFacilitatorDesignation: 'Assistant Professor',
          hodName: 'Dr. Department Head',
          hodDesignation: 'HOD, CSE',
          departmentName: 'DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING',
          academicYear: '2025--26',
          monthYear: 'May 2026',
          abstract: 'With the rapid advancement in technology, smart home automation systems have gained significant attention. This project proposes an Internet of Things (IoT) based smart home automation system that allows users to monitor and control household appliances remotely. The system uses a microcontroller connected to various sensors (temperature, humidity, motion) and actuators (relays, smart plugs). A mobile application interface is developed to display sensor data in real-time and provide remote override buttons. The proposed system is verified to improve energy efficiency, enhance home security, and provide convenient access for elderly and disabled individuals. Experimental results demonstrate a response latency of less than 200ms under standard network conditions.',
          keywords: 'Internet of Things, Smart Home, Home Automation, Sensors, Actuators, Microcontrollers, Remote Control',
          sectionsList: [
            {
              id: 'introduction',
              label: 'Introduction',
              content: 'The Internet of Things (IoT) describes the network of physical objects embedded with sensors, software, and other technologies for the purpose of connecting and exchanging data with other devices and systems over the internet. In recent years, home automation has transitioned from a luxury feature to a key utility. Traditional homes consume significant energy due to unmonitored devices and manual switching. This project introduces a smart home automation architecture designed to address these challenges by providing real-time data monitoring and automation rules. The introduction outlines the motivation, problem statement, objectives, and organizational structure of the report.'
            },
            {
              id: 'proposedMethodology',
              label: 'Proposed Methodology',
              content: 'The proposed home automation system architecture is comprised of three main layers: the hardware perception layer, the cloud communication layer, and the user application layer. In the perception layer, sensors gather environmental data (e.g., room temperature) and transmit it to the central controller. The controller processes the data and determines if relay states need to change based on predefined thresholds. The cloud communication layer uses MQTT/HTTP protocols to synchronize the device states with the online database. Finally, the user application layer enables the end-user to visualize parameters and issue direct commands.'
            },
            {
              id: 'objectives',
              label: 'Objectives',
              content: '',
              listItems: [
                'To design and build an IoT-based home automation prototype using affordable hardware.',
                'To implement real-time sensor data reading and visualization.',
                'To support remote control of household appliances through a web/mobile interface.',
                'To implement automated rules for energy saving and device protection.',
                'To analyze response latency and system reliability under varying network loads.'
              ]
            },
            {
              id: 'implementation',
              label: 'Implementation',
              content: '',
              blockDiagramItems: [
                'Sensors Layer: Captures physical parameters (temperature, humidity, motion).',
                'Microcontroller (NodeMCU/ESP32): Processes sensor inputs and triggers relays.',
                'Relay Modules: Switch high-voltage AC home appliances.',
                'Cloud Server (Firebase/MQTT Broker): Synchronizes device states and stores logs.',
                'User Interface Dashboard: Allows visualization and control.'
              ],
              workingPrinciple: 'The working principle is based on a feedback control loop. Sensors continuously read environmental state parameters. If motion is detected or temperature exceeds a threshold, the microcontroller triggers the respective relay automatically. Additionally, commands sent from the user dashboard are published to the MQTT broker, which the microcontroller subscribes to and executes immediately.',
              softwareTools: [
                'Arduino IDE: For writing microcontroller firmware.',
                'C++ / JavaScript: Implementation programming languages.',
                'Adafruit IO / Firebase: Cloud database and MQTT broker services.',
                'React / React Native: Dashboard frontend implementation.'
              ]
            },
            {
              id: 'resultsAndDiscussion',
              label: 'Results and Discussion',
              content: 'The home automation prototype was successfully constructed and verified. It demonstrated reliable automation triggers and fast response times. The mobile dashboard displayed accurate readings, matching physical conditions. The subsequent subsections discuss the parameter tuning and experimental results.',
              resultsIntro: 'The experimental setup consists of a simulated living room environment equipped with temperature and motion sensors. The system output is displayed on the IoT control dashboard, verifying successful data transmission and command reception. The sensor readings are logged periodically in a table, showing temperature variations. The dashboard also displays graph histories of energy consumption, showing a 15% reduction in overall energy usage when automation rules are enabled.',
              figures: [
                { caption: 'IoT Dashboard showing real-time sensor visualization and active relays', imageUrl: 'op1.png' },
                { caption: 'Temperature history and automated state transition graph', imageUrl: 'op2.png' }
              ],
              discussionContent: 'The system performance was evaluated based on latency and reliability. Command execution latency (the time between pressing a button on the dashboard and the relay switching) averaged 150ms. The automated rules succeeded in switching off lights when no motion was detected for 5 minutes, confirming energy conservation. Some latency spikes were observed under weak Wi-Fi signals, indicating a requirement for offline fallback mechanisms.'
            },
            {
              id: 'poMapping',
              label: 'Program Outcomes (POs) Mapping',
              poRows: [
                { poNo: 'PO1', outcome: 'Engineering Knowledge', relevance: 'The project applies principles of computer networks, electronics, and software design.' },
                { poNo: 'PO2', outcome: 'Problem Analysis', relevance: 'Energy wastage and remote control challenges are identified and analyzed.' },
                { poNo: 'PO3', outcome: 'Design/Development of Solutions', relevance: 'An IoT system solution is designed and constructed within realistic constraints.' },
                { poNo: 'PO5', outcome: 'Engineering Tool Usage', relevance: 'Modern software tools like Arduino IDE, Firebase, and React are used.' }
              ],
              sdgRows: [
                { sdgNo: 'SDG 7', goal: 'Affordable and Clean Energy', relevance: 'The project promotes energy conservation by turning off idle appliances.' },
                { sdgNo: 'SDG 9', goal: 'Industry, Innovation and Infrastructure', relevance: 'It fosters innovation in smart infrastructure and IoT systems.' }
              ]
            },
            {
              id: 'conclusion',
              label: 'Conclusion',
              content: 'This project successfully designed and implemented an IoT-based smart home automation system. By combining hardware nodes with a cloud database and responsive user interface, the system achieves reliable monitoring and control. The integration of automation rules proved effective in lowering energy consumption. Future work will involve implementing voice control integrations and machine learning algorithms to predict user preferences.'
            },
            {
              id: 'bibliography',
              label: 'Bibliography',
              content: '',
              bibItems: [
                'J. Doe, "Introduction to IoT Systems," Journal of Smart Grid, 2024.',
                'A. Smith, "Design Patterns in Home Automation," IEEE Transactions on Consumer Electronics, 2025.',
                'Firebase Documentation, "Real-time Database Reference Guide," Google Developer Center, 2026.'
              ]
            }
          ]
        },
        content: { ops: [{ insert: '\n' }] },
        owner: systemUser._id,
        isTemplate: true,
      }
    ];

    await Document.insertMany(templates);
    console.log('Templates seeded successfully.');
  } catch (error) {
    console.error('Failed to seed templates:', error.message);
  }
};

