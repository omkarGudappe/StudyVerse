import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UserDataContextExport } from '../CurrentUserContexProvider';
import { useNavigate } from 'react-router-dom';

const Privacy = () => {
  const { ProfileData } = UserDataContextExport();
  const id = ProfileData?._id;
  
  const [settings, setSettings] = useState({
    accountType: 'private',
    showOnlineStatus: true,
    acceptAllPeersRequest: false,
  });
  
  const navigate = useNavigate();
  const [originalSettings, setOriginalSettings] = useState({});
  const [saveStatus, setSaveStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const getCurrentPrivacySettings = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setFetchError('');
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/user/setting/${id}`);
        
        if (res.data.ok) {
          const apiSettings = {
            accountType: res.data.settings.accountType,
            showOnlineStatus: res.data.settings.showOnlineStatus !== undefined ? res.data.settings.showOnlineStatus : true,
            acceptAllPeersRequest: res.data.settings.acceptAllPeersRequest,
          };

          console.log(apiSettings);
          
          setSettings(apiSettings);
          setOriginalSettings(apiSettings);
        }
      } catch (err) {
        const errorMsg = err?.response?.data?.message || err.message || 'Failed to load privacy settings';
        console.error(errorMsg);
        setFetchError(errorMsg);
      } finally {
        setLoading(false);
      }
    };
    
    getCurrentPrivacySettings();
  }, [id]);

  useEffect(() => {
    if (Object.keys(originalSettings).length > 0) {
      const changed = Object.keys(settings).some(key => 
        settings[key] !== originalSettings[key]
      );
      setHasChanges(changed);
    }
  }, [settings, originalSettings]);

  const handleSettingChange = (name, value) => {
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
    setSaveStatus({ type: '', message: '' });
  };

  const handlePrivacyChange = (e) => {
    const newPrivacySetting = e.target.value;
    const isPrivate = newPrivacySetting === 'private';
    
    setSettings(prev => ({
      ...prev,
      accountType: newPrivacySetting,
      showOnlineStatus: !isPrivate,
      acceptAllPeersRequest: !isPrivate,
    }));
    setSaveStatus({ type: '', message: '' });
  };

  const handleSave = async () => {
    if (!hasChanges || !id) return;
    
    try {
      setLoading(true);
      setSaveStatus({ type: '', message: '' });
      
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/user/settingsUpdated/${id}`, settings);

      if (res.data.ok) {
        setSaveStatus({ type: 'success', message: res.data.message || 'Privacy settings saved successfully!' });
        setOriginalSettings({...settings});
        setHasChanges(false);
      } else {
        setSaveStatus({ type: 'error', message: res.data.message || 'Failed to save settings' });
      }
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err.message || 'Failed to save privacy settings';
      console.error(errorMsg);
      setSaveStatus({ type: 'error', message: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    const defaultSettings = {
      accountType: 'private',
      showOnlineStatus: true,
    };
    
    setSettings(defaultSettings);
    setSaveStatus({ type: 'info', message: 'Settings reset to defaults. Click Save to apply.' });
  };

  if (loading && Object.keys(settings).length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 to-neutral-800 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-neutral-300">Loading your privacy settings...</p>
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
              <h1 className="text-xl font-semibold text-purple-400">Privacy Settings</h1>
          </div>
        </nav>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="flex items-center gap-5 mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-amber-500 rounded-2xl shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div className='flex flex-col justify-center'>
            <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-amber-400 bg-clip-text text-transparent">
              Privacy Settings
            </h1>
            <p className="text-neutral-300">
              Control your account visibility and data sharing preferences
            </p>
          </div>
        </div>
        
        <div className='border-b border-neutral-700 mb-8'></div>

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

        {saveStatus.message && (
          <div className={`p-4 rounded-xl mb-6 flex items-start ${
            saveStatus.type === 'success' 
              ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-200' 
              : saveStatus.type === 'error'
                ? 'bg-red-500/20 border border-red-500/30 text-red-200'
                : 'bg-purple-500/20 border border-purple-500/30 text-purple-200'
          }`}>
            <svg
              xmlns="http://www.w3.org/2000/svg" 
              className={`h-5 w-5 mr-2 mt-0.5 flex-shrink-0 ${
                saveStatus.type === 'success' 
                  ? 'text-emerald-400' 
                  : saveStatus.type === 'error'
                    ? 'text-red-400'
                    : 'text-purple-400'
              }`} 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              {saveStatus.type === 'success' ? (
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              ) : saveStatus.type === 'error' ? (
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              ) : (
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              )}
            </svg>
            <p>{saveStatus.message}</p>
          </div>
        )}

        <div className="backdrop-blur-sm rounded-3xl overflow-hidden shadow-2xl border border-neutral-700/30">
          <div className="px-6 py-8 space-y-8">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-xl">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                      {settings.accountType === 'private' 
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
                        checked={settings.accountType === 'public'}
                        onChange={handlePrivacyChange}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
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
                        checked={settings.accountType === 'private'}
                        onChange={handlePrivacyChange}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                      />
                      <label htmlFor="private-account" className="ml-2 block text-sm font-medium text-white">
                        Private
                      </label>
                    </div>
                  </div>
                </div>

                <div className={`rounded-lg p-4 mt-4 ${settings.accountType === 'private' ? 'bg-purple-500/10 border border-purple-500/20' : 'bg-amber-500/10 border border-amber-500/20'}`}>
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className={`h-5 w-5 ${settings.accountType === 'private' ? 'text-purple-400' : 'text-amber-400'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className={`text-sm font-medium ${settings.accountType === 'private' ? 'text-purple-300' : 'text-amber-300'}`}>
                        {settings.accountType === 'private' ? 'Private Account' : 'Public Account'}
                      </h3>
                      <div className={`mt-2 text-sm ${settings.accountType === 'private' ? 'text-purple-300/80' : 'text-amber-300/80'}`}>
                        <p>
                          {settings.accountType === 'private' 
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

            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-xl">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold">Privacy Preferences</h2>
              </div>
              
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
                    disabled={loading}
                  />
                  <div className="w-12 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                </label>
              </div>
            </div>
          </div>

          <div className="px-6 py-5 bg-neutral-800/60 border-t border-neutral-700/30 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
            <button 
              onClick={handleReset}
              disabled={loading}
              className={`px-6 py-3 rounded-xl font-medium transition-colors ${
                loading
                  ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  : 'bg-neutral-700 text-white hover:bg-neutral-600'
              }`}
            >
              Reset to Defaults
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

        <div className="mt-8 bg-purple-500/10 border border-purple-500/20 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-lg font-medium text-purple-300 mb-2">Privacy Tips</h3>
              <ul className="list-disc list-inside text-purple-300/80 space-y-2">
                <li>Regularly review your privacy settings to ensure they match your preferences</li>
                <li>Private accounts give you control over who can see your content</li>
                <li>Be mindful of what personal information you share in your posts</li>
                <li>Consider limiting message permissions to followers only for better privacy</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;