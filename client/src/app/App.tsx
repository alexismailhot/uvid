import React from 'react';
import { Switch, Route } from 'react-router-dom';
import Home from './Home';
import VideoCall from './VideoCall';

function App() {
  return (
    <div className='flex bg-indigo-900 min-h-screen'>
        <Switch>
            <Route exact path='/' component={Home} />
            <Route path='/:uniqueLink' component={VideoCall} />
        </Switch>
    </div>
  );
}

export default App;
