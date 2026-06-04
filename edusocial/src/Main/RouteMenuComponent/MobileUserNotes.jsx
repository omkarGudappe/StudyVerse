import React from 'react'
import UsersNotes from './UsersNotes'
import { UserDataContextExport } from "./CurrentUserContexProvider";
import { useNavigate } from 'react-router-dom';


const MobileUserNotes = () => {
      const { ProfileData } = UserDataContextExport();
      const navigate = useNavigate();

  return (
    <div className='z-50'>
      <UsersNotes open={true} onClose={() => navigate(-1)} from="" ProfileData={ProfileData} />
    </div>
  )
}

export default MobileUserNotes
