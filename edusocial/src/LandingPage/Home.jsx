import React from 'react'
import { auth } from '../Auth/AuthProviders/FirebaseSDK';
import StartingPage from './StartingPage';
import UsesOfStudyVerse from './UsesOfStudyVerse';
import LogIn from '../Auth/LogIn';

const LandingHome = () => {

    const user = auth.currentUser;
    console.log("Current User:", user);

  return (
    <div className='bg-neutral-900 text-white'>
      <StartingPage/>
      <UsesOfStudyVerse/>
      <LogIn/>
    </div>
  )
}

export default LandingHome
