import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import { auth } from '../Auth/AuthProviders/FirebaseSDK';
import StartingPage from './StartingPage';
import UsesOfStudyVerse from './UsesOfStudyVerse';
import LogIn from '../Auth/LogIn';

const LandingHome = () => {

  const navigate = useNavigate();

  useEffect(() => {
  const checkSession = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/Auth/verify-session`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (data.ok) {
        navigate(data.route || '/home');
      } else {
        localStorage.removeItem("token");
      }
    } catch (err) {
      localStorage.removeItem("token");
    }
  };

  checkSession();
}, []);


    const user = auth.currentUser;

  return (
    <div className='bg-neutral-900 text-white'>
      <StartingPage/>
      <UsesOfStudyVerse/>
      <LogIn/>
    </div>
  )
}

export default LandingHome
