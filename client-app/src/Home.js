import './Home.css';
import React from "react"
import QuestionForm from "./QuestionForm"
// import axios from 'axios';
// import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import LoginRegisterForm from './LoginRegisterForm';

class Home extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      value: '',
      user: localStorage.getItem('user'),
      access_token: localStorage.getItem('quiz_token'),
      error: null,
      wsUri: process.env.REACT_APP_WS_API_URL + "/ws",
      question_id: null,
      question_title: "Waiting for question",
      question_answer_a: "A",
      question_answer_b: "B",
      question_answer_c: "C",
      question_answer_d: "D",
    }

    this.logout = this.logout.bind(this);
    this.submitVote = this.submitVote.bind(this);

    if (this.state.access_token) {
      this.openWebsocketConnection()
    }
  }

  openWebsocketConnection() {
    this.socket = new WebSocket(this.state.wsUri);
      this.socket.onopen = this.onSocketOpen.bind(this);
      this.socket.onclose = this.onSocketClose.bind(this);
      this.socket.onerror = this.onSocketError.bind(this);
      this.socket.onmessage = this.onSocketMessage.bind(this);
  }

  async submitVote (answer) {
      try {
        const vote = {user: this.state.user, question_id: this.state.question_id, vote: answer};
        console.log("Submitting vote", vote);
        await this.socket.send(JSON.stringify(vote));
        console.log("Vote submitted")
      } catch (err) {
        console.error("Voting failed: ", err)
      }
  }

  onSocketOpen(evt) {
    console.log("Connection opened");
  }

  onSocketMessage(evt) {
    const result = JSON.parse(evt.data);
    console.log("Message: ", result)

    let prevState = this.state;// JSON.parse(JSON.stringify(this.state));
    prevState.question_id = result.id;
    prevState.question_title = result.title;
    prevState.question_answer_a = result.answer_a;
    prevState.question_answer_b = result.answer_b;
    prevState.question_answer_c = result.answer_c;
    prevState.question_answer_d = result.answer_d;
    this.setState(prevState);

    console.log("Setting state:", prevState)

    console.log("New question title:", this.state.question_title)
  }

  onSocketError(evt) {
    console.error(evt);
  }

  onSocketClose(evt) {
    console.log("Connection closed");

    if (evt.code !== 1000) {
      // Connection is not closed normally
      if (!navigator.onLine) {
        let prevState = this.state;
        prevState.errorMessage = "Je bent offline. Verbind a.u.b. opnieuw met het internet";
        this.setState(prevState);
      }
    }
  }

  logout() {
    console.log("Logout")
    // axios.post("/logout")
    localStorage.clear()
    this.setState({access_token: null});
    window.location.href = "/";
    this.socket.close()
  }

  render() {
    let el;

    if (this.state.access_token) {
      el = (<QuestionForm data={this.state}
                logout = {this.logout}
                submitVote = {this.submitVote}
              />);
    } else {
      el = <LoginRegisterForm />
    }

    return (
      <div className="App">
        <header className="App-header">
          {el}
          <span>{this.state.error}</span>
        </header>
      </div>
    )
  }
}

export default Home;
