import React from 'react'
import SlidePanel from './SlidePanel';

const UserNotesPanel = ({ open, onClose, Notes = [], children}) => {
  return (
    <SlidePanel
        open={open}
        onClose={onClose}
        title="My Notes"
        headerContent={
            Notes.length > 0 && (
            <span className="bg-purple-600 text-white text-sm px-2 py-1 rounded-full">
                {Notes.length}
            </span>
            )
        }
    >
        <div className="h-[calc(100vh-140px)] overflow-y-auto">
            {children}
        </div>
    </SlidePanel>

  )
}

export default UserNotesPanel
