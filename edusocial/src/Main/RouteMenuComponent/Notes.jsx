// import React from 'react'
// import NotesEditor from './NotesEditor';

// const Notes = () => {
//   return (
//     <div>
//       <h1 className="text-2xl font-bold mb-4">📓 StudyVerse Notes</h1>
//       <NotesEditor />
//     </div>
//   )
// }

// export default Notes




import React from 'react'
import NotesEditor from './NotesEditor';

const Notes = () => {
  return (
    <div className="h-screen flex flex-col bg-gray-50">      
      {/* Editor */}
      <div className="flex-1">
        <NotesEditor />
      </div>
    </div>
  )
}

export default Notes