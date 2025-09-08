import React, { useRef, useEffect } from 'react';
import SlidePanel from './SlidePanel';
import SearchInput from './SearchInput';

const SearchPanel = ({ open, onClose, searchTerm, onSearchChange, onClearSearch, children }) => {

  return (
    <SlidePanel
      open={open}
      onClose={onClose}
      title="Search Users"
    >
      
      <SearchInput searchTerm={searchTerm} onSearchChange={onSearchChange} onClearSearch={onClearSearch} open={open}/>

      <div className="h-[calc(100vh-200px)] overflow-y-auto">
        {children}
      </div>
    </SlidePanel>
  );
};

export default SearchPanel;