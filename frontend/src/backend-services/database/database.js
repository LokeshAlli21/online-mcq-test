import env from '../../env/env';
import { toast } from "react-toastify";
import {authenticatedFetch} from '../fetchWrapper';

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

  async getInstituteOptions() {
    try {
      const response = await authenticatedFetch(`${this.baseUrl}/api/institute-options/get`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });
      return this.handleResponse(response);
    } catch (error) {
      console.error("Error fetching institute options:", error);
      throw error;
    }
  }

  async getAllExams() {
    try {
      const response = await authenticatedFetch(`${this.baseUrl}/api/exams/admin/get-all-exams`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });
      return this.handleResponse(response);
    } catch (error) {
      console.error("Error fetching all exams:", error);
      throw error;
    }
  }

  
  async getCategories() {
    try {
      const response = await authenticatedFetch(`${this.baseUrl}/api/exams/admin/get-all-categories`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });
      return this.handleResponse(response);
    } catch (error) {
      console.error("Error fetching categories:", error);
      throw error;
    }
  }

  async createCategory(data) {
    try {
      const response = await authenticatedFetch(`${this.baseUrl}/api/exams/admin/create-category`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return this.handleResponse(response);
    } catch (error) {
      console.error("Error creating category:", error);
      throw error;
    }
  }

  async createExam(data) {
    try {
      const response = await authenticatedFetch(`${this.baseUrl}/api/exams/admin/create-exam`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return this.handleResponse(response);
    } catch (error) {
      console.error("Error creating exam:", error);
      throw error;
    }
  }

  async updateExam(id, data) {
    try {
      const response = await authenticatedFetch(`${this.baseUrl}/api/exams/admin/update-exam/${id}`, {
        method: "PUT",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return this.handleResponse(response);
    } catch (error) {
      console.error("Error updating exam:", error);
      throw error;
    }
  }

  async deleteExam(id) {
    try {
      const response = await authenticatedFetch(`${this.baseUrl}/api/exams/admin/delete-exam/${id}`, {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      });
      return this.handleResponse(response);
    } catch (error) {
      console.error("Error deleting exam:", error);
      throw error;
    }
  }

  async addNewQuestion(data) {
    try {
      const response = await authenticatedFetch(`${this.baseUrl}/api/exams/admin/add-new-question`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return this.handleResponse(response);
    } catch (error) {
      console.error("Error adding new question:", error);
      throw error;
    }
  }

  async updateQuestion(id, data) {
    try {
      const response = await authenticatedFetch(`${this.baseUrl}/api/exams/admin/update-question/${id}`, {
        method: "PUT",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return this.handleResponse(response);
    } catch (error) {
      console.error("Error updating question:", error);
      throw error;
    }
  }

  async deleteQuestion(id) {
    try {
      const response = await authenticatedFetch(`${this.baseUrl}/api/exams/admin/delete-question/${id}`, {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      });
      return this.handleResponse(response);
    } catch (error) {
      console.error("Error deleting question:", error);
      throw error;
    }
  }

  async getQuestionsByTestId(testId) {
    try {
      const response = await authenticatedFetch(`${this.baseUrl}/api/exams/admin/get-questions-by-test-id/${testId}?include_answers=true`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });
      return this.handleResponse(response);
    } catch (error) {
      console.error("Error fetching questions by test ID:", error);
      throw error;
    }
  }

  async getExamById(examId) {
    try {
      const response = await authenticatedFetch(`${this.baseUrl}/api/exams/admin/get-exam-by-id/${examId}`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });
      return this.handleResponse(response);
    } catch (error) {
      console.error("Error fetching exam by ID:", error);
      throw error;
    }
  }

  async getAllStudentExams(studentId) {
    try {
      const response = await authenticatedFetch(`${this.baseUrl}/api/exams/get-all-student-exams/${studentId}`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });
      return this.handleResponse(response);
    } catch (error) {
      console.error("Error fetching student exams:", error);
      throw error;
    }
  }
  
  async getAllStudentExamAttempts(studentId) {
    try {
      const response = await authenticatedFetch(`${this.baseUrl}/api/exams/get-all-student-exam-attempts/${studentId}`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });
      return this.handleResponse(response);
    } catch (error) {
      console.error("Error fetching student exam attempts:", error);
      throw error;
    }
  }
  
}

const databaseService = new DatabaseService();
export default databaseService;