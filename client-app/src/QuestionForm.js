import './QuestionForm.css';
import React from "react"


class QuestionForm extends React.Component {
  constructor(props) {
    super(props);

    console.log(props.question)
    this.state = props.data;

    this.submitVote = props.submitVote;
    this.logout = props.logout;
  }
  
  componentWillReceiveProps(nextProps, nextContext) {
    this.setState(nextProps.data);
  }

  render() {
    if (this.state.question_id) {
      return (
        <div>
            <p>Hallo {this.state.user}</p>
            <div className="answers">
              <p>{this.state.question_title}</p>
              <button className="answer1" onClick={() => this.submitVote(0)}>{this.state.question_answer_a}</button>
              <button className="answer2" onClick={() => this.submitVote(1)}>{this.state.question_answer_b}</button>
              <button className="answer3" onClick={() => this.submitVote(2)}>{this.state.question_answer_c}</button>
              <button className="answer4" onClick={() => this.submitVote(3)}>{this.state.question_answer_d}</button>
            </div>

            <button onClick={this.logout}>Uitloggen</button>
        </div>);
    } else {
      return (
        <div>
            <p>Hallo {this.state.user}</p>
            <p>Wacht a.u.b. op de volgende vraag</p>
            <button onClick={this.logout}>Uitloggen</button>
        </div>);
    }
  }
}

export default QuestionForm;
