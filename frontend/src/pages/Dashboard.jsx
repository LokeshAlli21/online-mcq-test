import React, { use, useEffect } from 'react'
import { useSelector } from 'react-redux';
import {StudentPage, AdminPage} from './index.js'

function Dashboard() {
  
  const userData = useSelector((state) => state.auth.userData);

  if(userData?.user_type === 'admin') {
    return <AdminPage />
  }
  if(userData?.user_type === 'student') {
    return <StudentPage />
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Welcome to the Dashboard</h1>
          <p className="mt-4">Please select your role to proceed.</p>
        </div>
    </div>
  )

}

export default Dashboard