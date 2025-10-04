import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios';
import SearchPanel from './Panels/SearchPanel';
import SearchResult from './SmallComponents/SearchResult';
import { UserDataContextExport } from './CurrentUserContexProvider';

const Search = ({ searchClicked, onClose }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState({
    users: [],
    notes: [],
    lessons: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    hasMore: { users: false, notes: false, lessons: false }
  });
  const { ProfileData } = UserDataContextExport();

  // Reset pagination when search term changes
  useEffect(() => {
    setPagination({ page: 1, hasMore: { users: false, notes: false, lessons: false } });
    setSearchResults({ users: [], notes: [], lessons: [] });
  }, [searchTerm]);

  const searchAPI = useCallback(async (term, page) => {
    const uid = ProfileData ? ProfileData._id : "";
    if(!uid) {
      console.log('No user ID found');
      return null;
    }

    try {
      console.log('Searching for:', term, 'page:', page);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No auth token found');
      }
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/user/search?query=${encodeURIComponent(term)}&uid=${uid}&page=${page}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      console.log('Search results:', res.data);
      return res.data;
    } catch (err) {
      console.error('Search API error:', err);
      throw err;
    }
  }, [ProfileData]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.trim() === "") {
        setSearchResults({ users: [], notes: [], lessons: [] });
        setError(null);
        setIsLoading(false);
        return;
      }

      const performSearch = async () => {
        try {
          setIsLoading(true);
          setError(null);
          
          const Data = await searchAPI(searchTerm, pagination.page);
          
          if (Data) {
            setSearchResults(prev => ({
              users: pagination.page === 1 ? Data.users : [...prev.users, ...Data.users],
              notes: pagination.page === 1 ? Data.notes : [...prev.notes, ...Data.notes],
              lessons: pagination.page === 1 ? Data.lessons : [...prev.lessons, ...Data.lessons]
            }));
            
            setPagination(prev => ({
              ...prev,
              hasMore: Data.pagination?.hasMore || { users: false, notes: false, lessons: false }
            }));
          }

        } catch (err) {
          console.error('Search error:', err);
          setError(err.response?.data?.message || "Failed to search");
          if (pagination.page === 1) {
            setSearchResults({ users: [], notes: [], lessons: [] });
          }
        } finally {
          setIsLoading(false);
        }
      };
      
      performSearch();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, pagination.page, searchAPI]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setSearchResults({ users: [], notes: [], lessons: [] });
    setPagination({ page: 1, hasMore: { users: false, notes: false, lessons: false } });
    setError(null);
  };

  const loadMore = () => {
    setPagination(prev => ({ ...prev, page: prev.page + 1 }));
  };

  return (
    <SearchPanel
      open={searchClicked}
      onClose={onClose}
      searchTerm={searchTerm}
      onSearchChange={handleSearchChange}
      onClearSearch={clearSearch}
    >
      <SearchResult 
        onClose={onClose} 
        isLoading={isLoading} 
        searchTerm={searchTerm} 
        error={error} 
        searchResults={searchResults} 
        title="profile"
        pagination={pagination}
        onLoadMore={loadMore}
      />
    </SearchPanel>
  );
};

export default Search;