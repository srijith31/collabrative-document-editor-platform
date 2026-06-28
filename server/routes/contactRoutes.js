import express from 'express';
import nodemailer from 'nodemailer';
import Contact from '../models/Contact.js';

const router = express.Router();

router.post('/', async (req, res) => {
  const { email, query } = req.body;

  if (!email || !query) {
    return res.status(400).json({ message: 'Email and query message are required.' });
  }

  try {
    // 1. Save to Database
    const contact = new Contact({ email, query });
    await contact.save();

    // 2. Setup mail transporter using SMTP env settings
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT || 587;
    const smtpSecure = process.env.SMTP_SECURE === 'true';
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    let emailSent = false;
    let emailError = null;

    if (smtpUser && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost || 'smtp.gmail.com',
          port: parseInt(smtpPort),
          secure: smtpSecure,
          auth: {
            user: smtpUser,
            pass: smtpPass
          }
        });

        await transporter.sendMail({
          from: `"${email}" <${smtpUser}>`,
          to: 'srijithnakka@gmail.com',
          replyTo: email,
          subject: 'CollabDoc: New Query Received',
          text: `You received a new query from CollabDoc.\n\nFrom: ${email}\n\nQuery:\n${query}`,
          html: `<p>You received a new query from CollabDoc.</p>
                 <p><strong>From:</strong> ${email}</p>
                 <p><strong>Query:</strong></p>
                 <p style="white-space: pre-wrap; background: #f3f4f6; padding: 15px; border-radius: 8px;">${query}</p>`
        });
        emailSent = true;
      } catch (err) {
        console.error('SMTP Mail send failed:', err);
        emailError = err.message;
      }
    } else {
      console.warn('SMTP credentials are not configured. Saved to DB, but mail not sent.');
      emailError = 'SMTP credentials not configured in .env';
    }

    res.status(200).json({
      success: true,
      message: emailSent 
        ? 'Query submitted and email sent successfully!' 
        : 'Query saved to database successfully!',
      emailSent,
      emailError
    });

  } catch (error) {
    console.error('Contact query submission error:', error);
    res.status(500).json({ message: 'Internal server error. Failed to submit query.' });
  }
});

export default router;
