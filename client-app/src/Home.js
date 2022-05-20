import logo from './logo.svg';
import './Home.css';
import React from "react"
import LoginForm from "./LoginForm"
import QuestionForm from "./QuestionForm"
import axios from 'axios';

class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: '',
      user: null,
      token: null,
      error: null,
      wsUri: props.wsUri
    }

    // this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  async handleSubmit(name) {
    const data = {
      username: name,
      password: "No password"
    }

    // const requestOptions = {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ name: this.state.value })
    // }

    try {
      const result = await axios.post('http://localhost:8080/register', JSON.stringify(data))
      const newState = this.state;
      newState.error = null;
      newState.token = result.data.access_token;
      this.setState(newState);

      console.log("Logged in with access token: ", newState.token);

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

    // this.setState({redirect: "Question.js"});
  }

  onSocketOpen(evt) {
    console.log("Connection opened");
  }

  onSocketMessage(evt) {
    // const json = JSON.parse(evt.data);
    console.log(`[message] Data received from server: ${evt.data}`);

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
          {el}
          <span>{this.state.error}</span>
        </header>
      </div>
    )
  }
}

export default Home;
