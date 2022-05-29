import logo from './logo.svg';
import './LoginForm.css';
import React from "react"

class LoginForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
          user: '',
          password: '', 
          register: props.register, 
          onSubmit: props.onSubmit}

        this.handleUserChange = this.handleUserChange.bind(this);
        this.handlePasswordChange = this.handlePasswordChange.bind(this)
        this.handleSubmit = this.handleSubmit.bind(this);
    }

  
  async handleSubmit(event) {
    if (this.state.re)
    this.state.onSubmit({username: this.state.user, password: this.state.password})
    event.preventDefault();
  }

  handleUserChange(event) {
    let prevState = this.state;
    prevState.user = event.target.value;
    this.setState(prevState);
  }

  handlePasswordChange(event) {
    let prevState = this.state;
    prevState.password = event.target.value;
    this.setState(prevState)
  }

  render() {
    return (
      <div>
        <img src={logo} className="App-logo" alt="logo" />
        <form onSubmit={this.handleSubmit}>
          <p>Speel mee met de quiz</p>
          <input onChange={this.handleUserChange}
            type="text"
            placeholder="Wat is uw naam?"
            value={this.state.user} />

            {<input onChange={this.handlePasswordChange}
              type="password"
              placeholder="Wat is uw wachtwoord?"
              value={this.state.password}
            />}

           <button type="submit">Speel mee</button>
        </form>
      </div>
    );
  }
}

export default LoginForm;
