import React from 'react';
import { Switch, Route } from 'react-router-dom';
import CreateCall from './CreateCall';
import VideoCall from './VideoCall';
import JoinCall from './JoinCall';

function App() {
  return (
    <div className='flex bg-indigo-900 min-h-screen'>
        <Switch>
            <Route exact path='/' component={CreateCall} />
            <Route path='/:uniqueLink/videocall' component={VideoCall} />
            <Route path='/:uniqueLink' component={JoinCall} />
        </Switch>
    </div>
  );
}

export default App;
