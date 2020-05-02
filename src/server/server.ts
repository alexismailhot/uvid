import { Express } from 'express';
import socketIO, { Server as SocketIOServer } from 'socket.io';
import {
    SOCKET_ADDED_ICE_CANDIDATE,
    SOCKET_ANSWER_MADE,
    SOCKET_ASK_USERNAME,
    SOCKET_CALL_ENDED,
    SOCKET_CALL_MADE,
    SOCKET_CALL_USER,
    SOCKET_CONNECTION, SOCKET_END_CALL,
    SOCKET_GIVE_USERNAME,
    SOCKET_MAKE_ANSWER,
    SOCKET_NEW_ICE_CANDIDATE,
    SOCKET_NEW_USER
} from '../constants/constants';

export default class Server {
    private readonly app: Express;
    private socketIOServer: SocketIOServer;
    private readonly port: string;
    private activeSockets: Map<string, string> = new Map();

    constructor(app: Express, port: string) {
        this.app = app;
        this.port = port;
    }

    start(): void {
        const httpServer = this.app.listen(this.port, () => {
            console.log(`Server is listening on port ${this.port}`);
        });
        this.socketIOServer = socketIO(httpServer);
        this.activeSockets = new Map();
        this.handleSocketConnection();
    }

    private handleSocketConnection(): void {
        console.log('Socket IO server started');

        this.socketIOServer.on(SOCKET_CONNECTION, socket => {
            const existingSocket = this.activeSockets.has(socket.id);
            if (!existingSocket) {
                socket.emit(SOCKET_ASK_USERNAME);

                socket.on(SOCKET_GIVE_USERNAME, data => {
                    this.activeSockets.set(data.socketId, data.username);
                    if (this.activeSockets.size > 1) {
                        for (const socketId of this.activeSockets.keys()) {
                            if (socketId !== socket.id) {
                                socket.to(socketId).emit(SOCKET_NEW_USER, {
                                   id: socket.id,
                                   name: this.activeSockets.get(socket.id)
                                });
                            }
                        }
                    }
                });
            }

            socket.on(SOCKET_CALL_USER, data => {
                socket.to(data.to).emit(SOCKET_CALL_MADE, {
                    offer: data.offer,
                    socket: socket.id,
                    username: data.username
                })
            });

            socket.on(SOCKET_MAKE_ANSWER, data => {
                socket.to(data.to).emit(SOCKET_ANSWER_MADE, {
                    socket: socket.id,
                    answer: data.answer
                });
            });

            socket.on(SOCKET_NEW_ICE_CANDIDATE, data => {
                for (const socketId of this.activeSockets.keys()) {
                    if (socketId !== socket.id) {
                        socket.to(socketId).emit(SOCKET_ADDED_ICE_CANDIDATE, {
                            iceCandidate: data.eventCandidate
                        });
                    }
                }
            });

            socket.on(SOCKET_END_CALL, () => {
                for (const socketId of this.activeSockets.keys()) {
                    if (socketId !== socket.id) {
                        socket.to(socketId).emit(SOCKET_CALL_ENDED);
                    }
                }
            });
        })
    }
}
