import React, { useState } from 'react'
import SettingsContent from './SettingsContent'
import { motion, AnimatePresence } from 'framer-motion'
import { EmailContextExport } from '../../../Auth/AuthProviders/EmailContexProvider'
import { useNavigate } from 'react-router-dom'

const SettingePage = () => {
  const { Logout } = EmailContextExport();
  const Navigate = useNavigate();
  const [IsOpenModel, setIsOpenModel] = useState(false);

  const handleLogout = () => {
    Logout();
    Navigate('/');
    setIsOpenModel(false);
  };

  return (
    <>
      <div className='min-h-screen bg-neutral-900 p-4 md:p-6 lg:p-8'>
        <div className='max-w-4xl mx-auto'>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className='border-b border-neutral-700 pb-6 mb-8'
          >
            <h1 className='text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2'>
              Settings
            </h1>
            <p className='text-neutral-400 text-sm md:text-base'>
              Manage your account preferences and privacy settings
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <SettingsContent/>
          </motion.div>
          <div className='border-t border-neutral-700 pb-6 mt-8 w-full flex items-center justify-end'>
            <button 
              onClick={() => setIsOpenModel(true)} 
              className='bg-neutral-800 p-2 rounded-md px-5 mt-5 text-white cursor-pointer active:scale-95 hover:bg-neutral-700 transition-colors'
            >
              Log out
            </button>
          </div>
        </div>
      </div>
      
      <AnimatePresence>
        {IsOpenModel && (
          <div className='fixed inset-0 h-screen w-screen z-50 flex items-center justify-center backdrop-blur-sm'>
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className='bg-neutral-900 rounded-lg p-6 max-w-md w-full mx-4'
            >
              <h2 className='text-xl font-bold text-white mb-4'>Confirm Logout</h2>
              <p className='text-neutral-300 mb-6'>Are you sure you want to log out?</p>
              
              <div className='flex justify-end space-x-3'>
                <button 
                  onClick={() => setIsOpenModel(false)}
                  className='bg-neutral-700 text-white px-4 py-2 rounded-md hover:bg-neutral-600 transition-colors'
                >
                  Cancel
                </button>
                <button 
                  onClick={handleLogout}
                  className='bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors'
                >
                  Log Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}

export default SettingePage