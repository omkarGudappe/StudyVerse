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

  useEffect(() => {
    const handleTokenUpdate = (e) => {
      const newToken = e.detail?.token || localStorage.getItem('token');
      setToken(newToken);
    };

    const handleStorage = () => {
      const newToken = localStorage.getItem('token');
      setToken(newToken);
    };

    window.addEventListener('tokenUpdated', handleTokenUpdate);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('tokenUpdated', handleTokenUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const Errors = {
    401: 'Unauthorized. Please sign in again.',
    500: 'Internal Server Error. Please try again later.',
  };

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError('No session found. Please sign in again.');
      setProfileData(null);
      return;
    }

    if (!navigator.onLine) {
      setLoading(false);
      setError('No internet connection. Please check your network.');
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/user/profile`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setProfileData(response.data.userProfile);
        setError(null);
      } catch (err) {
        if (!err.response) {
          setError('Network error. Please check your connection.');
        } else if (err.response.status === 401) {
          setError('Session expired. Please sign in again.');
          localStorage.removeItem('token');
          setToken(null);
        } else {
          setError(Errors[err.response.status] || 'Failed to load profile data');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token]);

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
      }}
    >
      {children}
    </UserDataContext.Provider>
  );
};

export default CurrentUserContexProvider;