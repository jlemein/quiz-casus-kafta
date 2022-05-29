import logo from './logo.svg';
import './App.css';
import React from "react"
import { Navbar, Nav, NavDropdown, Container } from 'react-bootstrap'
import { Routes, Route } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';

import Home from './Home';
import QuizMaster from './QuizMaster';
import {
  selectAuthenticatedUser,
  isAuthenticated,
} from './features/authentication/authenticationSlice';


export function App() {
  const user = useSelector(selectAuthenticatedUser);
  const authenticated = useSelector(isAuthenticated);

  return (
    <div className="App">
      <Navbar bg="light" expand="sm">
      <Container>
        <Navbar.Brand href="#home">Surfie</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse className="justify-content-end">
    <Navbar.Text>
      {authenticated ? "Ingelogd: " : "Niet ingelogd"}
      <a href="#login">{user}</a>
    </Navbar.Text>
  </Navbar.Collapse>
        {/* <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link href="#home">Home</Nav.Link>
            <Nav.Link href="#link">Link</Nav.Link>
            <NavDropdown title="Dropdown" id="basic-nav-dropdown">
              <NavDropdown.Item href="#action/3.1">Action</NavDropdown.Item>
              <NavDropdown.Item href="#action/3.2">Another action</NavDropdown.Item>
              <NavDropdown.Item href="#action/3.3">Something</NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item href="#action/3.4">Separated link</NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse> */}
      </Container>  
      </Navbar>
      <Routes> {/* The Switch decides which component to show based on the current URL.*/}
          <Route exact path='/' element={<Home />}></Route>
          <Route exact path='/quizmaster' element={<QuizMaster />}></Route>
      </Routes>
    </div>
  )
}

export default App;
