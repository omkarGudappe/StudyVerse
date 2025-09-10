import React from 'react'
import NotesEditor from '../NotesEditor'
import { useLocation } from 'react-router-dom';

const UpdateUserNotes = () => {
    const location = useLocation();
    const { content, Id } = location.state || {};

  return (
    <div>
      <NotesEditor content={content} Id={Id} />
    </div>
  )
}

export default UpdateUserNotes
