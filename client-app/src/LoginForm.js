import logo from './logo.svg';
import './LoginForm.css';
import React from "react"

class LoginForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = {value: '', onSubmit: props.onSubmit}

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

  
  async handleSubmit(event) {
    this.state.onSubmit(this.state.value)
    event.preventDefault();
  }

  handleChange(event) {
    this.setState({value: event.target.value});
  }


  render() {
    return (
      <div>
        <img src={logo} className="App-logo" alt="logo" />
        <form onSubmit={this.handleSubmit}>
          <p>Speel mee met de quiz</p>
          <input onChange={this.handleChange}
            type="text"
            placeholder="Wat is uw naam?"
            value={this.state.value} />

           <button type="submit">Speel mee</button>
        </form>
      </div>
    );
  }
}

export default LoginForm;
