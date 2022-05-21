import logo from './logo.svg';
import './QuizMaster.css';
import React from "react"
import LoginForm from "./LoginForm"
import QuestionForm from "./QuestionForm"
import axios from 'axios';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';

class QuizMaster extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            question_id: null,
            title: "",
            answer_a: "",
            answer_b: "",
            answer_c: "",
            answer_d: "",
            activate: false,
            error: null,
            status: null,
            host: props.host
        }

        this.handleSubmit = this.handleSubmit.bind(this);
        this.changeTitle = this.changeTitle.bind(this);
        this.changeAnswerA = this.changeAnswerA.bind(this);
        this.changeAnswerB = this.changeAnswerB.bind(this);
        this.changeAnswerC = this.changeAnswerC.bind(this);
        this.changeAnswerD = this.changeAnswerD.bind(this);
    }

    async componentDidMount() {
        const url = this.state.host + "/question"
        try {
            const result = await axios.get(url);
            console.log("Success: ", result);

            let newState = this.state;
            newState.question_id = result.data.id;
            newState.title = result.data.title;
            newState.answer_a = result.data.answer_a;
            newState.answer_b = result.data.answer_b;
            newState.answer_c = result.data.answer_c;
            newState.answer_d = result.data.answer_d;
            this.setState(newState)
        } catch (err) {
            console.error(err);
        }
    }

    async handleSubmit(event) {
        event.preventDefault();

        const questionData = {
            title: this.state.title,
            answer_a: this.state.answer_a,
            answer_b: this.state.answer_b,
            answer_c: this.state.answer_c,
            answer_d: this.state.answer_d,
            activateNow: this.state.activate
        }

        try {
            const result = await axios.post(this.state.host + "/question", JSON.stringify(questionData))
            const newState = this.state;
            newState.error = null;
            newState.token = result.data.access_token;
            this.setState(newState);
        }
        catch (err) {
            let prevState = this.state;
            prevState.error = err.message;
            this.setState(prevState);
            console.error(err.message);
        }

        // this.setState({redirect: "Question.js"});
    }

    changeTitle(evt) {
        let newState = this.state;
        newState.title = evt.target.value;
        this.setState(newState);
    }

    changeAnswerA(evt) {
        let newState = this.state;
        newState.answer_a = evt.target.value;
        this.setState(newState);
    }

    changeAnswerB(evt) {
        let newState = this.state;
        newState.answer_b = evt.target.value;
        this.setState(newState);
    }

    changeAnswerC(evt) {
        let newState = this.state;
        newState.answer_c = evt.target.value;
        this.setState(newState);
    }

    changeAnswerD(evt) {
        let newState = this.state;
        newState.answer_d = evt.target.value;
        this.setState(newState);
    }

    render() {
        let el;
        if (this.state.token) {
            el = <QuestionForm user={this.state.user} accessToken={this.state.accessToken} />;
        } else {
            el = <LoginForm onSubmit={this.handleSubmit} />;
        }

        return (
            <div className="App">
                <header className="App-header">
            <Tabs>
              <TabList>
                <Tab>Nieuwe vraag</Tab>
                <Tab>Huidige vraag</Tab>
              </TabList>
          
              <TabPanel>
                    <form onSubmit={this.handleSubmit}>
                        
                            <span className="textheader">Quizvraag: </span>
                            <input type="text" id="title"
                                onChange={this.changeTitle}
                                placeholder="Wat wordt de vraag?"
                                value={this.state.title} />
                        

                        <span className="textheader">Antwoordmogelijkheden:</span>

                        <input type="text" id="answer_a"
                            onChange={this.changeAnswerA}
                            placeholder="Antwoord A?"
                            value={this.state.answer_a} />
                        

                        <input type="text" 
                            onChange={this.changeAnswerB}
                            placeholder="Antwoord B?"
                            value={this.state.answer_b} />

                        <input type="text" 
                            onChange={this.changeAnswerC}
                            placeholder="Antwoord C?"
                            value={this.state.answer_c} />                        

                        <input type="text"
                            onChange={this.changeAnswerD}
                            placeholder="Antwoord D?"
                            value={this.state.answer_d} />

                        <button>Activeer</button>
                    </form>
                    
                    <span>{this.state.status}</span>
                    <span>{this.state.error}</span>
              </TabPanel>
              <TabPanel>
                <div>
                    <h3>{this.state.title}</h3>
                </div>
                <div>
                    <div>
                        <span>{this.state.answer_a} </span>
                        <span>100</span>
                    </div>
                </div>
                <div>
                    <div>
                        <span>{this.state.answer_b} </span>
                        <span>100</span>
                    </div>
                </div>
                <div>
                    <div>
                        <span>{this.state.answer_c} </span>
                        <span>100</span>
                    </div>
                </div>
                <div>
                    <div>
                        <span>{this.state.answer_d} </span>
                        <span>100</span>
                    </div>
                </div>
              </TabPanel>
            </Tabs>
            </header>
            </div>
        );
    }
}

export default QuizMaster;
