import React, { useEffect } from 'react'
import { useSelector } from 'react-redux';
import { data, useParams } from 'react-router-dom'
import databaseService from '../backend-services/database/database';

function ExamAttempt() {
    const {id} = useParams()
    const userData = useSelector((state) => state.auth.userData);
    const [exam, setExam] = React.useState(null);
    useEffect(() => {
      const fetchExamData = async () => {
        const exam = await databaseService.getExamById(id);
        setExam(exam);
        // databaseService.startExam(id, userData.id);
      };
      fetchExamData();
    }, [id]);

  return (
    <div>
      <h1>Exam Attempt</h1>
      <p>Exam ID: {id}</p>
      <p>Exam Data: {JSON.stringify(exam)}</p>
      <p>User Data: {JSON.stringify(userData)}</p>
    </div>

  )
}

export default ExamAttempt

// Exam Attempt Page
// Exam Attempt
// Exam ID: 1

// User Data: {"id":4,"name":"Lokesh Alli","email":"lokeshalli1807@gmail.com","phone":"8485868884","user_type":"student","is_active":true,"email_verified":false,"phone_verified":false,"created_at":"2025-08-03T05:52:03.819Z","student_id":"2263081245502","date_of_birth":null,"address":null,"school_id":5,"board_id":1,"medium_id":1,"class_level":8,"academic_year":"2025-2026","enrollment_date":"2025-08-02T18:30:00.000Z"}