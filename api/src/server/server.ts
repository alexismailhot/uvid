import { Express } from 'express';
import socketIO, { Server as SocketIOServer } from 'socket.io';

export default class Server {
    private readonly app: Express;
    private socketIOServer: SocketIOServer;
    private readonly port: string;

    constructor(app: Express, port: string) {
        this.app = app;
        this.port = port;
    }

    start(): void {
        const httpServer = this.app.listen(this.port, () => {
            console.log(`Server is listening on port ${this.port}`);
        });
        this.socketIOServer = socketIO(httpServer);
        this.handleSocketConnection();
    }

    private handleSocketConnection(): void {
        console.log('Socket IO server started');
        this.socketIOServer.on('connection', socket => {
            console.log('Socket connected');
        })
    }
}
