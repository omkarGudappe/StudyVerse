import React , { useContext , createContext, useState , useEffect } from 'react'
import { auth } from '../../Auth/AuthProviders/FirebaseSDK';
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

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setFirebaseUid(user.uid);
      } else {
        setFirebaseUid(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!FirebaseUid) return;
    const FetchDataFromBackEnd = async () => {
      try {
        setLoading(true);
        const FetchProfileData = await axios.get(`${import.meta.env.VITE_API_URL}/user/profile/${FirebaseUid}`);
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
  }, [FirebaseUid]);

  return (
    <UserDataContext.Provider value={{ ProfileData, FirebaseUid, loading, error }}>
      {children}
    </UserDataContext.Provider>
  );
};

export default CurrentUserContexProvider;