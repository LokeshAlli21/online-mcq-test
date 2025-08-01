import React, { use, useEffect } from 'react'
import { useSelector } from 'react-redux';
import {StudentPage, AdminPage} from './index.js'

function Dashboard() {
  
  const userData = useSelector((state) => state.auth.userData);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      {userData?.user_type === 'admin' ? (
        <AdminPage />
      ) : userData?.user_type === 'student' ? (
        <StudentPage />
      ) : (
        <div className="text-center">
          <h1 className="text-2xl font-bold">Welcome to the Dashboard</h1>
          <p className="mt-4">Please select your role to proceed.</p>
        </div>
      )}
    </div>
  )

}

export default Dashboard