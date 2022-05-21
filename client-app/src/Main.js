import React from 'react';
import { Routes, Route } from 'react-router-dom';

import Home from './Home';
import QuizMaster from './QuizMaster';


class Main extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            host: "http://localhost:8080"
        }
    }
    render() {
        return (
            <Routes> {/* The Switch decides which component to show based on the current URL.*/}
                <Route exact path='/' element={<Home wsUri="ws://localhost:8080/ws" />}></Route>
                <Route exact path='/quizmaster' element={<QuizMaster host={this.state.host} />}></Route>
            </Routes>
        );
    }
}

export default Main;