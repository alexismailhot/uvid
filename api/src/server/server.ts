import { Express } from 'express';
import socketIO, { Server as SocketIOServer } from 'socket.io';

export default class Server {
    private readonly app: Express;
    private socketIOServer: SocketIOServer;
    private readonly port: string;
    private activeSockets: string[] = [];

    constructor(app: Express, port: string) {
        this.app = app;
        this.port = port;
    }

    start(): void {
        const httpServer = this.app.listen(this.port, () => {
            console.log(`Server is listening on port ${this.port}`);
        });
        this.socketIOServer = socketIO(httpServer);
        this.activeSockets = [];
        this.handleSocketConnection();
    }

    private handleSocketConnection(): void {
        console.log('Socket IO server started');

        this.socketIOServer.on('connection', socket => {
            const existingSocket = this.activeSockets.find((activeSocket) =>
                activeSocket === socket.id
            );

            if (!existingSocket) {
                this.activeSockets.push(socket.id);

                socket.emit('add-new-user', {
                    users: this.activeSockets.filter(existingSocket => existingSocket !== socket.id)
                })
            }

            socket.broadcast.emit("add-new-user", {
                users: [socket.id]
            });

            socket.on("disconnect", () => {
                this.activeSockets = this.activeSockets.filter(
                    existingSocket => existingSocket !== socket.id
                );
                socket.broadcast.emit("remove-user", {
                    socketId: socket.id
                });
            });

            // console.log(socket);

            // socket.emit("FromAPI", "test socket connected");
            // console.log('Socket connected');
            console.log("active sockets :");
            console.log(this.activeSockets);

            socket.on("call-user", data => {
                // console.log("call user");
                socket.to(data.to).emit("call-made", {
                    offer: data.offer,
                    socket: socket.id
                })
            });

            socket.on("make-answer", data => {
                // console.log("make answer");
                socket.to(data.to).emit("answer-made", {
                    socket: socket.id,
                    answer: data.answer
                });
            });

            socket.on("new-ice-candidate", data => {
                // console.log("make answer");
                // console.log(socket.id);
               /* console.log("sending 'added-ice-candidate' to socket : ");
                console.log(data.to);
                console.log("here is the data sent: ");*/
                console.log(data.eventCandidate);

                socket.broadcast.emit("added-ice-candidate", {
                    iceCandidate: data.eventCandidate
                });

               /* socket.to(data.to).emit("added-ice-candidate", {
                    socket: socket.id,
                    answer: data.eventCandidate
                });*/
            });
        })
    }
}
