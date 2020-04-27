import React, { useEffect, useRef, useState } from 'react';
import socketIOClient from 'socket.io-client';

const ENDPOINT = 'http://127.0.0.1:4000';
const CONFIGURATION = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]};

const socket = socketIOClient(ENDPOINT);
const peerConnection = new RTCPeerConnection(CONFIGURATION);

const VideoCall: React.FC = () => {

    const localVideo = useRef<HTMLVideoElement>(null);
    const remoteVideo = useRef<HTMLVideoElement>(null);

    const [users, updateUsers] = useState<string[] | null>(null);

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

    const callUser = async (socketId: string) => {
        const offer = await peerConnection.createOffer();
        await peerConnection?.setLocalDescription(new RTCSessionDescription(offer!));

        socket.emit("call-user", {
            offer,
            to: socketId
        });
    };

    useEffect(() => {
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

        socket.on("add-new-user", (usersList: {users: string[]}) => {
           updateUsers(usersList['users']);
        });

        socket.on("answer-made", async (data: any) => {
            await peerConnection.setRemoteDescription(
                new RTCSessionDescription(data.answer)
            );
        });

        peerConnection.ontrack = function({ streams: [stream] }) {
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
    }, []);

    if (users) {
        return (
            <div>
                <div onClick={() => startCamera()}>Start camera</div>
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
