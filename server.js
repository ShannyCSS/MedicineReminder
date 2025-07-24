require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Serve static files (like index.html)
app.use(express.static(path.join(__dirname, 'public')));

// Default route to serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Email sending endpoint
app.post('/send', (req, res) => {
  const { to, subject, text } = req.body;

  if (!to || !subject || !text) {
    return res.status(400).send('Missing email data');
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.APP_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL,
    to,
    subject,
    text,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('❌ Email error:', error);
      return res.status(500).send('Failed to send email');
    }
    console.log('✅ Email sent:', info.response);
    res.send('Email sent successfully');
  });
});

// Reminder endpoint
app.post('/remind', (req, res) => {
  const { medicine, time, email } = req.body;

  if (!medicine || !time || !email) {
    return res.status(400).send('Missing data');
  }

  const now = new Date();
  const [hours, minutes] = time.split(':').map(Number);
  const reminderTime = new Date(now);
  reminderTime.setHours(hours, minutes, 0, 0);

  const delay = reminderTime - now;
  if (delay < 0) return res.status(400).send('Time must be in the future');

  setTimeout(() => {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL,
        pass: process.env.APP_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: '⏰ Medicine Reminder',
      text: `It's time to take your medicine: ${medicine}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('❌ Reminder email error:', error);
      } else {
        console.log('✅ Reminder email sent:', info.response);
      }
    });
  }, delay);

  res.send('⏰ Reminder scheduled successfully.');
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
