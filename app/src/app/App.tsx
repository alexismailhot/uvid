import React from 'react';
import { Switch, Route } from 'react-router-dom';
import Home from './home/Home';

function App() {
  return (
    <div className="flex bg-indigo-900 min-h-screen">
        <Switch>
            <Route path='/' component={Home} />
        </Switch>
    </div>
  );
}

export default App;
