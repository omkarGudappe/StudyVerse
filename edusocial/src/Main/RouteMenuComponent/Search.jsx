import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion';
import axios from 'axios';
import { Link } from 'react-router-dom';
import SearchPanel from './Panels/SearchPanel';
import SearchResult from './SmallComponents/SearchResult';

const Search = ({ searchClicked, onClose }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.trim() === "") {
        setSearchResults([]);
        setError(null);
        return;
      }

      // In Search.jsx, update the FindFriend function:
        const FindFriend = async () => {
          try {
            setIsLoading(true);
            setError(null);
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/user/search?query=${searchTerm}`);
            const Data = res.data;
            
            // Set the search results with the expected structure
            setSearchResults({
              users: Data.users || [],
              notes: Data.Notes || [],
              lessons: Data.Lesson || []
            });
                        console.log(Data.users , "users");
            console.log(Data.Lesson, "Lesson");
            console.log(Data.Notes, "Notes");
            
          } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to search");
            setSearchResults({ users: [], notes: [], lessons: [] });
          } finally {
            setIsLoading(false);
          }
        };
      
      FindFriend();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  const clearSearch = () => {
    setSearchTerm("");
    setSearchResults([]);
    setError(null);
  };

  return (
    <SearchPanel
      open={searchClicked}
      onClose={onClose}
      searchTerm={searchTerm}
      onSearchChange={handleSearchChange}
      onClearSearch={clearSearch}
    >
      <SearchResult onClose={onClose} isLoading={isLoading} searchTerm={searchTerm} error={error} searchResults={searchResults} title="profile" />
    </SearchPanel>
  );
};

export default Search;