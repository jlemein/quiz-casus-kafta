import logo from './logo.svg';
import './QuestionForm.css';
import React from "react"
// import kafka from 'kafka-node'

// class MessageDisplay extends React.Component {

//   getInitialState() {
//     return { messages: [] };
//   }

//   onComponentDidMount() {
//     client = new kafka.KafkaClient();
//     consumer = new kafka.Consumer();
//     producer = new kafka.Producer();

//     consumer.on('message', function (message) {
//       var messageList = this.state.messages;
//       messageList.push(message);
//       this.setState({ message: messageList });
//     }).bind(this);
//   }

//   onComponentWillUnmount() {

//   }

//   render() {
//     var messageList = this.state.messages.map(function (message) {
//       return (<div>id={message.id} etc.</div>);
//     });
//     return (
//       <div className="commentBox">
//         {messageList}
//       </div>
//     );
//   }
// }


class QuestionForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = { value: '', user: props.user, wsUri: "ws://localhost:8080/ws" };

    this.submitAnswer = this.submitAnswer.bind(this);
  }

  componentDidMount() {
    console.log("Trying to connect to websocket");
    this.socket = new WebSocket(this.state.wsUri);
    this.socket.onopen = this.onSocketOpen.bind(this);
    this.socket.onclose = this.onSocketClose.bind(this);
    this.socket.onerror = this.onSocketError.bind(this);
  }

  onSocketOpen(evt) {
    console.log("Connection opened");
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


  submitAnswer(answer) {
    console.log("An answer was submitted: " + answer)
    this.socket.send({user: this.state.user, value: answer});

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
