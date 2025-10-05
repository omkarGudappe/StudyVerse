import React , { useContext , createContext, useState , useEffect } from 'react'
import axios from 'axios';

const UserDataContext = createContext();

export const UserDataContextExport = () => {
    return useContext(UserDataContext);
}

 const CurrentUserContexProvider = ({ children }) => {
  const [ProfileData, setProfileData] = useState([]);
  const [FirebaseUid, setFirebaseUid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {    
    const FetchDataFromBackEnd = async () => {
      try {
        setLoading(true);
        const FetchProfileData = await axios.get(`${import.meta.env.VITE_API_URL}/user/profile`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        setProfileData(FetchProfileData.data.userProfile);
        setError(null);
      } catch (err) {
        console.log(err);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };
    FetchDataFromBackEnd();
  }, [token]);

  return (
    <UserDataContext.Provider value={{ ProfileData, FirebaseUid, loading, error, setProfileData }}>
      {children}
    </UserDataContext.Provider>
  );
};

export default CurrentUserContexProvider;