import React, {useEffect, useRef, useState, VideoHTMLAttributes} from "react";
import socketIOClient from "socket.io-client";
const ENDPOINT = "http://127.0.0.1:4000";

const VideoCall: React.FC = () => {

    const localVideo = useRef<HTMLVideoElement>(null);

    const [users, updateUsers] = useState([]);

    navigator.getUserMedia(
        { video: true, audio: true },
        stream => {

            if (localVideo) {
                localVideo.current!.srcObject = stream;
            }
        },
        error => {
            console.warn(error.message);
        }
    );

    useEffect(() => {
        const socket = socketIOClient(ENDPOINT);
        socket.on("add-new-user", (usersList: string[]) => {
            // here I have my list of socket ids, trying to put it in the state ...
            console.log(usersList);
            //updateUsers(users => users.concat(usersList));
        });
    }, []);


    return (
        <div>
            <div>
                Users: {users}
            </div>
            <div>
                <video autoPlay className="remote-video" id="remote-video"/>
                <video ref={localVideo} autoPlay muted className="local-video" id="local-video"/>
            </div>
        </div>
    );
};

export default VideoCall;
