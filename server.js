const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const WEB_APP_URL = process.env.WEB_APP_URL || '';
const QUESTIONS_URL = process.env.QUESTIONS_URL || '';
const QUIZ_LIST_URL = process.env.QUIZ_LIST_URL || '';
const SHEET_URL = process.env.SHEET_URL || '';

function proxyRequest(target, req, res) {
  try {
    const url = new URL(target);
    const options = {
      method: req.method,
      headers: { ...req.headers, host: url.host }
    };
    const lib = url.protocol === 'https:' ? https : http;
    const proxyReq = lib.request(url, options, proxyRes => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    });
    proxyReq.on('error', () => {
      res.writeHead(500);
      res.end('Proxy error');
    });
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      req.pipe(proxyReq, { end: true });
    } else {
      proxyReq.end();
    }
  } catch (err) {
    res.writeHead(500);
    res.end('Proxy error');
  }
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/api/webapp')) {
    const query = new URL(req.url, 'http://localhost').search;
    proxyRequest(WEB_APP_URL + query, req, res);
  } else if (req.url.startsWith('/api/quizzes')) {
    proxyRequest(`${QUIZ_LIST_URL}?action=getQuizzes`, req, res);
  } else if (req.url.startsWith('/api/questions')) {
    if (req.method === 'GET') {
      const params = new URL(req.url, 'http://localhost').searchParams;
      const quiz = params.get('quiz') || '';
      const target = `${QUESTIONS_URL}?action=getQuestions&quiz=${encodeURIComponent(quiz)}`;
      proxyRequest(target, req, res);
    } else if (req.method === 'POST') {
      const target = `${QUESTIONS_URL}?action=addQuestion`;
      proxyRequest(target, req, res);
    } else {
      res.writeHead(405);
      res.end('Method Not Allowed');
    }
  } else if (req.url.startsWith('/sheet')) {
    res.writeHead(302, { Location: SHEET_URL });
    res.end();
  } else {
    const filePath = path.join(__dirname, req.url === '/' ? '/index.html' : req.url);
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Not Found');
      } else {
        res.writeHead(200);
        res.end(data);
      }
    });
  }
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
