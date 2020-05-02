import React, { useEffect, useRef, useState } from 'react';
import socketIOClient from 'socket.io-client';
import { useLocation } from 'react-router';

const CONFIGURATION = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]};
const peerConnection = new RTCPeerConnection(CONFIGURATION);

const VideoCall: React.FC = () => {
    const location = useLocation();
    const currentURL = window.location.href;
    const joinCallURL = currentURL.substring(0, currentURL.lastIndexOf("/"));
    // @ts-ignore
    const userName = location.state.name;
    // @ts-ignore
    const showJoinURL = location.state.showJoinURL;
    const [remoteUsername, setRemoteUsername] = useState<string>('');
    const [socket, setSocket] = useState<SocketIOClient.Socket | undefined>(undefined);
    const [cameraStarted, setCameraStarted] = useState<boolean>(false);

    const localVideo = useRef<HTMLVideoElement>(null);
    const remoteVideo = useRef<HTMLVideoElement>(null);
    const localVideoWrapper = useRef<HTMLDivElement>(null);
    const remoteVideoWrapper = useRef<HTMLDivElement>(null);
    const videosWrapper = useRef<HTMLDivElement>(null);
    const callEndedMessage = useRef<HTMLDivElement>(null);
    const partnerEndedCall = useRef<HTMLDivElement>(null);
    const remoteUsernameDiv = useRef<HTMLDivElement>(null);
    const joinURL = useRef<HTMLDivElement>(null);

    enum SocketEvent {
        CALL_USER = 'call-user',
        END_CALL = 'end-call',
        ASK_USERNAME = 'ask-username',
        GIVE_USERNAME = 'give-username',
        NEW_USER = 'new-user',
        CALL_MADE = 'call-made',
        MAKE_ANSWER = 'make-answer',
        ANSWER_MADE = 'answer-made',
        ADDED_ICE_CANDIDATE = 'added-ice-candidate',
        CALL_ENDED = 'call-ended',
        NEW_ICE_CANDIDATE = 'new-ice-candidate'
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
        }).catch(e => console.log('Error: ', e));
    };

    if (!socket) {
        setSocket(socketIOClient());
    }

    if (!cameraStarted) {
        startCamera();
        setCameraStarted(true);
    }

    const callUser = async (socketId: string) => {
        const offer = await peerConnection.createOffer();
        await peerConnection?.setLocalDescription(new RTCSessionDescription(offer!));

        socket?.emit(SocketEvent.CALL_USER, {
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
        if (videosWrapper.current) {
            videosWrapper.current.classList.add('hidden');
        }
        if (callEndedMessage.current) {
            callEndedMessage.current.classList.remove('hidden');
        }
        peerConnection.close();
        socket?.emit(SocketEvent.END_CALL);
    };

    useEffect(() => {
        if (remoteUsernameDiv.current) {
            remoteUsernameDiv.current.innerText = remoteUsername;
        }
    }, [remoteUsername]);

    useEffect(() => {
        if (socket) {
            socket.on(SocketEvent.ASK_USERNAME, () => {
                socket.emit(SocketEvent.GIVE_USERNAME, {
                    username: userName,
                    socketId: socket.id
                })
            });

            socket.on(SocketEvent.NEW_USER, async (user: {id: string, name: string}) => {
                setRemoteUsername(user.name);
                if (joinURL.current) {
                    joinURL.current.classList.add('hidden');
                }
                await callUser(user.id);
            });

            socket.on(SocketEvent.CALL_MADE, async (data: any) => {
                setRemoteUsername(data.username);

                await peerConnection.setRemoteDescription(
                    new RTCSessionDescription(data.offer)
                );

                const answer = await peerConnection.createAnswer();
                await peerConnection.setLocalDescription(new RTCSessionDescription(answer));

                socket.emit(SocketEvent.MAKE_ANSWER, {
                    answer,
                    to: data.socket
                });
            });

            socket.on(SocketEvent.ANSWER_MADE, async (data: any) => {
                await peerConnection.setRemoteDescription(
                    new RTCSessionDescription(data.answer)
                );
            });

            socket.on(SocketEvent.ADDED_ICE_CANDIDATE, async (data: any) => {
                if (data) {
                    try {
                        await peerConnection.addIceCandidate(data.iceCandidate);
                    } catch (e) {
                        console.error('Error adding received ice candidate', e);
                    }
                }
            });

            socket.on(SocketEvent.CALL_ENDED, () => {
                if (localVideo.current) {
                    localVideo.current.srcObject = null;
                }
                if (remoteVideo.current) {
                    remoteVideo.current.srcObject = null;
                }
                if (videosWrapper.current) {
                    videosWrapper.current.classList.add('hidden');
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
                    socket.emit(SocketEvent.NEW_ICE_CANDIDATE, {
                        eventCandidate: event.candidate
                    });
                }
            });
        }
    }, []);

    return (
        <div className='flex w-full'>
            <div ref={videosWrapper} className='flex flex-col justify-center items-center w-full'>
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
                <div ref={joinURL} className={`${showJoinURL ? '' : 'hidden'} text-white text-xl mt-5`}>Share this link to let someone join your call: {joinCallURL}</div>
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
