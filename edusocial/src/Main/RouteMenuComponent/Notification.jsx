import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion';
import axios from 'axios';
import Socket from '../../SocketConnection/Socket';
import { UserDataContextExport } from './CurrentUserContexProvider';
import NotificationPanel from './Panels/NotificationPanel';

const Notification = ({ open, onClose, ProfileData }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [activeActions, setActiveActions] = useState({});
    const { FirebaseUid } = UserDataContextExport();

    const NOTIFICATION_TYPES = {
        PEER_REQUEST: 'peer_request',
        MESSAGE: 'message',
        LIKE: 'like',
        COMMENT: 'comment',
        SYSTEM: 'system'
    };

    useEffect(() => {
        if (open) {
            fetchNotifications();
        }
    }, [open, FirebaseUid]);

    useEffect(() => {
        Socket.on('requestAccepted', (data) => {
            if (data.FromID) {
                setNotifications(prev => prev.filter(notification => 
                    notification.sender?._id !== data.FromID && 
                    notification.type === NOTIFICATION_TYPES.PEER_REQUEST
                ));
                setActiveActions(prev => ({ ...prev, [data.FromID]: false }));
            }
        });

        Socket.on('newNotification', (newNotification) => {
            setNotifications(prev => [newNotification, ...prev]);
        });

        return () => {
            Socket.off('requestAccepted');
            Socket.off('newNotification');
        };
    }, []);

    const fetchNotifications = async () => {
        setError(null);
        setIsLoading(true);
        const ID = ProfileData?.Uid || FirebaseUid;
        
        try {
            const Response = await axios.get(`${import.meta.env.VITE_API_URL}/user/${ID}/notifications`);
            const result = Response.data;
            
            if (result.ok) {
                setNotifications(result.notifications || result.notifications || []);
            } else {
                throw new Error(result.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load notifications");
            console.error("Error fetching notifications:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAccept = (senderId) => {
        const ID = ProfileData?._id ;
        setActiveActions(prev => ({ ...prev, [senderId]: 'accepting' }));
        Socket.emit("acceptRequest", { Id: ID, fromID: senderId });
    };

    const handleDecline = (senderId) => {
        const ID = ProfileData?._id ;
        setActiveActions(prev => ({ ...prev, [senderId]: 'declining' }));
        Socket.emit("declineRequest", { Id: ID, fromID: senderId });
        
        setNotifications(prev => prev.filter(notification => 
            notification.sender?._id !== senderId
        ));
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case NOTIFICATION_TYPES.PEER_REQUEST: return '👥';
            case NOTIFICATION_TYPES.MESSAGE: return '💬';
            case NOTIFICATION_TYPES.LIKE: return '❤️';
            case NOTIFICATION_TYPES.COMMENT: return '💭';
            case NOTIFICATION_TYPES.SYSTEM: return '📢';
            default: return '🔔';
        }
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);
        
        if (diffInHours < 1) return 'Just now';
        if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
        if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
        return date.toLocaleDateString();
    };

    const markAsRead = async (notificationId) => {
        try {
            await axios.patch(`${import.meta.env.VITE_API_URL}/notifications/${notificationId}/read`);
            setNotifications(prev => prev.map(notif => 
                notif._id === notificationId ? { ...notif, read: true } : notif 
            ));
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    };

    const clearAllNotifications = async () => {
        try {
            const ID = ProfileData?.Uid || FirebaseUid;
            await axios.delete(`${import.meta.env.VITE_API_URL}/user/${ID}/notifications`);
            setNotifications([]);
        } catch (error) {
            console.error("Error clearing notifications:", error);
        }
    };

    const NotificationSkeleton = () => (
        <div className="animate-pulse">
            {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 p-4 bg-neutral-800 rounded-xl mb-3">
                    <div className="w-12 h-12 bg-neutral-700 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-neutral-700 rounded w-3/4"></div>
                        <div className="h-3 bg-neutral-700 rounded w-1/2"></div>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <NotificationPanel 
            open={open} 
            onClose={onClose} 
            notifications={notifications}
        >
            <div className="p-6 z-50">
                {isLoading ? (
                    <NotificationSkeleton />
                ) : error ? (
                    <div className="text-center py-12 px-6">
                        <div className="bg-red-500/10 p-4 rounded-xl mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-red-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-red-400 mb-4">{error}</p>
                            <button
                                onClick={fetchNotifications}
                                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                ) : notifications.length > 0 ? (
                    <div className="p-4 space-y-3">
                        {notifications.map((notification, index) => (
                            <motion.div
                                key={notification._id || index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={`p-4 rounded-xl border transition-all duration-200 ${
                                    notification.read 
                                        ? 'bg-neutral-800 border-neutral-700' 
                                        : 'bg-neutral-800/50 border-purple-500/30 shadow-lg shadow-purple-500/10'
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="text-2xl">
                                      <div className='flex flex-col'>
                                        {getNotificationIcon(notification.type)}
                                        <div className='h-10 w-10 overflow-hidden rounded-full'>
                                          <img src={notification?.sender?.avatar} className='object-cover h-full w-full' alt="" />
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="text-white font-semibold text-sm">
                                                {notification?.sender?.firstName} {notification?.sender?.lastName}
                                            </h3>
                                            <span className="text-xs text-neutral-400">
                                                {formatTime(notification.createdAt)}
                                            </span>
                                        </div>
                                        <p className="text-neutral-300 text-sm mb-3">
                                            {notification.message || `You have a new peer request from ${notification.sender?.firstName}`}
                                        </p>
                                        
                                        {notification.type === NOTIFICATION_TYPES.PEER_REQUEST && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleAccept(notification.sender?._id)}
                                                    disabled={activeActions[notification.sender?._id]}
                                                    className={`px-4 py-2 cursor-pointer rounded-lg text-sm font-medium transition-all duration-200 ${
                                                        activeActions[notification.sender?._id] === 'accepting'
                                                            ? 'bg-green-600 text-white'
                                                            : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                                    }`}
                                                >
                                                    {activeActions[notification.sender?._id] === 'accepting' ? 'Accepting...' : 'Accept'}
                                                </button>
                                                <button
                                                    onClick={() => handleDecline(notification.sender?._id)}
                                                    disabled={activeActions[notification.sender?._id]}
                                                    className={`px-4 py-2 rounded-lg text-sm cursor-pointer font-medium transition-all duration-200 ${
                                                        activeActions[notification.sender?._id] === 'declining'
                                                            ? 'bg-red-600 text-white'
                                                            : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                                    }`}
                                                >
                                                    Decline
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 px-6">
                        <div className="bg-neutral-800/50 p-8 rounded-xl">
                            <div className="text-6xl mb-4">🔔</div>
                            <h3 className="text-white font-semibold mb-2">No notifications yet</h3>
                            <p className="text-neutral-400">You're all caught up! Notifications will appear here.</p>
                        </div>
                    </div>
                )}
            </div>
        </NotificationPanel>
    );
};

export default Notification;