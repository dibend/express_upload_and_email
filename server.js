var express = require('express');
var busboy = require('connect-busboy');
var path = require('path');
var fs = require('fs');
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var config = require('./config');

var app = express();
app.use(busboy());

var mailer = nodemailer.createTransport(smtpTransport({
  host: config.ses_host,
  secureConnection: true,
  port: 465,
  auth: {
    user: config.ses_user,
    pass: config.ses_pass
  }
}));

app.post('/upload', function(req, res) {
    req.pipe(req.busboy);
    req.busboy.on('file', function(fieldname, file, filename) {
        var fstream = fs.createWriteStream('./uploads/' + filename);
        file.pipe(fstream);
        fstream.on('close', function () {
            var mailOptions = {
                from: config.from,
                to: config.to,
                subject: 'File',
                text: 'File',
                attachments: [
                    {
                        filename: filename,
                        path: './uploads/' + filename
                    }
                ]
            };
            mailer.sendMail(mailOptions, function(err, res) {
                if(err) {
                    console.log(err);
                }
                mailer.close();
            });
        });
    });
            res.send('email sent!');
});
     
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});

app.listen(3000);
