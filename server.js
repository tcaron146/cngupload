require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Contact form handler
app.post('/api/contact', async (req, res) => {
  const { name, phone, email, service, timeline, message } = req.body;

  if (!name || !phone || !email || !service) {
    return res.status(400).json({ ok: false, error: 'Missing required fields.' });
  }

  let transporter;

  if (process.env.SMTP_HOST) {
    // Custom SMTP (e.g. SendGrid, Mailgun, etc.)
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Gmail (requires GMAIL_USER + GMAIL_APP_PASS)
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASS,
      },
    });
  }

  const mailOptions = {
    from: `"C&G Painting Website" <${process.env.GMAIL_USER || process.env.SMTP_USER}>`,
    to: 'cargrafpaint@gmail.com',
    replyTo: email,
    subject: `New Quote Request — ${service} (${name})`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;border:1px solid #ddd;padding:32px">
        <h2 style="margin:0 0 24px;font-size:22px">New Quote Request from C&G Painting Website</h2>

        <table style="width:100%;border-collapse:collapse;font-size:15px">
          <tr><td style="padding:10px 0;border-bottom:1px solid #eee;width:130px;color:#777;font-weight:600">Name</td><td style="padding:10px 0;border-bottom:1px solid #eee">${name}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #eee;color:#777;font-weight:600">Phone</td><td style="padding:10px 0;border-bottom:1px solid #eee"><a href="tel:${phone}">${phone}</a></td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #eee;color:#777;font-weight:600">Email</td><td style="padding:10px 0;border-bottom:1px solid #eee"><a href="mailto:${email}">${email}</a></td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #eee;color:#777;font-weight:600">Service</td><td style="padding:10px 0;border-bottom:1px solid #eee">${service}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #eee;color:#777;font-weight:600">Timeline</td><td style="padding:10px 0;border-bottom:1px solid #eee">${timeline || 'Not specified'}</td></tr>
          <tr><td style="padding:10px 0;color:#777;font-weight:600;vertical-align:top">Message</td><td style="padding:10px 0">${(message || 'No message provided').replace(/\n/g, '<br>')}</td></tr>
        </table>

        <p style="margin:28px 0 0;font-size:13px;color:#999">Sent from cngpainting.com contact form · Reply directly to this email to reach the customer.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ ok: true });
  } catch (err) {
    console.error('Email error:', err.message);
    res.status(500).json({ ok: false, error: 'Failed to send email. Check server logs.' });
  }
});

app.listen(PORT, () => {
  console.log(`C&G Painting site running at http://localhost:${PORT}`);
});
