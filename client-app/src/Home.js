import logo from './logo.svg';
import './Home.css';
import React from "react"
import LoginForm from "./LoginForm"
import QuestionForm from "./QuestionForm"
import axios from 'axios';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';

class Home extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      value: '',
      user: null,
      access_token: localStorage.getItem('quiz_token'),
      error: null,
      wsUri: props.wsUri,
      question_id: null,
      question_title: "Waiting for question",
      question_answer_a: "A",
      question_answer_b: "B",
      question_answer_c: "C",
      question_answer_d: "D",
    }

    // this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.logout = this.logout.bind(this);
    this.submitVote = this.submitVote.bind(this);
  }

  async handleSubmit(name) {
    const data = {
      username: name,
      password: "No password"
    }

    try {
      const result = await axios.post('http://localhost:8080/register', JSON.stringify(data))
      const newState = this.state;
      newState.error = null;
      newState.access_token = result.data.access_token;
      newState.user = name;
      this.setState(newState);

      console.log("Logged in with access token: ", newState.access_token);
      localStorage.setItem('quiz_token', newState.access_token);

      // Logged in, now connect to websocket
      console.log("Connecting with websocket:", this.state.wsUri);
      this.socket = new WebSocket(this.state.wsUri);
      this.socket.onopen = this.onSocketOpen.bind(this);
      this.socket.onclose = this.onSocketClose.bind(this);
      this.socket.onerror = this.onSocketError.bind(this);
      this.socket.onmessage = this.onSocketMessage.bind(this);
    }
    catch (err) {
      let prevState = this.state;
      prevState.error = err.message;
      this.setState(prevState);
      console.error(err.message);
    }
  }

  async submitVote (answer) {
      try {
        const vote = {user: this.state.user, question_id: -1, vote: answer};
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

    let prevState = this.state;
    prevState.question_id = result.id;
    prevState.question_title = result.title;
    prevState.question_answer_a = result.answer_a;
    prevState.question_answer_b = result.answer_b;
    prevState.question_answer_c = result.answer_c;
    prevState.question_answer_d = result.answer_d;
    this.setState(prevState);

    console.log("Setting state:", prevState)
    // this.setState(prevState)


    // try {
    //   if ((json.event = "data")) {
    //     console.log(json.data);
    //   }
    // } catch (err) {
    //   console.err(err);
    // }
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
    localStorage.removeItem('quiz_token', null);
    this.setState({access_token: null});
  }

  render() {
    let el;

    console.log("user:", this.state.user)

    if (this.state.access_token) {
      el = (<QuestionForm data={this.state}
                logout = {this.logout}
                submitVote = {this.submitVote}
              />);
    } else {
      el = <Tabs>
              <TabList>
                <Tab>Login</Tab>
                <Tab>Registreer</Tab>
              </TabList>
          
              <TabPanel>
                <LoginForm onSubmit={this.handleSubmit} register={true} />
              </TabPanel>
              <TabPanel>
                <LoginForm onSubmit={this.handleSubmit} />
              </TabPanel>
            </Tabs>;
    }

    return (
      <div className="App">
        <span>Code: {this.state.question_title}</span>
        <header className="App-header">
          {el}
          <span>{this.state.error}</span>
        </header>
      </div>
    )
  }
}

export default Home;
