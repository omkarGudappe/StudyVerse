import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const SettingsContent = () => {
    const SettingBtns = [
        {
            id: '/setting/update-profile',
            label: 'Update Profile',
            description: 'Change your profile information, avatar, and bio',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" className="w-5 h-5">
                    <path d="M416.9 85.2L372 130.1L509.9 268L554.8 223.1C568.4 209.6 576 191.2 576 172C576 152.8 568.4 134.4 554.8 120.9L519.1 85.2C505.6 71.6 487.2 64 468 64C448.8 64 430.4 71.6 416.9 85.2zM338.1 164L122.9 379.1C112.2 389.8 104.4 403.2 100.3 417.8L64.9 545.6C62.6 553.9 64.9 562.9 71.1 569C77.3 575.1 86.2 577.5 94.5 575.2L222.3 539.7C236.9 535.6 250.2 527.9 261 517.1L476 301.9L338.1 164z"/>
                </svg>
            ),
            color: 'from-blue-500 to-cyan-500'
        },
        {
            id: '/setting/privacy',
            label: 'Privacy & Security',
            description: 'Manage your privacy settings and security options',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
                </svg>
            ),
            color: 'from-green-500 to-emerald-500'
        },
        {
            id: '/setting/notifications',
            label: 'Notifications',
            description: 'Customize your notification preferences',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M5.85 3.5a.75.75 0 00-1.117-1 9.39 9.39 0 00-2.348 4.876.75.75 0 001.479.248A7.905 7.905 0 015.85 3.5zM19.267 2.5a.75.75 0 10-1.118 1 7.904 7.904 0 012.34 4.876.75.75 0 101.48-.248A9.39 9.39 0 0019.267 2.5z" />
                    <path fillRule="evenodd" d="M12 2.25A6.75 6.75 0 005.25 9v.75a8.217 8.217 0 01-2.119 5.52.75.75 0 00.298 1.206c1.544.57 3.16.99 4.831 1.243a3.75 3.75 0 107.48 0 24.583 24.583 0 004.83-1.244.75.75 0 00.298-1.205 8.217 8.217 0 01-2.118-5.52V9A6.75 6.75 0 0012 2.25zM9.75 18c0-.034 0-.067.002-.1a25.05 25.05 0 004.496 0l.002.1a2.25 2.25 0 11-4.5 0z" clipRule="evenodd" />
                </svg>
            ),
            color: 'from-purple-500 to-pink-500'
        },
        {
            id: '/setting/account',
            label: 'Account Settings',
            description: 'Manage your account preferences and data',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                </svg>
            ),
            color: 'from-amber-500 to-orange-500'
        },
        {
            id: '/setting/appearance',
            label: 'Appearance',
            description: 'Customize the look and feel of the app',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
                </svg>
            ),
            color: 'from-violet-500 to-purple-500'
        },
        {
            id: '/setting/help',
            label: 'Help & Support',
            description: 'Get help and contact support',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm11.378-3.917c-.89-.777-2.366-.777-3.255 0a.75.75 0 01-.988-1.129c1.454-1.272 3.776-1.272 5.23 0 1.513 1.324 1.513 3.518 0 4.842a3.75 3.75 0 01-.837.552c-.676.328-1.028.774-1.028 1.152v.75a.75.75 0 01-1.5 0v-.75c0-1.279 1.06-2.107 1.875-2.502.182-.088.351-.199.503-.331.83-.727.83-1.857 0-2.584zM12 18a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                </svg>
            ),
            color: 'from-rose-500 to-red-500'
        }
    ]

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    }

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.3,
                ease: "easeOut"
            }
        }
    }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className='grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6'
    >
      {SettingBtns.map((settings, index) => (
        <motion.div
          key={settings.id}
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Link 
            to={settings.id}
            className="block group"
          >
            <div className='
                bg-neutral-800 rounded-2xl p-6
                border border-neutral-700
                hover:border-neutral-600
                hover:shadow-2xl hover:shadow-black/20
                transition-all duration-300
                h-full
            '>
              <div className='flex items-start gap-4'>
                <div className={`
                    flex-shrink-0 w-12 h-12 rounded-xl
                    bg-gradient-to-r ${settings.color}
                    flex items-center justify-center
                    group-hover:scale-110 transition-transform duration-300
                `}>
                  <div className='text-white'>
                    {settings.icon}
                  </div>
                </div>
                
                <div className='flex-1 min-w-0'>
                  <h3 className='
                    text-white font-semibold text-lg
                    group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r
                    group-hover:from-white group-hover:to-neutral-300
                    transition-all duration-300
                    mb-2
                  '>
                    {settings.label}
                  </h3>
                  
                  <p className='
                    text-neutral-400 text-sm
                    group-hover:text-neutral-300
                    transition-colors duration-300
                    line-clamp-2
                  '>
                    {settings.description}
                  </p>
                </div>
                
                <div className='
                    flex-shrink-0 text-neutral-400
                    group-hover:text-white group-hover:translate-x-1
                    transition-all duration-300
                    self-center
                '>
                  <svg className='w-5 h-5' fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  )
}

export default SettingsContent