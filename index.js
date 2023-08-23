require('dotenv').config();
const logger = require('code-logger');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// logger.doStart();
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
const clients = {}; // To store client subscriptions 
const PORT = process.env.PORT || 3001;
const DELAY = process.env.DELAY || 5000;

app.use(cors());

/**
 * Sends event responses to subscribed clients after a delay.
 * @param {string} clientId - The client identifier.
 * @param {object} body - The event payload.
 * @param {string[]} subscriptions - The list of subscriptions.
 */
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

/**
 * Handles client subscription to server-sent events (SSE).
 * @param {Request} req - The HTTP request object.
 * @param {Response} res - The HTTP response object.
 */
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

/**
 * Handles sending notifications to subscribed clients.
 * @param {Request} req - The HTTP request object.
 * @param {Response} res - The HTTP response object.
 */
app.post('/notify/:clientId', (req, res) => {
    const clientId = req.params.clientId;
    const body = req.body || {};
    let subscriptions = ['*'];
    // Check if component subscriptions are provided from the client
    if (body && body.subscriptions && body.subscriptions.length) {
        subscriptions = [...body.subscriptions];
    }
    delete body.subscriptions; // delete subscriptions from body, rest of the data will be used as payload
    console.log('Body:', body);
    onEventResponse(clientId, body || {}, subscriptions);
    res.status(202).send({ status: 'success', payload: 'Notification Received on Server.' });
});

/**
 * Handles webhook notifications from external systems.
 * @param {Request} req - The HTTP request object.
 * @param {Response} res - The HTTP response object.
 */
app.post('/webhook/:clientId', (req, res) => {
    const clientId = req.params.clientId;
    const body = req.body || {};
    let subscriptions = ['*'];
    // Check if component subscriptions are provided from the client
    if (body && body.subscriptions && body.subscriptions.length) {
        subscriptions = [...body.subscriptions];
    }
    delete body.subscriptions; // delete subscriptions from body, rest of the data will be used as payload
    console.log('Body:', body);
    onEventResponse(clientId, body || {}, subscriptions);
    res.status(202).send({ status: 'success', payload: 'Webhook Received on Server.' });
});

/**
 * Handles webhook notifications from external systems.
 * @param {Request} req - The HTTP request object.
 * @param {Response} res - The HTTP response object.
 */
app.post('/logs/:clientId', (req, res) => {
    const clientId = req.params.clientId;
    const body = req.body || {};
    let subscriptions = ['*'];
    // Check if component subscriptions are provided from the client
    if (body && body.subscriptions && body.subscriptions.length) {
        subscriptions = [...body.subscriptions];
    }
    delete body.subscriptions; // delete subscriptions from body, rest of the data will be used as payload
    console.log('Body:', body);
    // onEventResponse(clientId, body || {}, subscriptions);
    res.status(202).send({ status: 'success', payload: 'Webhook Received on Server.' });
});

/**
 * Starts the Express server.
 */
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});
