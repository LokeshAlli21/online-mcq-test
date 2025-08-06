import React from 'react'
import { useParams } from 'react-router-dom'

function AddQuestions () {

  const {id} = useParams()
  return (
    <div>AddQuestions {id}</div>
  )
}

export default AddQuestions 