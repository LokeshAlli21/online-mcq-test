import React from 'react'
import { useSelector } from 'react-redux';

function StudentPage() {
  const userData = useSelector((state) => state.auth.userData);
  return (
    <div>StudentPage</div>
  )
}

export default StudentPage