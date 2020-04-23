import React, {useEffect, useRef, useState} from "react";
import socketIOClient from "socket.io-client";

const ENDPOINT = "http://127.0.0.1:4000";
const socket = socketIOClient(ENDPOINT);

const VideoCall: React.FC = () => {

    const localVideo = useRef<HTMLVideoElement>(null);

    const remoteVideo = useRef<HTMLVideoElement>(null);

    const [users, updateUsers] = useState<string[] | null>(null);

    const [isAlreadyCalling, setIsAlreadyCalling] = useState<boolean>(false);

    const { RTCPeerConnection, RTCSessionDescription } = window;

    const configuration = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]};

    const peerConnection = new RTCPeerConnection(configuration);

    navigator.getUserMedia(
        { video: true, audio: true },
        stream => {
            if (localVideo.current) {
                localVideo.current.srcObject = stream;
            }
            stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
        },
        error => {
            console.warn(error.message);
        }
    );


    const callUser = async (socketId: string) => {
        console.log(socketId);

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);

        socket.emit("call-user", {
            offer,
            to: socketId
        });
    };

    useEffect(() => {
        socket.on("call-made", async (data: any) => {
            console.log("call made");
            await peerConnection.setRemoteDescription(
                new RTCSessionDescription(data.offer)
            );

            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);

            socket.emit("make-answer", {
                answer,
                to: data.socket
            });
        });

        socket.on("add-new-user", (usersList: {users: string[]}) => {
           updateUsers(usersList['users']);
        });

        socket.on("answer-made", async (data: any) => {
            console.log(data);
            await peerConnection.setRemoteDescription(
                new RTCSessionDescription(data.answer)
            );

            if (!isAlreadyCalling) {
                callUser(data.socket);
                setIsAlreadyCalling(true);
            }
        });

        // TODO: pas certain si ca doit aller ici ?!
        peerConnection.ontrack = function({ streams: [stream] }) {
            if (remoteVideo.current) {
                remoteVideo.current.srcObject = stream;
            }
        };

    }, []);

    console.log(users);

    if (users) {
        return (
            <div>
                <div>Connect</div>
                <div>
                    Users:
                </div>
                {users?.map((user) =>
                    <div onClick={() => callUser(user)}>{user}</div>
                )}
                <div>
                    <video ref={remoteVideo} autoPlay className="remote-video" id="remote-video"/>
                    <video ref={localVideo} autoPlay muted className="local-video" id="local-video"/>
                </div>
            </div>
        );
    } return <div/>

};

export default VideoCall;
