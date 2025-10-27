// producer/index.js
const express = require('express');
const bodyParser = require('body-parser');
const { Kafka } = require('kafkajs');

const kafkaBrokers = process.env.KAFKA_BROKERS?.split(',') || ['kafka:9092'];
console.log(kafkaBrokers)
const app = express();
app.use(bodyParser.json());
const port = process.env.PORT || 3000;
// const kafka = new Kafka({ clientId: 'producer', brokers: kafkaBrokers });
// const producer = kafka.producer();

// async function start() {
//   await producer.connect();
//   console.log('Kafka producer connected');

//   app.post('/api/prod/event', async (req, res) => {
//     const payload = JSON.stringify(req.body || { ts: Date.now() });
//     await producer.send({
//       topic: process.env.KAFKA_TOPIC || 'events',
//       messages: [{ value: payload }],
//     });
//     console.log('adding ndkfjnkfn')
//     res.json({ ok: true, payload });
//     // just to test the pipeline test
//   });

//   app.get('/healthz', (req, res) => res.send('ok'));
//   app.get('/', (req, res) => res.send('test running'));
//   app.listen(port, () => console.log(`Producer listening ${port}`));
// }

// start().catch(err => {
//   app.listen(port, () => console.log(`Producer listening ${port}`));
//   console.error(err);
//   process.exit(1);
// });

app.get('/', (req, res) => {
  res.send('Server is running on port ' + port);
});

// Start listening on the port
app.listen(port, () => {
  console.log(`✅ Server is listening on port ${port}`);
});