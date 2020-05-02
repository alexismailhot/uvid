import React, { useRef } from 'react';
import { useHistory } from 'react-router-dom';

const Home: React.FC = () => {
    const history = useHistory();
    const userName = useRef<HTMLInputElement>(null);
    const enterNameErrorMessage = useRef<HTMLDivElement>(null);

    const createCall = () => {
        if (userName.current && userName.current.value !== '') {
            history.push({
                pathname:'/unique-link',
                state: { name: userName.current.value }
            });
        } else {
            enterNameErrorMessage.current?.classList.remove("hidden");
        }
    };

    return (
        <div className='w-full min-h-full flex flex-col justify-center items-center'>
            <div className='text-white text-5xl font-bold'>Welcom to Uvid</div>
            <div className='text-white text-xl mb-5'>Please enter your name before joining</div>
            <input ref={userName} className='text-xl w-64 text-center p-1 rounded mb-2 outline-none' placeholder="Add your name" />
            <div ref={enterNameErrorMessage} className='hidden text-red-500'>Sorry, but you'll need to enter your name before joining</div>
            <div className='text-white bg-green-400 text-xl rounded-full w-32 p-2 text-center cursor-pointer mt-5' onClick={createCall}>Join</div>
        </div>
    );
};

export default Home;

