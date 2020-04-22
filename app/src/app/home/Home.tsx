import React from 'react';

const Home: React.FC = () => {
    return (
        <div className="w-full min-h-full flex flex-col justify-center items-center">
            <div className="text-white text-5xl font-bold">Welcom to Uvid</div>
            <div className="text-white text-xl mb-5">Please enter your name before joining</div>
            <input className="text-xl w-64 text-center p-1 rounded mb-5 outline-none" placeholder="Add your name"/>
            <div className="text-white bg-green-400 text-xl rounded-full w-32 p-2 text-center cursor-pointer">Join</div>
        </div>
    );
};

export default Home;
