import logo from './logo.svg';
import './QuestionForm.css';
import React from "react"

class QuestionForm extends React.Component {
  constructor(props) {
      super(props);
      this.state = {value: '', user: props.user}

      this.submitAnswer = this.submitAnswer.bind(this);
  }

  
  submitAnswer(answer) {
    console.log("An answer was submitted: " + answer)
    // this.setState({redirect: "Question.js"});
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <p>Hallo {this.state.user}</p>
          <div className="answers">
            <p>Wie is de oudste persoon op aarde?</p>
            <button className="answer1" onClick={() => this.submitAnswer("A")}>Tarzan</button>
            <button className="answer2" onClick={() => this.submitAnswer("B")}>Tarzan</button>
            <button className="answer3" onClick={() => this.submitAnswer("C")}>Tarzan</button>
            <button className="answer4" onClick={() => this.submitAnswer("D")}>Tarzan</button>
          </div>

          <p>Vraag verloopt over 5 seconden</p>
        </header>
      </div>
    );
  }
}

export default QuestionForm;
