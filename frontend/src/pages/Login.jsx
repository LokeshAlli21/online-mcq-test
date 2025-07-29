import React, { useEffect, useState, useCallback } from 'react';
import { Eye, EyeOff, Mail, Phone, Lock, Loader2, BookOpen, Trophy, Users, CheckCircle } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login } from '../store/authSlice';
import authService from '../backend-services/auth/auth'
import { toast } from 'react-toastify';

const Login = () => {

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    emailOrPhone: '',
    password: ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [inputType, setInputType] = useState('email'); // 'email' or 'phone'

  // Email validation
  const validateEmail = useCallback((email) => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
  }, []);

  // Phone validation
  const validatePhone = useCallback((phone) => {
    // Remove all non-digit characters for validation
    const cleanPhone = phone.replace(/\D/g, '');
    // Accept 10-15 digits (covers most international formats)
    return cleanPhone.length >= 10 && cleanPhone.length <= 15;
  }, []);

  // Detect input type based on content
  const detectInputType = useCallback((value) => {
    const trimmedValue = value.trim();
    
    // If it contains @ symbol, likely email
    if (trimmedValue.includes('@')) {
      return 'email';
    }
    
    // If it starts with + or contains only digits/spaces/dashes/parentheses, likely phone
    const phonePattern = /^[\+]?[\d\s\-\(\)]+$/;
    if (phonePattern.test(trimmedValue) || trimmedValue.startsWith('+')) {
      return 'phone';
    }
    
    // Default to email if unclear
    return 'email';
  }, []);

  // Form validation
  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.emailOrPhone.trim()) {
      newErrors.emailOrPhone = 'Email or phone number is required';
    } else {
      const currentInputType = detectInputType(formData.emailOrPhone);
      
      if (currentInputType === 'email') {
        if (!validateEmail(formData.emailOrPhone)) {
          newErrors.emailOrPhone = 'Please enter a valid email address';
        }
      } else {
        if (!validatePhone(formData.emailOrPhone)) {
          newErrors.emailOrPhone = 'Please enter a valid phone number (10-15 digits)';
        }
      }
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, validateEmail, validatePhone, detectInputType]);

  // Handle input changes
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Update input type detection for emailOrPhone field
    if (name === 'emailOrPhone') {
      const detectedType = detectInputType(value);
      setInputType(detectedType);
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  }, [errors, detectInputType]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);

    try {

      const response = await authService.login(formData);
      
      if (response?.user) {
        dispatch(login(response.user));
        toast.success('🎉 Welcome back!');
        navigate('/', { replace: true });
      }

      console.log('Login successful with:', formData);
      
      // Reset form
      setFormData({ emailOrPhone: '', password: '' });
    } catch (error) {
      const errorMessage = error?.response?.data?.message || 'Invalid credentials. Please try again.';
      toast.error(`🚫 ${errorMessage}`);
      alert('🚫 Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-purple-200 rounded-full opacity-20 animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-20 w-16 h-16 bg-indigo-200 rounded-full opacity-20 animate-pulse delay-500"></div>
      
      <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-12 items-center relative z-10">
        
        {/* Left Side - Branding & Features */}
        <div className="hidden lg:block space-y-8">
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  MCQ Test
                </h1>
                <p className="text-gray-500 text-sm">Test Your Knowledge</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-4xl font-bold text-gray-900 leading-tight">
                Welcome back to your
                <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  learning journey
                </span>
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Continue mastering your skills with our comprehensive MCQ tests. 
                Track your progress and achieve excellence.
              </p>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 gap-4">
            {[
              { icon: Trophy, title: "Track Progress", desc: "Monitor your performance and improvement over time" },
              { icon: Users, title: "Compete Globally", desc: "Join thousands of learners worldwide" },
              { icon: CheckCircle, title: "Instant Results", desc: "Get immediate feedback on your answers" }
            ].map((feature, index) => (
              <div key={index} className="flex items-start space-x-4 p-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/20 hover:bg-white/70 transition-all duration-300 group">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full max-w-md mx-auto lg:mx-0">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 lg:p-10">
            
            {/* Mobile Header */}
            <div className="lg:hidden text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                MCQ Master
              </h1>
              <p className="text-gray-500 text-sm mt-1">Test Your Knowledge</p>
            </div>

            <div className="space-y-6">
              <div className="text-center lg:text-left">
                <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                  Welcome back
                </h2>
                <p className="text-gray-600">
                  Sign in to continue your learning journey
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-sm text-blue-800">
                    <span className="font-medium">Demo credentials:</span> any email/phone & password (6+ chars)
                  </div>
                </div>
              </div>

              <div onSubmit={handleSubmit} className="space-y-6">
                {/* Email/Phone Field */}
                <div className="space-y-2">
                  <label htmlFor="emailOrPhone" className="block text-sm font-semibold text-gray-700">
                    Email Address / Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      {inputType === 'email' ? (
                        <Mail className={`w-5 h-5 transition-colors ${errors.emailOrPhone ? 'text-red-400' : 'text-gray-400'}`} />
                      ) : (
                        <Phone className={`w-5 h-5 transition-colors ${errors.emailOrPhone ? 'text-red-400' : 'text-gray-400'}`} />
                      )}
                    </div>
                    <input
                      id="emailOrPhone"
                      name="emailOrPhone"
                      type={inputType === 'email' ? 'email' : 'tel'}
                      value={formData.emailOrPhone}
                      onChange={handleInputChange}
                      className={`w-full pl-12 pr-4 py-4 bg-gray-50 border-2 rounded-2xl focus:outline-none focus:ring-0 transition-all duration-200 text-gray-900 placeholder-gray-500 ${
                        errors.emailOrPhone 
                          ? 'border-red-300 focus:border-red-500 bg-red-50' 
                          : 'border-gray-200 focus:border-blue-500 focus:bg-white'
                      }`}
                      placeholder={inputType === 'email' ? 'Enter your email address' : 'Enter your phone number'}
                      disabled={loading}
                    />
                    {/* Input type indicator */}
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                      <span className={`text-xs px-2 py-1 rounded-full transition-all duration-200 ${
                        inputType === 'email' 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'bg-green-100 text-green-600'
                      }`}>
                        {inputType === 'email' ? 'Email' : 'Phone'}
                      </span>
                    </div>
                  </div>
                  {errors.emailOrPhone && (
                    <p className="text-red-500 text-sm flex items-center space-x-1 animate-fade-in">
                      <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                      <span>{errors.emailOrPhone}</span>
                    </p>
                  )}
                  {/* Format hints */}
                  {formData.emailOrPhone && !errors.emailOrPhone && (
                    <div className="text-xs text-gray-500 pl-1">
                      {inputType === 'email' 
                        ? '✓ Email format detected' 
                        : '✓ Phone number format detected'
                      }
                    </div>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className={`w-5 h-5 transition-colors ${errors.password ? 'text-red-400' : 'text-gray-400'}`} />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`w-full pl-12 pr-12 py-4 bg-gray-50 border-2 rounded-2xl focus:outline-none focus:ring-0 transition-all duration-200 text-gray-900 placeholder-gray-500 ${
                        errors.password 
                          ? 'border-red-300 focus:border-red-500 bg-red-50' 
                          : 'border-gray-200 focus:border-blue-500 focus:bg-white'
                      }`}
                      placeholder="Enter your password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                      disabled={loading}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-sm flex items-center space-x-1 animate-fade-in">
                      <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                      <span>{errors.password}</span>
                    </p>
                  )}
                </div>

                {/* Remember Me & Forgot Password */}
                {/* <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center space-x-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 transition-all"
                    />
                    <span className="text-gray-600 group-hover:text-gray-800 transition-colors">
                      Remember me
                    </span>
                  </label>
                  <button
                    type="button"
                    className="text-blue-600 hover:text-blue-800 font-medium transition-colors hover:underline"
                  >
                    Forgot password?
                  </button>
                </div> */}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </div>

              {/* Sign Up Link */}
              <div className="text-center pt-6 border-t border-gray-200">
                <p className="text-gray-600">
                  Don't have an account?{' '}
                  <button onClick={() => navigate('/signup')} className="text-blue-600 hover:text-blue-800 font-semibold transition-colors hover:underline">
                    Sign up here
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .bg-grid-pattern {
          background-image: 
            linear-gradient(90deg, rgba(0,0,0,.03) 1px, transparent 1px),
            linear-gradient(rgba(0,0,0,.03) 1px, transparent 1px);
          background-size: 20px 20px;
        }
        
        .animate-fade-in {
          animation: fadeIn 0.3s ease-in-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @media (max-width: 1024px) {
          .bg-grid-pattern {
            background-size: 15px 15px;
          }
        }
      `}</style>
    </div>
  );
};

export default Login;