import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import AuthLayout from './auth/AuthLayout.jsx'
import store from "./store/store.js"
import { Provider } from "react-redux"

import {NotFoundPage , Login, Dashboard} from './pages/index.js'

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
        path: "/",
        element:
        <AuthLayout authentication>
           <Dashboard />
         </AuthLayout>,
      },
      // {
      //   path: "/promoters",
      //   element: 
      //   <AuthLayout authentication>
      //     {" "}
      //     <PromotersPage />
      //    </AuthLayout>, 
      // },
    ],
    errorElement: <NotFoundPage />
  },
]);

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <RouterProvider router={router} />
  </Provider>
);