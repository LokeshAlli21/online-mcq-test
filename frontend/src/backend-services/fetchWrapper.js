// fetchWrapper.js
import store from '../store/store';
import { logout } from '../store/authSlice';

export const authenticatedFetch = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);
    
    // Handle 401 errors (this WILL execute for your backend 401 responses)
    if (response.status === 401) {
      store.dispatch(logout());
      throw new Error('Token expired');
    }
    
    return response;
    
  } catch (error) {
    // Check if it's our manually thrown 'Token expired' error
    if (error.message === 'Token expired') {
      throw error; // Re-throw as is
    }
    
    // Handle network errors (when server is unreachable)
    if (error.name === 'TypeError' || error.message.includes('fetch')) {
      throw new Error('Network error - please check your connection');
    }
    
    // Re-throw any other errors
    throw error;
  }
};