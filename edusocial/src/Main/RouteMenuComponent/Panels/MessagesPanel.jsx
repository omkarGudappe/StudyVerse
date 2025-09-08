import React, { useRef, useEffect } from 'react';
import SlidePanel from './SlidePanel';

const MessagesPanel = ({ open, onClose,searchTerm, onSearchChange, onClearSearch, children }) => {
  const inputRef = useRef(null);

    useEffect(() => {
      if (open && inputRef.current) {
        inputRef.current.focus();
      }
    }, [open]);

  return (
    <SlidePanel
      open={open}
      onClose={onClose}
      title="Messages"
    >
      <div className="p-6 border-b border-neutral-700">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            ref={inputRef}
            onChange={onSearchChange}
            value={searchTerm}
            type="text"
            placeholder="Search for users..."
            className="bg-neutral-800 text-white rounded-xl pl-10 pr-12 py-3 w-full outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-neutral-500"
          />
          {searchTerm && (
            <button
              onClick={onClearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="h-[calc(100vh-140px)] overflow-y-auto">
        {children}
      </div>
    </SlidePanel>
  );
};

export default MessagesPanel;