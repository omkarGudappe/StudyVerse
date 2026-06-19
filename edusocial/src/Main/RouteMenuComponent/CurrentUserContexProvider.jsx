import React, { useContext, createContext, useState, useEffect } from 'react';
import axios from 'axios';

const UserDataContext = createContext();
export const UserDataContextExport = () => useContext(UserDataContext);

const CurrentUserContexProvider = ({ children }) => {
  const [ProfileData, setProfileData] = useState(null);
  const [FirebaseUid, setFirebaseUid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [userNotes, setUserNotes] = useState([]);


  const Errors = {
    401: 'Unauthorized. Please sign in again.',
    500: 'Internal Server Error. Please try again later.',
  };

  const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/user/profile`,
           {
             withCredentials: true,
           }
        );
        setProfileData(response.data.userProfile);
        setError(null);
      } catch (err) {
        if (!err.response) {
          setError('Network error. Please check your connection.');
        } else if (err.response.status === 401) {
          setError("Session expired. Please sign in again, or if it's a connection issue, try reloading the page.");
        } else {
          setError(Errors[err.response.status] || 'Failed to load profile data');
        }
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    // if (!token) {
    //   setLoading(false);
    //   setError('No session found. Please sign in again.');
    //   setProfileData(null);
    //   return;
    // }

    if (!navigator.onLine) {
      setLoading(false);
      setError('No internet connection. Please check your network.');
      return;
    }

    fetchProfile();
  }, []);

  return (
    <UserDataContext.Provider
      value={{
        ProfileData,
        FirebaseUid,
        loading,
        error,
        setProfileData,
        token,
        setToken,
        userNotes,
        setUserNotes,
        fetchProfile,
      }}
    >
      {children}
    </UserDataContext.Provider>
  );
};

export default CurrentUserContexProvider;