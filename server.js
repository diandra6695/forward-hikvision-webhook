import express from 'express';
import bodyParser from 'body-parser';

// just simple sample
const app = express();
app.use(bodyParser.text({ type: '*/*' }));

app.post('/webhook/hikvision', (req, res) => {
  console.log('=== Event from Hikvision ===');
  console.log(req.body);
  res.send('OK');
});

app.listen(3001, () => {
  console.log('Webhook server running at http://0.0.0.0:3001');
});
