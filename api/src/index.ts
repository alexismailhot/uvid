import express from 'express';
import { PORT } from './constants/constants';
import Server from './server/server';
import * as path from 'path';

const app = express();

app.use(express.static(path.join(__dirname, '../client/build')));

app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

const server = new Server(app, PORT);
server.start();
