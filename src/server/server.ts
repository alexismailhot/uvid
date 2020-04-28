import { Express } from 'express';
import socketIO, { Server as SocketIOServer } from 'socket.io';

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

        this.socketIOServer.on('connection', socket => {
            const existingSocket = this.activeSockets.has(socket.id);
            if (!existingSocket) {
                socket.emit("ask-username");

                socket.on('give-username', data => {
                    this.activeSockets.set(data.socketId, data.username);
                    if (this.activeSockets.size > 1) {
                        // Send message to all existing sockets (except new one) to tell them to connect with this new socket
                        for (const socketId of this.activeSockets.keys()) {
                            if (socketId !== socket.id) {
                                socket.to(socketId).emit('new-user', {
                                   id: socket.id,
                                   name: this.activeSockets.get(socket.id)
                                });
                            }
                        }
                    }
                });
            }

            socket.on("disconnect", () => {
                this.activeSockets.delete(socket.id);
                socket.broadcast.emit("remove-user", {
                    socketId: socket.id
                });
            });

            socket.on("call-user", data => {
                socket.to(data.to).emit("call-made", {
                    offer: data.offer,
                    socket: socket.id
                })
            });

            socket.on("make-answer", data => {
                socket.to(data.to).emit("answer-made", {
                    socket: socket.id,
                    answer: data.answer
                });
            });

            socket.on("new-ice-candidate", data => {
                // TODO: je ne crois pas que ce devrait etre un broadcast ici
                socket.broadcast.emit("added-ice-candidate", {
                    iceCandidate: data.eventCandidate
                });
            });
        })
    }
}
