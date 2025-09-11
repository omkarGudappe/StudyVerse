import React from 'react'
import SettingsContent from './SettingsContent'
import { motion } from 'framer-motion'

const SettingePage = () => {
  return (
    <div className='min-h-screen bg-neutral-900 p-4 md:p-6 lg:p-8'>
      <div className='max-w-4xl mx-auto'>
        {/* Header */}
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

        {/* Settings Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <SettingsContent/>
        </motion.div>
      </div>
    </div>
  )
}

export default SettingePage