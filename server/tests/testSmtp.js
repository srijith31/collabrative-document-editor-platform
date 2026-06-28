import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const testSmtp = async () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '465');
  const secure = process.env.SMTP_SECURE === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  console.log('--- SMTP Connection Test ---');
  console.log(`Host: ${host}`);
  console.log(`Port: ${port}`);
  console.log(`Secure: ${secure}`);
  console.log(`User: ${user ? user : '(not configured)'}`);
  console.log(`Pass: ${pass ? '********' : '(not configured)'}`);

  if (!user || !pass) {
    console.error('\n[Error] SMTP credentials (SMTP_USER and SMTP_PASS) are not configured in your server/.env file.');
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass }
    });

    console.log('\nVerifying transporter connection...');
    await transporter.verify();
    console.log('[Success] SMTP connection verified successfully!');

    console.log('\nSending test email to srijithnakka@gmail.com...');
    await transporter.sendMail({
      from: `"${user}" <${user}>`,
      to: 'srijithnakka@gmail.com',
      subject: 'CollabDoc: SMTP Test Email',
      text: 'This is a test email from your CollabDoc local server verifying that SMTP is working perfectly!'
    });
    console.log('[Success] Test email sent successfully!');
  } catch (error) {
    console.error('\n[Error] Failed to send email via SMTP:');
    console.error(error);
  }
};

testSmtp();
