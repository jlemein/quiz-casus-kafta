import React from 'react';
import { Routes, Route } from 'react-router-dom';

import Home from './Home';
import QuizMaster from './QuizMaster';

class Main extends React.Component {
    render() {
        return (
            <Routes> {/* The Switch decides which component to show based on the current URL.*/}
                <Route exact path='/' element={<Home />}></Route>
                <Route exact path='/quizmaster' element={<QuizMaster />}></Route>
            </Routes>
        );
    }
}

export default Main;