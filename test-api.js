const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/analyze',
  method: 'POST',
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log('Response:', data.substring(0, 1000)));
});

req.on('error', (e) => console.error(e));

req.write('{}');
req.end();
