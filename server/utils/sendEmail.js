const nodemailer = require('nodemailer');
const { Resend } = require('resend');

const sendEmail = async (options) => {
  // If Resend API Key is configured, use Resend SDK
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const data = await resend.emails.send({
        from: process.env.FROM_EMAIL || 'Codeitz CRM <onboarding@resend.dev>',
        to: options.email,
        subject: options.subject,
        html: options.html || options.message,
      });
      console.log('Email sent via Resend successfully:', data);
      return data;
    } catch (err) {
      console.error('Resend failed, attempting Nodemailer fallback:', err.message);
    }
  }

  // Create standard nodemailer SMTP transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: process.env.SMTP_PORT || 2525,
    auth: {
      user: process.env.SMTP_EMAIL || '',
      pass: process.env.SMTP_PASSWORD || '',
    },
  });

  const mailOptions = {
    from: `${process.env.FROM_NAME || 'Codeitz CRM'} <${process.env.FROM_EMAIL || 'noreply@codeitz.com'}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log('Email sent via Nodemailer SMTP: %s', info.messageId);
  return info;
};

module.exports = sendEmail;
