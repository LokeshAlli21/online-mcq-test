import env from '../../env/env';
import { toast } from "react-toastify";

class AuthService {
  constructor() {
    this.baseUrl = env.backendUrl;
  }

  // Login User
  async login({ email, password }) {
    if (!email) {
      toast.warn("📧 Email is required to login.");
      console.log("Email is not available for login");
      return;
    }
    if (!password) {
      toast.warn("🔒 Password is required to login.");
      console.log("Password is not available for login");
      return;
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      // console.log("data at login service in auth.js :: data:",data);
      

      if (!response.ok) {
        toast.error("🚫 Invalid credentials. Please try again.");
        throw new Error("Invalid credentials");
      }

      localStorage.removeItem("authTokenForPromoter"); // Clear any previous token for promoter
      localStorage.setItem("authToken", data?.user?.token);
      // toast.success(`Welcome back! Logged in successfully.`);
      return data;

    } catch (error) {
      console.error("AuthService Login Error:", error);
      throw error;
    }
  }

  // Get Current User
  async getCurrentUser() {
    try {
      const token = localStorage.getItem("authToken");
      // console.log('token; ', token);
      
      if (!token) {
        toast.info("You are not logged in. Please log in first.");
        return null;
      }

      const response = await fetch(`${this.baseUrl}/api/auth/user`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      // console.log("called 📢 GET /api/auth/user");
      // console.log(response);
      

      if (!response.ok) {
        if(localStorage.getItem("authToken")) {
          toast("🚫 Session Expired. Please log in again.");
        }
        throw new Error("Unauthorized");
      }

      const data = await response.json()
      // console.log('in getcurrentuser: ',data.user);

      return  data.user

    } catch (error) {
      console.error("AuthService GetUser Error:", error);
      return null;
    }
  }

  // Logout User
  async logout() {
    try {
      localStorage.removeItem("authToken");
      toast.info("👋 Logged out successfully.");
      return { message: "Logged out successfully" };
    } catch (error) {
      console.error("AuthService Logout Error:", error);
      toast.error("🚫 Error while logging out. Try again.");
      throw error;
    }
  }
}

const authService = new AuthService();
export default authService;