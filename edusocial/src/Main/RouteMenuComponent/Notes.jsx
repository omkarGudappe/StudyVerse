import React from 'react'
import NotesEditor from './NotesEditor';

const Notes = () => {
  return (
    <div className="h-screen flex flex-col bg-gray-50">      
      <div className="flex-1">
        <NotesEditor />
      </div>
    </div>
  )
}

export default Notes