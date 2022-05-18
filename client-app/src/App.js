import logo from './logo.svg';
import './QuestionForm.css';
import React from "react"
import LoginForm from "./LoginForm"
import QuestionForm from "./QuestionForm"
import axios from 'axios';

class App extends React.Component {
  constructor(props) {
      super(props);
      this.state = {
        value: '', 
        user: null, 
        token: null,
        error: null
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
      console.log("Result: ", result);

      this.setState({token: "ABC"})

    } catch (err) {
      let prevState = this.state;
      prevState.error = err.message;
      this.setState(prevState);
      console.error("THER ERROR IS: ", err.message);
    }
    
    // this.setState({redirect: "Question.js"});
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

export default App;
