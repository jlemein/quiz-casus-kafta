import React from 'react';
import { Routes, Route } from 'react-router-dom';

import Home from './Home';
import QuizMaster from './QuizMaster';


class Main extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            host: process.env.REACT_APP_HTTP_API_URL
        }
    }
    render() {
        return (
            <Routes> {/* The Switch decides which component to show based on the current URL.*/}
                <Route exact path='/' element={<Home wsUri={process.env.REACT_APP_WS_API_URL + "/ws"} />}></Route>
                <Route exact path='/quizmaster' element={<QuizMaster host={this.state.host} />}></Route>
            </Routes>
        );
    }
}

export default Main;