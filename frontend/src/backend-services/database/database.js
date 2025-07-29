import env from '../../env/env';
import { toast } from "react-toastify";

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

import {authenticatedFetch} from '../fetchWrapper';

dayjs.extend(utc);
dayjs.extend(timezone);

class DatabaseService {
  constructor() {
    this.baseUrl = env.backendUrl;
  }

  // ✅ Utility to get token
  getAuthHeaders(skipContentType = false) {
    const token = localStorage.getItem('authToken');
    const headers = {
      Authorization: `Bearer ${token}`,
    };
    if (!skipContentType) {
      headers["Content-Type"] = "application/json";
    }
    return headers;
  }
  
  

  // ✅ Utility to handle responses globally
  async handleResponse(response) {
    const data = await response.json();

    if (response.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('authTokenForPromoter');
      toast("Session expired. Please log in again.");
      window.location.href = "/login"; // or use `navigate()` from router
    }

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }
    return data;
  }
  
}

const databaseService = new DatabaseService();
export default databaseService;