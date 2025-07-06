jest.mock('connect-busboy', () => {
  const { EventEmitter } = require('events');
  const { PassThrough } = require('stream');
  return () => (req, res, next) => {
    const busboy = new EventEmitter();
    // monkey patch to mimic busboy being a stream to allow req.pipe(busboy)
    busboy.write = () => {};
    busboy.end = () => {};

    req.busboy = busboy;

    // Intercept req.pipe(busboy) call and immediately emit a fake 'file' event
    const originalPipe = req.pipe.bind(req);
    req.pipe = (dest) => {
      if (dest === busboy) {
        process.nextTick(() => {
          const fileStream = new PassThrough();
          busboy.emit('file', 'fileUploaded', fileStream, 'dummy.txt');
          fileStream.end();
        });
      }
      return originalPipe(dest);
    };
    next();
  };
});

const request = require('supertest');
const fs = require('fs');
const path = require('path');

// Mock nodemailer to prevent real emails
jest.mock('nodemailer', () => {
  const sendMailMock = jest.fn((options, cb) => cb(null, { accepted: [options.to] }));
  return {
    createTransport: jest.fn().mockReturnValue({
      sendMail: sendMailMock,
      close: jest.fn()
    })
  };
});

// Ensure uploads directory exists for the test environment
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const app = require('../server');

describe('Server Routes', () => {
  afterAll(() => {
    // Clean up any leftover files (should be handled by server, but double-check)
    const files = fs.readdirSync(uploadsDir);
    for (const f of files) {
      fs.unlinkSync(path.join(uploadsDir, f));
    }
  });

  test('GET / should return index.html content', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('<form');
  });

  test('POST /upload should accept a file and trigger email send', async () => {
    const res = await request(app)
      .post('/upload')
      .attach('fileUploaded', Buffer.from('dummy content'), 'dummy.txt');

    expect(res.statusCode).toBe(200);
    expect(res.text).toBe('email sent!');

    // The email sending is asynchronous and mocked; as long as no error occurs and the endpoint responds, the test is successful.
  });
});