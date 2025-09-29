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
    console.log("Befour getting");
    if (!token) return;
    console.log("Found token, verifying session...", token);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/Auth/verify-session`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (data.ok) {
        navigate("/home");
        console.log("Session valid, navigating to home.");
      } else {
        localStorage.removeItem("token");
        console.log("Session invalid, please log in again.");
      }
    } catch (err) {
      localStorage.removeItem("token");
      console.log("Session verification error:", err.message);
    }
  };

  checkSession();
}, []);


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
