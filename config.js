module.exports = {
  ses_host: process.env.SES_HOST || 'email-smtp.us-east-1.amazonaws.com',
  ses_user: process.env.SES_USER || 'YOUR_SMTP_USER',
  ses_pass: process.env.SES_PASS || 'YOUR_SMTP_PASSWORD',
  from: process.env.EMAIL_FROM || 'from@example.com',
  to: process.env.EMAIL_TO || 'to@example.com'
};