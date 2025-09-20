import React, { useState , useEffect } from 'react'
import SearchInput from './Panels/SearchInput'
import SearchResult from './SmallComponents/SearchResult';
import axios from 'axios';
import { UserDataContextExport } from "./CurrentUserContexProvider";
import Socket from '../../SocketConnection/Socket';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';


const MobileContact = () => {

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [Contact, setContact] = useState([]);
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


    useEffect(() => {
      const Id = ProfileData?._id;
      if(!Id) return;
      Socket.emit("SendContactUsers" , {ID: Id });
  
      Socket.on("ContactUsers" , (User) => {
        if(!User) return;
        setContact(User.User);
        console.log(User.User);
      })
    }, [open])

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
          <div className='p-6 flex flex-col gap-3'>
        {Contact.map((user, index) => (
              <motion.div
                  key={user._id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="cursor-pointer flex items-center gap-4 p-4 bg-neutral-800 rounded-xl hover:bg-neutral-750 transition-all duration-200 group"
                >
                <Link 
                  to={`/messages/${encodeURIComponent(user?.User2?.username)}`}
                  className="cursor-pointer flex items-center w-full gap-4 bg-neutral-800 rounded-xl hover:bg-neutral-750 transition-all duration-200"
                >
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-amber-600 flex items-center justify-center overflow-hidden border-2 border-neutral-700 group-hover:border-purple-500 transition-colors">
                      {user?.User2?.UserProfile?.avatar?.url ? (
                        <img
                          src={user?.User2?.UserProfile?.avatar?.url}
                          alt={`${user?.User2?.firstName} ${user.lastName}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-semibold text-lg">
                          {user?.User2?.firstName?.[0]}{user?.User2?.lastName?.[0]}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold truncate">
                      {user?.User2?.firstName} {user?.User2?.lastName}
                    </h3>
                    <p className="text-neutral-400 text-sm truncate">{user?.User2?.username}</p>
                    {user?.User2?.education && (
                      <p className="text-neutral-500 text-xs mt-1 truncate">
                        {user?.User2?.education?.standard || user?.User2?.education?.degree}
                      </p>
                    )}
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              </motion.div>
            ))}
      </div>
    </div>
  )
}

export default MobileContact
