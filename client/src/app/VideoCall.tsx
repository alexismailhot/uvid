import React, { useEffect, useRef, useState } from 'react';
import socketIOClient from 'socket.io-client';
import { useLocation } from 'react-router';

const CONFIGURATION = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]};
const peerConnection = new RTCPeerConnection(CONFIGURATION);

const VideoCall: React.FC = () => {
    const location = useLocation();
    // @ts-ignore
    const userName = location.state.name;
    const localVideo = useRef<HTMLVideoElement>(null);
    const remoteVideo = useRef<HTMLVideoElement>(null);
    const [socket, setSocket] = useState<SocketIOClient.Socket | undefined>(undefined);
    if (!socket) {
        setSocket(socketIOClient());
    }

    const startCamera = async () => {
        navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true
        }).then(stream => {
            if (localVideo.current) {
                localVideo.current.srcObject = stream;
            }
            stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
        }).catch(e => console.log('getUserMedia() error: ', e));
    };

    const [cameraStarted, setCameraStarted] = useState<boolean>(false);
    if (!cameraStarted) {
        startCamera();
        setCameraStarted(true);
    }

    const callUser = async (socketId: string) => {
        const offer = await peerConnection.createOffer();
        await peerConnection?.setLocalDescription(new RTCSessionDescription(offer!));

        socket?.emit("call-user", {
            offer,
            to: socketId
        });
    };

    useEffect(() => {
        if (socket) {
            socket.on("call-made", async (data: any) => {
                await peerConnection.setRemoteDescription(
                    new RTCSessionDescription(data.offer)
                );

                const answer = await peerConnection.createAnswer();
                await peerConnection.setLocalDescription(new RTCSessionDescription(answer));

                socket.emit("make-answer", {
                    answer,
                    to: data.socket
                });
            });

            socket.on('new-user', async (user: {id: string, name: string}) => {
                await callUser(user.id);
            });

            socket.on("ask-username", (test: {testUser: string[]}) => {
                socket.emit('give-username', {
                    username: userName,
                    socketId: socket.id
                })
            });

            socket.on("answer-made", async (data: any) => {
                await peerConnection.setRemoteDescription(
                    new RTCSessionDescription(data.answer)
                );
            });

            peerConnection.ontrack = ({streams: [stream]}) => {
                if (remoteVideo.current) {
                    remoteVideo.current.srcObject = stream;
                }
            };

            // Listen for local ICE candidates on the local RTCPeerConnection
            peerConnection.addEventListener('icecandidate', event => {
                if (event.candidate) {
                    socket.emit('new-ice-candidate', {
                        eventCandidate: event.candidate
                    });
                }
            });

            // Listen for remote ICE candidates and add them to the local RTCPeerConnection
            socket.on("added-ice-candidate", async (data: any) => {
                if (data) {
                    try {
                        await peerConnection.addIceCandidate(data.iceCandidate);
                    } catch (e) {
                        console.error('Error adding received ice candidate', e);
                    }
                }
            });
        }
    }, []);

    return (
        <div>
            <div>
                <video ref={remoteVideo} autoPlay />
                <video ref={localVideo} autoPlay muted />
            </div>
        </div>
    );
};

export default VideoCall;
