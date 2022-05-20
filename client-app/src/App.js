import logo from './logo.svg';
import './App.css';
import React from "react"
import Main from "./Main"
import { Navbar } from 'react-bootstrap'

class App extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="App">
        <Navbar />
        <Main />
      </div>
    )
  }
}

export default App;
