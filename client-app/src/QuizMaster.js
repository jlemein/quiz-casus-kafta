import logo from './logo.svg';
import './QuizMaster.css';
import React from "react"
import LoginForm from "./LoginForm"
import QuestionForm from "./QuestionForm"
import axios from 'axios';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
// import { BarChart } from './BarChart'

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
            host: process.env.REACT_APP_HTTP_API_URL,

            current_question: {
                title: "",
                answer_a: "",
                answer_b: "",
                answer_c: "",
                answer_d: "",
                votes_a: 0,
                votes_b: 0,
                votes_c: 0,
                votes_d: 0
            }
        }

        this.handleSubmit = this.handleSubmit.bind(this);
        this.changeTitle = this.changeTitle.bind(this);
        this.changeAnswerA = this.changeAnswerA.bind(this);
        this.changeAnswerB = this.changeAnswerB.bind(this);
        this.changeAnswerC = this.changeAnswerC.bind(this);
        this.changeAnswerD = this.changeAnswerD.bind(this);
    }

    parseQuestionData(result) {
        return {
            id: result.data.id,
            title: result.data.title,
            answer_a: result.data.answer_a,
            answer_b: result.data.answer_b,
            answer_c: result.data.answer_c,
            answer_d: result.data.answer_d,
            votes_a:  0,
            votes_b:  0,
            votes_c:  0,
            votes_d:  0,
        }
    }

    async componentDidMount() {
        this.ws = new WebSocket(process.env.REACT_APP_WS_API_URL + "/view");
        this.ws.onopen = this.onSocketOpen.bind(this);
        this.ws.onclose = this.onSocketClose.bind(this);
        this.ws.onerror = this.onSocketError.bind(this);
        this.ws.onmessage = this.onSocketMessage.bind(this);
        
        const url = this.state.host + "/question"
        try {
            const currentQuestionResult = await axios.get(url);
            console.log("Received current question: ", currentQuestionResult);
            console.log("GET - question id: ", currentQuestionResult.data.id)
            
            let newState = this.state;
            newState.current_question = this.parseQuestionData(currentQuestionResult);
            this.setState(newState)
        } catch (err) {
            console.error(err);
        }
    }

    async handleSubmit(event) {
        event.preventDefault();

        const questionData = {
            id: -1,
            title: this.state.title,
            answer_a: this.state.answer_a,
            answer_b: this.state.answer_b,
            answer_c: this.state.answer_c,
            answer_d: this.state.answer_d,
            activateNow: this.state.activate
        }

        try {
            const result = await axios.post(this.state.host + "/question", JSON.stringify(questionData))

            let newState = this.state;
            newState.current_question = this.parseQuestionData(result);
            console.log("Received new question:", newState);
            console.log("POST - question id: ", newState.current_question.id)
            newState.error = null;
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


    onSocketOpen(evt) {
        console.log("Connected with websocket: listening for votes");
    }

    onSocketClose(evt) {
        console.log("Websocket closed");
    }

    onSocketError(evt) {
        console.error(evt);
    }

    onSocketMessage(evt) {
        const result = JSON.parse(evt.data);
        console.log("Received vote: ", result)

        console.log("Current Question ID: ", this.state.current_question.id)

        if (this.state.current_question.id == result.question_id) {
            let newState = this.state;

            if (result.vote == 0) {
                newState.current_question.votes_a += 1;
            }
            if (result.vote == 1) {
                newState.current_question.votes_b += 1;
            }
            if (result.vote == 2) {
                newState.current_question.votes_c += 1;
            }
            if (result.vote == 3) {
                newState.current_question.votes_d += 1;
            }

            this.setState(newState);
        } else {
            console.log("Received vote for wrong question. Current id: ", this.state.current_question.id, "voted for question id:", result.question_id);
        }
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

                        <button>Presenteer</button>
                    </form>
                    
                    <span>{this.state.status}</span>
                    <span>{this.state.error}</span>
              </TabPanel>
              <TabPanel>
                <div>
                    <h3>{this.state.current_question.title}</h3>
                </div>
                <div>
                <table align="center">
                    <tbody>
                    <tr>
                        <td width="100px">{this.state.current_question.votes_a}</td>
                        <td>{this.state.current_question.answer_a}</td>
                    </tr>
                    <tr>
                        <td>{this.state.current_question.votes_b}</td>
                        <td>{this.state.current_question.answer_b}</td>
                    </tr>
                    <tr>
                        <td>{this.state.current_question.votes_c}</td>
                        <td>{this.state.current_question.answer_c}</td>
                    </tr>
                    <tr>
                        <td>{this.state.current_question.votes_d}</td>
                        <td>{this.state.current_question.answer_d}</td>
                    </tr>
                    </tbody>
                </table>
                </div>
              </TabPanel>
            </Tabs>
            </header>
            </div>
        );
    }
}

export default QuizMaster;
