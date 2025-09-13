import React, { useState , useEffect } from 'react'
import MessageContact from './MessageContact'
import SearchInput from './Panels/SearchInput'
import SearchResult from './SmallComponents/SearchResult';
import axios from 'axios';
import { ref, query, orderByChild, onValue } from "firebase/database";
import { database } from "../../Auth/AuthProviders/FirebaseSDK";
import { UserDataContextExport } from "./CurrentUserContexProvider";

const MobileContact = () => {

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chats, setChats] = useState([]);
  const { ProfileData } = UserDataContextExport();

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.trim() === "") {
        setSearchResults([]);
        setError(null);
        return;
      }

      const FindFriend = async () => {
        try {
          setIsLoading(true);
          setError(null);
          const res = await axios.get(`${import.meta.env.VITE_API_URL}/user/search?query=${searchTerm}`);
          const Data = res.data;
          if (Data.users) {
            setSearchResults(Data.users);
          }
        } catch (err) {
          console.error(err);
          setError(err.response?.data?.message || "Failed to search users");
          setSearchResults([]);
        } finally {
          setIsLoading(false);
        }
      };
      
      FindFriend();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const FUID = ProfileData?.firebaseUid




    const handleSearchChange = (e) => setSearchTerm(e.target.value);
        const clearSearch = () => {
            setSearchTerm("");
            setSearchResults([]);
            setError(null);
        };

  return (
    <div>
        <SearchInput searchTerm={searchTerm} onSearchChange={handleSearchChange} onClearSearch={clearSearch} open={true} />
        <div>
            <SearchResult isLoading={isLoading} searchTerm={searchTerm} searchResults={searchResults} error={error} title="messages" />
        </div>
    </div>
  )
}

export default MobileContact
