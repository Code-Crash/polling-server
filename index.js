const express = require('express');
// const http = require('http');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
// const server = http.createServer(app);
const clients = {}; // To store client subscriptions 
const PORT = 3001;

app.use(cors({ origin: 'http://localhost:3000', credentials: true })); // Allow only 'http://localhost:3000' with credentials

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
    console.log('Body:', body);
    if (clients[clientId]) {
        console.log(`Notifying client ${clientId}...`);
        clients[clientId].forEach((client) => {
            console.log(`Sending payload to client: ${clientId}`);
            let payload = {
                status: 'success',
                message: `You got notification.`,
                payload: body || {},
            }
            client.write(`data: ${JSON.stringify(payload)}\n\n`);
        });
    }

    res.status(202).send({ status: 'success', payload: 'Notification Received on Server.' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});
