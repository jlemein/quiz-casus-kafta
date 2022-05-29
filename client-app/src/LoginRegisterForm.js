import React, {useState} from "react"
import { useDispatch } from 'react-redux';
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

    try {
      // Reset the error message
      setValue({...value, errorMessage: null})

      const result = await axios.post(process.env.REACT_APP_HTTP_API_LOGIN_URL, JSON.stringify({
        username: value.username,
        password: value.password
      }));

      dispatch(setAuthenticatedUser(value.username))
      dispatch(setAuthenticated(true))

      console.log("Logged in with access token: ", result.data.access_token);
    } 
    catch(err) {
      setValue({...value, errorMessage: err.response.data.error})

      dispatch(setAuthenticatedUser(null))
      dispatch(setAuthenticated(false))
    }
  }

  const register = async e => {
    e.preventDefault()
    console.log("Register: ", value.username, value.password);

    try {
      // Reset the error message
      setValue({...value, errorMessage: null})

      const result = await axios.post(process.env.REACT_APP_HTTP_API_REGISTER_URL, JSON.stringify({
        username: value.username,
        password: value.password
      }));

      dispatch(setAuthenticatedUser(value.username))
      dispatch(setAuthenticated(true))
    
      console.log("Registered with access token: ", result.data.access_token);
      // localStorage.setItem('token', newState.access_token);
      // localStorage.setItem('user', newState.user)

      // Logged in, now connect to websocket
      // console.log("Connecting with websocket:", this.state.wsUri);
      // this.openWebsocketConnection()
    }
    catch (err) {
      setValue({...value, errorMessage: err.response.data.error})

      dispatch(setAuthenticatedUser(null))
      dispatch(setAuthenticated(false))
    }

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
          <button type="submit" onClick={register}>Registreer</button>
         </div>
      </form>
    </div>
  );
}

export default LoginRegisterForm;
