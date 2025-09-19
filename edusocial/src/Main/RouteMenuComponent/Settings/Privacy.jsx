// Privacy.jsx
import React, { useState } from 'react';

const Privacy = () => {
  const [isPrivate, setIsPrivate] = useState(true);
  const [settings, setSettings] = useState({
    profileVisibility: 'private',
    showOnlineStatus: true,
    // allowMessagesFrom: 'followers',
    // showActivityStatus: true,
    // syncContacts: false,
    // dataSharing: false
  });
  const [saveStatus, setSaveStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handlePrivacyChange = (e) => {
    const newPrivacySetting = e.target.value;
    setIsPrivate(newPrivacySetting === 'private');
    
    // Update all settings based on privacy level
    setSettings(prev => ({
      ...prev,
      profileVisibility: newPrivacySetting,
      allowMessagesFrom: newPrivacySetting === 'private' ? 'followers' : 'everyone',
      showOnlineStatus: newPrivacySetting === 'private' ? false : true,
      dataSharing: newPrivacySetting === 'private' ? false : true
    }));
    
    // Clear any previous save status when user makes changes
    setSaveStatus({ type: '', message: '' });
  };

  const handleSettingChange = (name, value) => {
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
    
    setSaveStatus({ type: '', message: '' });
  };

  const handleSave = () => {
    setLoading(true);

    
    
    // setTimeout(() => {

    //   setSaveStatus({ 
    //     type: 'success', 
    //     message: 'Your privacy settings have been updated successfully!' 
    //   });
    //   setLoading(false);
    // }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 to-neutral-800 text-white py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="flex items-center gap-5 mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-500 rounded-2xl shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div className='flex flex-col justify-center'>
            <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Privacy Settings
            </h1>
            <p className="text-neutral-300">
              Control your account visibility and data sharing preferences
            </p>
          </div>
        </div>
        
        <div className='border-b border-neutral-700 mb-8'></div>

        {/* Save Status Message */}
        {saveStatus.message && (
          <div className={`p-4 rounded-xl mb-6 flex items-start ${
            saveStatus.type === 'success' 
              ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-200' 
              : 'bg-red-500/20 border border-red-500/30 text-red-200'
          }`}>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`h-5 w-5 mr-2 mt-0.5 flex-shrink-0 ${
                saveStatus.type === 'success' ? 'text-emerald-400' : 'text-red-400'
              }`} 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              {saveStatus.type === 'success' ? (
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              ) : (
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              )}
            </svg>
            <p>{saveStatus.message}</p>
          </div>
        )}

        {/* Settings Panel */}
        <div className="backdrop-blur-sm rounded-3xl overflow-hidden shadow-2xl border border-neutral-700/30">
          {/* Account Privacy Section */}
          <div className="px-6 py-8 space-y-8">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-xl">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold">Account Privacy</h2>
              </div>
              
              <div className="p-4 bg-neutral-800/30 rounded-2xl border border-neutral-700/30 hover:border-neutral-600/50 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <h3 className="font-medium">Profile Visibility</h3>
                    <p className="text-sm text-neutral-400">
                      {isPrivate 
                        ? 'Only approved followers can see your posts and profile information' 
                        : 'Anyone can see your posts and profile information'
                      }
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <input
                        id="public-account"
                        name="privacy-setting"
                        type="radio"
                        value="public"
                        checked={!isPrivate}
                        onChange={handlePrivacyChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <label htmlFor="public-account" className="ml-2 block text-sm font-medium text-white">
                        Public
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="private-account"
                        name="privacy-setting"
                        type="radio"
                        value="private"
                        checked={isPrivate}
                        onChange={handlePrivacyChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <label htmlFor="private-account" className="ml-2 block text-sm font-medium text-white">
                        Private
                      </label>
                    </div>
                  </div>
                </div>

                <div className={`rounded-lg p-4 mt-4 ${isPrivate ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-neutral-700/30 border border-neutral-600/30'}`}>
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className={`h-5 w-5 ${isPrivate ? 'text-blue-400' : 'text-neutral-400'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className={`text-sm font-medium ${isPrivate ? 'text-blue-300' : 'text-neutral-300'}`}>
                        {isPrivate ? 'Private Account' : 'Public Account'}
                      </h3>
                      <div className={`mt-2 text-sm ${isPrivate ? 'text-blue-300/80' : 'text-neutral-300/80'}`}>
                        <p>
                          {isPrivate 
                            ? 'Your account is private. You must approve anyone who wants to follow you. Only your approved followers can see your posts.' 
                            : 'Your account is public. Anyone can see your posts and follow you without approval.'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Privacy Preferences Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 rounded-xl">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold">Privacy Preferences</h2>
              </div>
              
              {/* Online Status */}
              <div className="flex items-center justify-between p-4 bg-neutral-800/30 rounded-2xl border border-neutral-700/30 hover:border-neutral-600/50 transition-colors">
                <div className="space-y-1">
                  <h3 className="font-medium">Show Online Status</h3>
                  <p className="text-sm text-neutral-400">Allow others to see when you're active</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={settings.showOnlineStatus || false}
                    onChange={() => handleSettingChange('showOnlineStatus', !settings.showOnlineStatus)}
                  />
                  <div className="w-12 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                </label>
              </div>

              {/* Message Controls */}
              {/* <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-neutral-800/30 rounded-2xl border border-neutral-700/30 hover:border-neutral-600/50 transition-colors">
                <div className="space-y-1 mb-3 md:mb-0 md:flex-1">
                  <h3 className="font-medium">Who Can Message You</h3>
                  <p className="text-sm text-neutral-400">Control who can send you direct messages</p>
                </div>
                <div className="w-full md:w-auto">
                  <select
                    value={settings.allowMessagesFrom}
                    onChange={(e) => handleSettingChange('allowMessagesFrom', e.target.value)}
                    className="w-full md:w-48 bg-neutral-700 border border-neutral-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                  >
                    <option value="everyone">Everyone</option>
                    <option value="followers">Followers Only</option>
                    <option value="none">No One</option>
                  </select>
                </div>
              </div> */}

              {/* Activity Status */}
              {/* <div className="flex items-center justify-between p-4 bg-neutral-800/30 rounded-2xl border border-neutral-700/30 hover:border-neutral-600/50 transition-colors">
                <div className="space-y-1">
                  <h3 className="font-medium">Show Activity Status</h3>
                  <p className="text-sm text-neutral-400">Allow people to see when you were last active</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={settings.showActivityStatus || false}
                    onChange={() => handleSettingChange('showActivityStatus', !settings.showActivityStatus)}
                  />
                  <div className="w-12 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                </label>
              </div> */}

            </div>
          </div>

          <div className="px-6 py-5 bg-neutral-800/60 border-t border-neutral-700/30 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
            <button 
              className="px-6 py-3 rounded-xl font-medium transition-colors bg-neutral-700 text-white hover:bg-neutral-600"
            >
              Reset to Defaults
            </button>
            <button 
              onClick={handleSave}
              disabled={loading}
              className={`px-6 py-3 rounded-xl font-medium transition-all shadow-lg flex items-center justify-center ${
                loading
                  ? 'bg-gray-800 text-neutral-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-500 text-white hover:from-blue-500 hover:to-indigo-400 active:scale-95'
              }`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>

        <div className="mt-8 bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-lg font-medium text-blue-300 mb-2">Privacy Tips</h3>
              <ul className="list-disc list-inside text-blue-300/80 space-y-2">
                <li>Regularly review your privacy settings to ensure they match your preferences</li>
                <li>Private accounts give you control over who can see your content</li>
                <li>Be mindful of what personal information you share in your posts</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;