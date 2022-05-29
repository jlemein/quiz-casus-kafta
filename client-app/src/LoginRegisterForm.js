import React, {useState} from "react"
import { useSelector, useDispatch } from 'react-redux';
import logo from './logo.svg';
import './LoginForm.css';
import {
  setAuthenticatedUser,
  setAuthenticated,
} from './features/authentication/authenticationSlice';
// import {
//   setError,
// } from './features/error/errorSlice';

import axios from "axios";

const LoginRegisterForm = (props) => {
  // const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const [value, setValue] = useState({username: '', password: '', errorMessage: null})

  const login = async e => {
    e.preventDefault()
    console.log("Login:", value)

    try {
      // Reset the error message
      setValue({...value, errorMessage: null})

      const data = {
        username: value.username,
        password: value.password
      };
      console.log(data)

      const result = await axios.post(process.env.REACT_APP_HTTP_API_LOGIN_URL, JSON.stringify(data));

      dispatch(setAuthenticatedUser(value.username))
      dispatch(setAuthenticated(true))

      console.log("Logged in with access token: ", result.access_token);
      // localStorage.setItem("token", result.data.access_token)
      // localStorage.setItem('user', user.username)
    } 
    catch(err) {
      console.log(err)
      setValue({...value, errorMessage: err.response.data.error})

      dispatch(setAuthenticatedUser(null))
      dispatch(setAuthenticated(false))
    }


  }
  const register = e => {
    e.preventDefault()
    console.log("Register: ", value.user, value.password);
  }

  return (
    <div>
      <img src={logo} className="App-logo" alt="logo" />
      <form >
        <p>Speel mee met de quiz</p>
        <input type="text"
          onChange={e => setValue({...value, username: e.target.value})}
          placeholder="Wat is uw naam?"
          value={value.username} />

          {<input type="password"
            onChange={e => setValue({...value, password: e.target.value})}
            placeholder="Wat is uw wachtwoord?"
            value={value.password}
          />}

         <div>
          <button type="submit" onClick={login}>Login</button>
          <button type="submit" onClick={() => register()}>Registreer</button>
         </div>
      </form>
    </div>
  );
}

export default LoginRegisterForm;

// class LoginRegisterForm extends React.Component {
//     constructor(props) {
//         super(props);
//         this.state = {
//           user: '',
//           password: '', 
//           register: props.register, 
//           onSubmit: props.onSubmit}

//         this.handleUserChange = this.handleUserChange.bind(this);
//         this.handlePasswordChange = this.handlePasswordChange.bind(this)
//         this.handleSubmit = this.handleSubmit.bind(this);
//     }

  
//   async handleSubmit(event) {
//     if (this.state.re)
//     this.state.onSubmit({username: this.state.user, password: this.state.password})
//     event.preventDefault();
//   }

//   login() {

//   }

//   register() {
    
//   }

//   handleUserChange(event) {
//     let prevState = this.state;
//     prevState.user = event.target.value;
//     this.setState(prevState);
//   }

//   handlePasswordChange(event) {
//     let prevState = this.state;
//     prevState.password = event.target.value;
//     this.setState(prevState)
//   }

//   render() {

//   }
// }

// export default LoginRegisterForm;
