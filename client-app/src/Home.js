import logo from './logo.svg';
import './Home.css';
import React from "react"
import LoginForm from "./LoginForm"
import QuestionForm from "./QuestionForm"
import axios from 'axios';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
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

    // this.handleChange = this.handleChange.bind(this);
    this.onLogin = this.onLogin.bind(this);
    this.onRegister = this.onRegister.bind(this);

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

  async onLogin(user) {
    const data = {
      username: user.username,
      password: user.password
    }

    console.log("Receiving login call: ", user)
    try {
      const result = await axios.post(process.env.REACT_APP_HTTP_API_LOGIN_URL, JSON.stringify(data))

      let newState = this.state;
      newState.error = null;
      newState.access_token = result.data.access_token;
      newState.user = user.username;
      this.setState(newState);

      console.log("Logged in with access token: ", newState.access_token);
      localStorage.setItem("token", result.data.access_token)
      localStorage.setItem('user', user.username)
    } 
    catch(err) {
      let prevState = this.state;
      console.log(err)

      let errorMessage = err.response.data.error;
      prevState.error = errorMessage;

      this.setState(prevState);
    }


  }

  async onRegister(user) {
    console.log("Receiving register call: ", user)

    const data = {
      username: user.username,
      password: user.password
    }
    

    try {
      const result = await axios.post(process.env.REACT_APP_HTTP_API_REGISTER_URL, JSON.stringify(data))
      console.log("RRR", result)
      const newState = this.state;
      newState.error = null;
      newState.access_token = result.data.access_token;
      newState.user = user.username;
      this.setState(newState);

      console.log("Logged in with access token: ", newState.access_token);
      localStorage.setItem('token', newState.access_token);
      localStorage.setItem('user', newState.user)

      // Logged in, now connect to websocket
      console.log("Connecting with websocket:", this.state.wsUri);
      this.openWebsocketConnection()
    }
    catch (err) {
      let prevState = this.state;
      console.log(err)

      let errorMessage = err.response.data.error;
      prevState.error = errorMessage;

      this.setState(prevState);
      console.error(err.message);
    }
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
