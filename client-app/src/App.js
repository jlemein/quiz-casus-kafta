import logo from './logo.svg';
import './QuestionForm.css';
import React from "react"
import LoginForm from "./LoginForm"
import QuestionForm from "./QuestionForm"

class App extends React.Component {
  constructor(props) {
      super(props);
      this.state = {
        value: '', 
        user: null, 
        accessToken: null
      }

      // this.handleChange = this.handleChange.bind(this);
      this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleSubmit(name) {
    console.log("Received name in parent component: " + name);
    this.setState({user: name})
  }

  render() {
    if (this.state.user) {
      return (<QuestionForm user={this.state.user} accessToken={this.state.accessToken} />)
    } else {
      return (<LoginForm onSubmit={this.handleSubmit} />)
    };
  }
}

export default App;
