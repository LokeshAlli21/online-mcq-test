import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import AuthLayout from './auth/AuthLayout.jsx'
import store from "./store/store.js"
import { Provider } from "react-redux"

import {NotFoundPage , Login, Dashboard , SignUp, CreateExam, ManageStudents, AnalyticsPage, AddQuestions, ExamAttempt} from './pages/index.js'

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "/login",
        element: 
        <AuthLayout authentication={false}>
          <Login />
        </AuthLayout>,
      },
      {
        path: "/register",
        element: 
        <AuthLayout authentication={false}>
          <SignUp />
        </AuthLayout>,
      },
      {
        path: "/",
        element:
        <AuthLayout authentication>
           <Dashboard />
         </AuthLayout>,
      },
      {
        path: "/exams/:id/attempt",
        element: 
        <AuthLayout authentication>
          {" "}
          <ExamAttempt />
         </AuthLayout>, 
      },
      {
        path: "/admin/create-exam",
        element: 
        <AuthLayout authentication>
          {" "}
          <CreateExam viewOnly={false} />
         </AuthLayout>, 
      },
      {
        path: "/admin/exam/:id/edit",
        element: 
        <AuthLayout authentication>
          {" "}
          <CreateExam viewOnly={false} />
         </AuthLayout>, 
      },
      {
        path: "/admin/exam/:id/view",
        element: 
        <AuthLayout authentication>
          {" "}
          <CreateExam viewOnly={true} />
         </AuthLayout>, 
      },
      {
        path: "/admin/create-exam/add-questions/:id",
        element: 
        <AuthLayout authentication>
          {" "}
          <AddQuestions />
         </AuthLayout>, 
      },
      {
        path: "/admin/manage-students",
        element:
        <AuthLayout authentication>
          {" "}
          <ManageStudents />
         </AuthLayout>,
      },
      {
        path: "/admin/analytics",
        element: 
        <AuthLayout authentication>
          {" "}
          <AnalyticsPage />
         </AuthLayout>, 
      },
    ],
    errorElement: <NotFoundPage />
  },
]);

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <RouterProvider router={router} />
  </Provider>
);