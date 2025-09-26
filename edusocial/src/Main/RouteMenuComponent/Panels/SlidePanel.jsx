import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SlidePanel = ({ 
  open, 
  onClose, 
  title, 
  children, 
  headerContent,
  showCloseButton = true,
  from,
  width = "max-w-md",
  className = "z-50"
}) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={`fixed inset-0  ${title === 'Messages' ? '' : 'bg-black/50 backdrop-blur-sm'} z-50`}
          initial={from === 'mobile' ? {} : { opacity: 0 }}
          animate={from === 'mobile' ? {} : { opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={title === 'Messages' ? null : onClose}
        >
          <motion.div
            className={`absolute top-0 md:left-20 left-0 h-screen bg-neutral-900 border-l border-neutral-700 shadow-2xl w-full ${width} overflow-hidden ${className}`}
            initial={from === 'mobile' ? {} : { x: "-100%" }}
            animate={from === 'mobile' ? {} : { x: 0 }}
            exit={from === 'mobile' ? {} : { x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-neutral-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-white">{title}</h2>
                  {headerContent}
                </div>
                {showCloseButton && from !== 'mobile' && (
                  <button
                    onClick={onClose}
                    className="p-2 text-neutral-400 hover:text-white transition-colors rounded-lg hover:bg-neutral-800"
                    aria-label="Close panel"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SlidePanel;