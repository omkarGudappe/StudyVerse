import React, { useState, useEffect } from 'react'
import axios from 'axios';
import Socket from "../../../SocketConnection/Socket";
import { auth } from '../../../Auth/AuthProviders/FirebaseSDK';
import { UserDataContextExport } from '../CurrentUserContexProvider';

const PeerButtonManage = ({ currentUser, OtherUser, className }) => {

    const [CurrentUserConnections, setCurrentUserConnections] = useState(null);
    const [OtherUserConnections, setOtherUserConnections] = useState(null);
    const [PeerStatus, setPeerStatus] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const { ProfileData } =UserDataContextExport();

    useEffect(() => {
        const FetchUsersConnections = async () => {
            try {
                setIsLoading(true);
                console.log("Fetching connections for", currentUser, OtherUser , ProfileData?._id);
                const getIds = [currentUser, OtherUser];
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/user/getConnections`, {
                    params: { ids: getIds.join(',') }
                })
                if (res.data.ok) {
                    setCurrentUserConnections(res.data.currentUserData);
                    setOtherUserConnections(res.data.OtherUserData);
                }
            } catch (err) {
                console.log(err?.response?.data?.message || err.message);
            } finally {
                setIsLoading(false);
            }
        }
        FetchUsersConnections();
    }, [currentUser, OtherUser])

    useEffect(() => {
        if (!CurrentUserConnections || !OtherUserConnections) return;

        if (OtherUserConnections.connections?.includes(currentUser)) {
            setPeerStatus({ peeread: true })
        } else if (OtherUserConnections.connectionRequests?.includes(currentUser)) {
            setPeerStatus({ requested: true })
        } else if(currentUser === OtherUser) {
            console.log("It's you");
            setPeerStatus({ self: true });
        } else {
            console.log("No connection");
            setPeerStatus({ peer: true });
        }
    }, [CurrentUserConnections, OtherUserConnections, currentUser])

    useEffect(() => {
        const handleConnectionUpdate = (data) => {
            if (data.userId === OtherUser && data.fromId === currentUser) {
                switch (data.type) {
                    case 'request':
                        setPeerStatus({ requested: true });
                        setOtherUserConnections(prev => ({
                            ...prev,
                            connectionRequests: [...(prev?.connectionRequests || []), currentUser]
                        }));
                        break;
                    case 'cancelRequest':
                    case 'declined':
                        setPeerStatus({ peer: true });
                        setOtherUserConnections(prev => ({
                            ...prev,
                            connectionRequests: prev?.connectionRequests?.filter(id => id !== currentUser) || []
                        }));
                        break;
                    case 'accepted':
                        setPeerStatus({ peeread: true });
                        setOtherUserConnections(prev => ({
                            ...prev,
                            connections: [...(prev?.connections || []), currentUser],
                            connectionRequests: prev?.connectionRequests?.filter(id => id !== currentUser) || []
                        }));
                        break;
                    case 'UnPeer':
                        setPeerStatus({ peer: true });
                        setOtherUserConnections(prev => ({
                            ...prev,
                            connections: prev?.connections?.filter(id => id !== currentUser) || []
                        }));
                        break;
                }
            }
        };

        Socket.on('requestAccepted', (data) => {
            if (data.FromID === OtherUser) {
                setPeerStatus({ peeread: true });
                setOtherUserConnections(prev => ({
                    ...prev,
                    connections: [...(prev?.connections || []), currentUser],
                    connectionRequests: prev?.connectionRequests?.filter(id => id !== currentUser) || []
                }));
            }
        });

        Socket.on('connection-updated', handleConnectionUpdate);

        return () => {
            Socket.off('requestAccepted');
            Socket.off('connection-updated', handleConnectionUpdate);
        };
    }, [currentUser, OtherUser]);

    const handleSendPeerRequest = () => {
        if (auth.currentUser) {
            const title = 'request';
            Socket.emit("Send-Cancel-Request", { Id: OtherUser, fromID: currentUser, title });
            setPeerStatus({
                peeread: false,
                requested: true,
                peer: false,
            });
            setOtherUserConnections(prev => ({
                ...prev,
                connectionRequests: [...(prev?.connectionRequests || []), currentUser]
            }));
        }
    };

    const handleUnPeer = () => {
        if (auth.currentUser) {
            const title = 'UnPeer';
            Socket.emit("Send-Cancel-Request", { Id: OtherUser, fromID: currentUser, title: title });
            setPeerStatus({
                peeread: false,
                requested: false,
                peer: true,
            });
            setOtherUserConnections(prev => ({
                ...prev,
                connections: prev?.connections?.filter(id => id !== currentUser) || []
            }));
        }
    }

    const handleCancelRequest = () => {
        if (auth.currentUser) {
            const title = 'cancelRequest';
            Socket.emit("Send-Cancel-Request", { Id: OtherUser, fromID: currentUser, title: title });
            setPeerStatus({
                peeread: false,
                requested: false,
                peer: true,
            });
            setOtherUserConnections(prev => ({
                ...prev,
                connectionRequests: prev?.connectionRequests?.filter(id => id !== currentUser) || []
            }));
        }
    }

    if (isLoading) {
        return <button className={`${className} flex items-center py-2 w-full bg-neutral-800 justify-center p-2`}><span className="loader"></span></button>
    }

    if (!CurrentUserConnections || !OtherUserConnections) {
        return <button className={`${className} flex  items-center justify-center w-full bg-neutral-800 py-2 p-2`}><span className="loader"></span></button>
    }

    return (
        <div>
            {PeerStatus.peer ? (
                    <button title='Peer' onClick={handleSendPeerRequest} className={`${className} cursor-pointer bg-blue-600 p-2`}>
                        Peer
                    </button>
            ) : PeerStatus.requested ? (
                    <button title='cancel request' onClick={handleCancelRequest} className={` ${className} cursor-pointer bg-gray-700  p-2`}>
                        Requested
                    </button>
            ) : PeerStatus.peeread && (
                    <button title='UnPeer' onClick={handleUnPeer} className={`${className} cursor-pointer bg-blue-900 p-2`}>
                        Peered
                    </button>
            )}
        </div>
    )
}

export default PeerButtonManage