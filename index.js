// producer/index.js
const express = require('express');
const bodyParser = require('body-parser');
const { Kafka } = require('kafkajs');

const kafkaBrokers = process.env.KAFKA_BROKERS?.split(',') || ['kafka:9092'];
const kafka = new Kafka({ clientId: 'producer', brokers: kafkaBrokers });
const producer = kafka.producer();

async function start() {
  await producer.connect();
  console.log('Kafka producer connected');

  const app = express();
  app.use(bodyParser.json());

  app.post('/api/prod/event', async (req, res) => {
    const payload = JSON.stringify(req.body || { ts: Date.now() });
    await producer.send({
      topic: process.env.KAFKA_TOPIC || 'events',
      messages: [{ value: payload }],
    });
    res.json({ ok: true, payload });
  });

  app.get('/healthz', (req, res) => res.send('ok'));
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`Producer listening ${port}`));
}

start().catch(err => {
  console.error(err);
  process.exit(1);
});
