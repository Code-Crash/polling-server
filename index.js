require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
const clients = {}; // To store client subscriptions 
const PORT = process.env.PORT || 3001;
const DELAY = process.env.DELAY || 5000;

app.use(cors());

const onEventResponse = (clientId, body, subscriptions = ['*']) => {
    setTimeout(() => {
        if (clients[clientId]) {
            console.log(`Notifying client ${clientId}...`);
            clients[clientId].forEach((client) => {
                console.log(`Sending payload to client: ${clientId}`);
                let payload = {
                    status: 'success',
                    message: `You got notification.`,
                    payload: body || {},
                    subscriptions: subscriptions,
                }
                client.write(`data: ${JSON.stringify(payload)}\n\n`);
            });
        }
    }, DELAY);
};

// NOTE: We can also add request id, but that would cause to create multiple pulling on client and server side. 
app.get('/subscribe/:clientId', (req, res) => {

    const clientId = req.params.clientId;

    if (!clients[clientId]) {
        clients[clientId] = [];
    }

    const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
    };

    res.writeHead(200, headers);

    console.log(`Client ${clientId} subscribed.`);
    clients[clientId].push(res);
    let payload = {
        status: 'success',
        message: `Subscription is successful for client ${clientId}`,
    }
    const data = `data: ${JSON.stringify(payload)}\n\n`;
    res.write(data);
    req.on('close', () => {
        console.log(`Client ${clientId} disconnected.`);
        const index = clients[clientId].indexOf(res);
        if (index !== -1) {
            clients[clientId].splice(index, 1);
        }
    });
});

app.post('/notify/:clientId', (req, res) => {
    const clientId = req.params.clientId;
    const body = req.body;
    let subscriptions = ['*'];
    // Check if component subscriptions is provided from client
    if (body && body.subscriptions && body.subscriptions.length) {
        subscriptions = [...body.subscriptions];
        delete body.subscriptions;
    }
    console.log('Body:', body);
    onEventResponse(clientId, body || {}, subscriptions);
    res.status(202).send({ status: 'success', payload: 'Notification Received on Server.' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});
