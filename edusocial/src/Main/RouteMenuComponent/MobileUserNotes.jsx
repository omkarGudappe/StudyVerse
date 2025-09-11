import React from 'react'
import UsersNotes from './UsersNotes'
import { UserDataContextExport } from "./CurrentUserContexProvider";


const MobileUserNotes = () => {
      const { ProfileData } = UserDataContextExport();

  return (
    <div>
      <UsersNotes open={true} onClose={null} from="mobile" ProfileData={ProfileData} />
    </div>
  )
}

export default MobileUserNotes
