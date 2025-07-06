const express = require('express');
const busboy = require('connect-busboy');
const path = require('path');
const fs = require('fs');
const debug = require('debug')('app');
const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');
const config = require('./config');

const app = express();
app.use(busboy());

const mailer = nodemailer.createTransport(
  smtpTransport({
    host: config.ses_host,
    secureConnection: true,
    port: 465,
    auth: {
      user: config.ses_user,
      pass: config.ses_pass
    }
  })
);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

app.post('/upload', (req, res) => {
  if (req.busboy) {
    req.pipe(req.busboy);
    req.busboy.on('file', (fieldname, file, filename) => {
      const filePath = path.join(uploadsDir, filename);
      const fstream = fs.createWriteStream(filePath);
      file.pipe(fstream);
      fstream.on('close', () => {
        const mailOptions = {
          from: config.from,
          to: config.to,
          subject: 'File',
          text: 'File',
          attachments: [
            {
              filename,
              path: filePath
            }
          ]
        };

        mailer.sendMail(mailOptions, (err) => {
          if (err) {
            debug('Email sending failed: %O', err);
          } else {
            debug('Email sent successfully for %s', filename);
          }
          mailer.close();
          try {
            fs.unlinkSync(filePath);
          } catch (fsErr) {
            debug('File removal failed: %O', fsErr);
          }
        });
      });
    });
  }
  res.send('email sent!');
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Export the app for testing purposes and start the server only if run directly
module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    debug(`Server listening on port ${PORT}`);
  });
}
