import React, { useState, useEffect } from 'react';
import { UserDataContextExport } from '../CurrentUserContexProvider';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const NotificationSetting = () => {
  const { ProfileData } = UserDataContextExport();
  const [originalSettings, setOriginalSettings] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState({ type: '', message: '' });
  const [fetchError, setFetchError] = useState('');
  const id = ProfileData?._id;
  const navigate = useNavigate();

  const [settings, setSettings] = useState({
    showLikeNotifications: false,
    showCommentNotifications: false,
    acceptAllPeersRequest: false,
    accountType: 'public',
  });

  useEffect(() => {
    const getCurrentNotificationSetting = async () => {
      try {
        setLoading(true);
        setFetchError('');
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/user/setting/${id}`);
        
        if (res.data.ok) {
          const apiSettings = {
            showLikeNotifications: res.data.settings.showLikeNotifications,
            showCommentNotifications: res.data.settings.showCommentNotifications,
            acceptAllPeersRequest: res.data.settings.acceptAllPeersRequest,
            accountType: res.data.settings.accountType,
          };
          
          setSettings(apiSettings);
          setOriginalSettings(apiSettings);
        }
      } catch (err) {
        const errorMsg = err?.response?.data?.message || err.message || 'Failed to load settings';
        console.error(errorMsg);
        setFetchError(errorMsg);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      getCurrentNotificationSetting();
    }
  }, [id]);

  useEffect(() => {
    if (Object.keys(originalSettings).length > 0) {
      const changed = 
        settings.showLikeNotifications !== originalSettings.showLikeNotifications ||
        settings.showCommentNotifications !== originalSettings.showCommentNotifications ||
        settings.acceptAllPeersRequest !== originalSettings.acceptAllPeersRequest;
      
      setHasChanges(changed);
    }
  }, [settings, originalSettings]);

  const handleToggle = (setting) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
    // Clear any previous save status when user makes changes
    setSaveStatus({ type: '', message: '' });
    console.log(settings , "Setting ");
  };

  const handleSave = async () => {
    if (!hasChanges) return;
    
    try {
      setLoading(true);
      setSaveStatus({ type: '', message: '' });
      
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/user/settingsUpdated/${id}`, settings);
      
      if (res.data.ok) {
        setSaveStatus({ type: 'success', message: res.data.message || 'Settings saved successfully!' });
        setOriginalSettings({...settings});
        setHasChanges(false);
      } else {
        setSaveStatus({ type: 'error', message: res.data.message || 'Failed to save settings' });
      }
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err.message || 'Failed to save settings';
      console.error(errorMsg);
      setSaveStatus({ type: 'error', message: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      setSettings({...originalSettings});
      setHasChanges(false);
      setSaveStatus({ type: '', message: '' });
    }
  };

  // Show loading state while fetching settings
  if (loading && Object.keys(settings).length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 to-neutral-800 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-neutral-300">Loading your notification settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 to-neutral-800 text-white">
        <nav className="bg-neutral-900 border-b border-neutral-700 px-4 py-3 sticky top-0 z-10">
          <div className="max-w-4xl flex items-center">
              <button 
                  onClick={() => navigate(-1)}
                  className="p-2 rounded-lg hover:bg-neutral-700 transition-colors mr-4"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
              </button>
              <h1 className="text-xl font-semibold text-purple-400">Notification Settings</h1>
          </div>
        </nav>
      <div className="max-w-4xl mx-auto  py-8 px-4">
        {/* Header Section */}
        <div className="flex items-center gap-5 mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-amber-500 rounded-2xl shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <div className='flex flex-col justify-center'>
            <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-amber-400 bg-clip-text text-transparent">
              Notification Settings
            </h1>
            <p className="text-neutral-300">
              Manage how you receive notifications and stay updated with what matters
            </p>
          </div>
        </div>
        
        <div className='border-b border-neutral-700 mb-8'></div>

        {/* Error message for fetch failure */}
        {fetchError && (
          <div className="bg-red-500/20 border border-red-500/30 text-red-200 p-4 rounded-xl mb-6 flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-medium">Failed to load settings</p>
              <p className="text-sm">{fetchError}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-2 text-sm bg-red-600 hover:bg-red-700 px-3 py-1 rounded-md transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

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
          <div className="px-6 py-8 space-y-8">
            {/* Likes & Reactions Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-xl">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold">Likes & Reactions</h2>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-neutral-800/30 rounded-2xl border border-neutral-700/30 hover:border-neutral-600/50 transition-colors">
                <div className="space-y-1">
                  <h3 className="font-medium">Likes on your posts</h3>
                  <p className="text-sm text-neutral-400">Show notification when someone likes your content</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={settings.showLikeNotifications || false}
                    onChange={() => handleToggle('showLikeNotifications')}
                    disabled={loading}
                  />
                  <div className="w-12 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
            </div>

            {/* Comments Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-xl">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold">Comments</h2>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-neutral-800/30 rounded-2xl border border-neutral-700/30 hover:border-neutral-600/50 transition-colors">
                <div className="space-y-1">
                  <h3 className="font-medium">Comments on your posts</h3>
                  <p className="text-sm text-neutral-400">Show notification when someone comments on your content</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={settings.showCommentNotifications || false}
                    onChange={() => handleToggle('showCommentNotifications')}
                    disabled={loading}
                  />
                  <div className="w-12 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>
            </div>

            {/* Connections Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-xl">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold">Connections</h2>
              </div>
              
              <div className={`flex items-center justify-between p-4 rounded-2xl border transition-colors ${
                settings.accountType === 'private' 
                  ? 'bg-neutral-800/20 border-neutral-700/20' 
                  : 'bg-neutral-800/30 border-neutral-700/30 hover:border-neutral-600/50'
              }`}>
                <div className="space-y-1 flex-1">
                  <h3 className="font-medium">Peer requests</h3>
                  <p className="text-sm text-neutral-400">Accept all peer requests automatically</p>
                  
                  {/* Show message when account is private */}
                  {settings.accountType === 'private' && (
                    <div className="mt-2 p-2 bg-neutral-700/30 rounded-lg">
                      <p className="text-xs text-amber-400">
                        You can only enable this if your account is public
                      </p>
                    </div>
                  )}
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={settings.acceptAllPeersRequest || false}
                    onChange={() => handleToggle('acceptAllPeersRequest')}
                    disabled={loading || settings.accountType === 'private'}
                  />
                  <div className={`w-12 h-6 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${
                    settings.accountType === 'private'
                      ? 'bg-neutral-700/50 cursor-not-allowed'
                      : 'bg-neutral-700 peer-checked:bg-blue-500'
                  }`}></div>
                </label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-6 py-5 bg-neutral-800/60 border-t border-neutral-700/30 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
            <button 
              onClick={handleCancel}
              disabled={!hasChanges || loading}
              className={`px-6 py-3 rounded-xl font-medium transition-colors ${
                !hasChanges || loading
                  ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  : 'bg-neutral-700 text-white hover:bg-neutral-600'
              }`}
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={!hasChanges || loading}
              className={`px-6 py-3 rounded-xl font-medium transition-all shadow-lg flex items-center justify-center ${
                !hasChanges || loading
                  ? 'bg-gray-800 text-neutral-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-amber-500 text-white hover:from-purple-500 hover:to-amber-400 active:scale-95'
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

        <div className="mt-8 text-center text-neutral-400 text-sm">
          <p>Changes to your notification settings will be applied immediately</p>
        </div>
      </div>
    </div>
  );
};

export default NotificationSetting;