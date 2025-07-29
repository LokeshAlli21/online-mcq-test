import { createSlice } from "@reduxjs/toolkit"

const initialState = {
    status: null,
    userData: null,
}

export const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        login: (state, action) => {
            // console.log('data got successfully: ');
            // console.log(action);
            
            state.status = true
            state.userData = action.payload
            console.log("redux got updated", state.status);
            // console.log("see current state: ");
            // console.log("state.status : ",state.status);
            // console.log("state.userData : ",state.userData);
            
        },
        logout: (state, action) => {
            state.status = false
            state.userData = null
            // console.log("see current state: ");
            // console.log("state.status : ",state.status);
            // console.log("state.userData : ",state.userData);
        }
    }
})

export const {login, logout} = authSlice.actions

export default authSlice.reducer