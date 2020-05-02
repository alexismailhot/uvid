import React, { useRef } from 'react';
import { useHistory } from 'react-router-dom';

// TODO: generate real unique link?
const FAKE_UNIQUE_LINK = '1g6jd93fdz';

const CreateCall: React.FC = () => {
    const history = useHistory();
    const userName = useRef<HTMLInputElement>(null);
    const enterNameErrorMessage = useRef<HTMLDivElement>(null);

    const createCall = () => {
        if (userName.current && userName.current.value !== '') {
            history.push({
                pathname:`/${FAKE_UNIQUE_LINK}/videocall`,
                state: {
                    name: userName.current.value,
                    showJoinURL: true
                }
            });
        } else {
            enterNameErrorMessage.current?.classList.remove('hidden');
        }
    };

    return (
        <div className='w-full min-h-full flex flex-col justify-center items-center'>
            <div className='text-white text-5xl font-bold'>Welcom to Uvid</div>
            <div className='text-white text-xl mb-5'>Please enter your name before creating a call</div>
            <input ref={userName} className='text-xl w-64 text-center p-1 rounded mb-2 outline-none' placeholder="Add your name" />
            <div ref={enterNameErrorMessage} className='hidden text-red-500'>Sorry, but you'll need to enter your name before joining</div>
            <div className='text-white bg-green-400 text-xl rounded-full w-40 p-2 text-center cursor-pointer mt-5' onClick={createCall}>Create call</div>
        </div>
    );
};

export default CreateCall;

