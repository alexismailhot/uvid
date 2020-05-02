import React, { useEffect, useRef, useState } from 'react';
import socketIOClient from 'socket.io-client';
import { useLocation } from 'react-router';

const CONFIGURATION = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]};
const peerConnection = new RTCPeerConnection(CONFIGURATION);

// TODO: constantes pour tous les events de socket

const VideoCall: React.FC = () => {
    const location = useLocation();
    // @ts-ignore
    const userName = location.state.name;
    const [remoteUsername, setRemoteUsername] = useState<string>('');
    const [socket, setSocket] = useState<SocketIOClient.Socket | undefined>(undefined);
    if (!socket) {
        setSocket(socketIOClient());
    }

    const localVideo = useRef<HTMLVideoElement>(null);
    const remoteVideo = useRef<HTMLVideoElement>(null);
    const videoWrapper = useRef<HTMLDivElement>(null);
    const callEndedMessage = useRef<HTMLDivElement>(null);
    const partnerEndedCall = useRef<HTMLDivElement>(null);
    const localVideoWrapper = useRef<HTMLDivElement>(null);
    const remoteVideoWrapper = useRef<HTMLDivElement>(null);
    const remoteUsernameDiv = useRef<HTMLDivElement>(null);

    const startCamera = async () => {
        navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true
        }).then(stream => {
            if (localVideo.current) {
                localVideo.current.srcObject = stream;
            }
            stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
        }).catch(e => console.log('Error: ', e));
    };

    const [cameraStarted, setCameraStarted] = useState<boolean>(false);
    if (!cameraStarted) {
        startCamera();
        setCameraStarted(true);
    }

    const callUser = async (socketId: string) => {
        const offer = await peerConnection.createOffer();
        await peerConnection?.setLocalDescription(new RTCSessionDescription(offer!));

        socket?.emit('call-user', {
            offer,
            username: userName,
            to: socketId
        });
    };

    const stopCall = () => {
            if (localVideo.current) {
                localVideo.current.srcObject = null;
            }
            if (remoteVideo.current) {
                remoteVideo.current.srcObject = null;
            }
            if (videoWrapper.current) {
                videoWrapper.current.classList.add('hidden');
            }
            if (callEndedMessage.current) {
                callEndedMessage.current.classList.remove('hidden');
            }
            peerConnection.close();
            socket?.emit('end-call');
    };

    useEffect(() => {
        if (remoteUsernameDiv.current) {
            remoteUsernameDiv.current.innerText = remoteUsername;
        }
    }, [remoteUsername]);

    useEffect(() => {
        if (socket) {
            socket.on('call-made', async (data: any) => {
                setRemoteUsername(data.username);

                await peerConnection.setRemoteDescription(
                    new RTCSessionDescription(data.offer)
                );

                const answer = await peerConnection.createAnswer();
                await peerConnection.setLocalDescription(new RTCSessionDescription(answer));

                socket.emit('make-answer', {
                    answer,
                    to: data.socket
                });
            });

            socket.on('new-user', async (user: {id: string, name: string}) => {
                setRemoteUsername(user.name);
                await callUser(user.id);
            });

            socket.on('ask-username', () => {
                socket.emit('give-username', {
                    username: userName,
                    socketId: socket.id
                })
            });

            socket.on('answer-made', async (data: any) => {
                await peerConnection.setRemoteDescription(
                    new RTCSessionDescription(data.answer)
                );
            });

            socket.on('added-ice-candidate', async (data: any) => {
                if (data) {
                    try {
                        await peerConnection.addIceCandidate(data.iceCandidate);
                    } catch (e) {
                        console.error('Error adding received ice candidate', e);
                    }
                }
            });

            socket.on('call-ended', () => {
                if (localVideo.current) {
                    localVideo.current.srcObject = null;
                }
                if (remoteVideo.current) {
                    remoteVideo.current.srcObject = null;
                }
                if (videoWrapper.current) {
                    videoWrapper.current.classList.add('hidden');
                }
                if (callEndedMessage.current) {
                    callEndedMessage.current.classList.remove('hidden');
                }
                if (partnerEndedCall.current) {
                    partnerEndedCall.current.classList.remove('hidden');
                }
            });

            peerConnection.ontrack = ({streams: [stream]}) => {
                if (remoteVideo.current) {
                    remoteVideo.current.srcObject = stream;
                }
               if (remoteVideoWrapper.current){
                   remoteVideoWrapper.current.classList.remove('hidden');
               }
               if (localVideoWrapper.current) {
                   localVideoWrapper.current.classList.remove('w-5/6');
                   localVideoWrapper.current.classList.add('w-1/2');
               }
            };

            peerConnection.addEventListener('icecandidate', event => {
                if (event.candidate) {
                    socket.emit('new-ice-candidate', {
                        eventCandidate: event.candidate
                    });
                }
            });
        }
    }, []);

    return (
        <div className='flex w-full'>
            <div ref={videoWrapper} className='flex flex-col justify-center items-center w-full'>
                <div className='flex justify-center'>
                    <div ref={localVideoWrapper} className='flex flex-col w-5/6 items-center'>
                        <video className='w-full' ref={localVideo} autoPlay muted />
                        <div className='text-white text-xl mt-5'>{userName}</div>
                    </div>
                    <div ref={remoteVideoWrapper} className='flex flex-col w-1/2 items-center hidden'>
                        <video className='w-full' ref={remoteVideo} autoPlay />
                        <div ref={remoteUsernameDiv} className='text-white text-xl mt-5'>{remoteUsername}</div>
                    </div>
                </div>
                <div className='text-white bg-red-400 text-xl rounded-full w-32 p-2 text-center cursor-pointer mt-5' onClick={stopCall}>Stop</div>
            </div>
            <div ref={callEndedMessage} className='hidden flex flex-col justify-center items-center w-full'>
                <div ref={partnerEndedCall} className='hidden text-white text-xl mb-5'>{remoteUsername} ended the call</div>
                <div className='text-white text-xl'>We hope you enjoyed Uvid!</div>
            </div>
        </div>
    );
};

export default VideoCall;
