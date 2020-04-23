import express from 'express';
import { PORT } from './constants/constants';
import Server from './server/server';

const app = express();
const server = new Server(app, PORT);
server.start();
