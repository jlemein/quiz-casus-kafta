import { createSlice } from '@reduxjs/toolkit'

const initialState = {
    user: "",
    isAuthenticated: false,
    token: null,
};

export const authenticationSlice = createSlice({
  name: 'authentication',
  initialState,
  reducers: {
    setAuthenticatedUser: (state, action) => {
        state.user = action.payload
    },
    setAuthenticated: (state, action) => {
      state.isAuthenticated = action.payload
    }
  },
})

// Action creators are generated for each case reducer function
export const {setAuthenticatedUser, setAuthenticated} = authenticationSlice.actions

// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state: RootState) => state.counter.value)`
export const selectAuthenticatedUser = (state) => {
    return state.authentication.user;
}

export const isAuthenticated = (state) => {
  return state.authentication.isAuthenticated;
}

export default authenticationSlice.reducer