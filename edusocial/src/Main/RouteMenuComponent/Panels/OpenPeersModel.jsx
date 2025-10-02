import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import PeerButtonManage from '../SmallComponents/PeerButtonManage';

const OpenPeersModel = ({ open, onClose, ProfileData, currentUserData, from }) => {
    const [Connections, setConnections] = useState([]);
    const [ConnectionsNetwork, setConnectionsNetwork] = useState([]);
    const [ActiveState, setActiveState] = useState("Peers");
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const FetchPeers = async (id) => {
            if (!ProfileData) return;
            setLoading(true);
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/user/userConnections/${id}`);
                if (res.data.ok) {
                    setConnections(res.data.ConnectionNetWork);
                    setConnectionsNetwork(res.data.Connections);
                }
            } catch (err) {
                console.log(err.message);
            } finally {
                setLoading(false);
            }
        }
        

        if (open && from === 'OtherUser') {
            FetchPeers(ProfileData._id);
        } else if (open && from === 'CurrentUser'){
            FetchPeers(currentUserData?._id);
        }
    }, [ProfileData, open]);

    const getPeerStatus = (id) => {
        if(currentUserData?.MyConnections?.includes(id)){
            return 'Peerad'
        } else if(currentUserData?.connections?.includes(id)) {
            return 'In Peer Network'
        } else {
            return 'Peer'
        }
    }

    const filteredConnections = Connections.filter(connection => {
        const fullName = `${connection?.firstName || ''} ${connection?.lastName || ''}`;
        const education = connection?.education ? connection.education : '';
        return fullName.includes(searchTerm) || education.includes(searchTerm) && User;
    });

    console.log(filteredConnections);

    const filteredNetwork = ConnectionsNetwork.filter(connection => {
        const fullName = `${connection?.firstName || ''} ${connection?.lastName || ''}`;
        const education = connection?.education ? connection.education : '';
        return fullName.includes(searchTerm) || education.includes(searchTerm);
    });

    if (!open) return null;

    return (
        <div className='fixed inset-0 backdrop-blur-sm bg-black/70 z-50 flex items-center justify-center p-4' onClick={onClose}>
            <div className='relative rounded-2xl max-h-[90vh] w-full max-w-md bg-neutral-900 border border-neutral-700 overflow-hidden' onClick={e => e.stopPropagation()}>
                <div className='flex items-center justify-between p-4 border-b border-neutral-700'>
                    <h1 className='text-xl font-bold text-amber-100'>Connections</h1>
                    <button 
                        onClick={onClose}
                        className='p-2 rounded-full hover:bg-neutral-800 transition-colors text-gray-400 hover:text-white'
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
                
                <div className="p-4 border-b border-neutral-700">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search connections..."
                            className="w-full pl-10 pr-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-amber-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                
                <div className='flex border-b border-neutral-700'>
                    <button 
                        onClick={() => setActiveState("Peers")} 
                        className={`flex-1 py-3 text-center transition-colors ${ActiveState === 'Peers' ? 'text-purple-400 border-b-2 border-purple-400 bg-neutral-800' : 'text-gray-400 hover:text-amber-100 hover:bg-neutral-800'}`}
                    >
                        Peers ({Connections.length})
                    </button>
                    <button 
                        onClick={() => setActiveState("PeersConnection")} 
                        className={`flex-1 py-3 text-center transition-colors ${ActiveState === 'PeersConnection' ? 'text-purple-400 border-b-2 border-purple-400 bg-neutral-800' : 'text-gray-400 hover:text-amber-100 hover:bg-neutral-800'}`}
                    >
                        Network ({ConnectionsNetwork.length})
                    </button>
                </div>
                
                <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-600"></div>
                        </div>
                    ) : ActiveState === "Peers" ? (
                        <div className='p-4'>
                            {filteredConnections.length > 0 ? (
                                <div className='grid grid-cols-1 gap-4'>
                                    {filteredConnections.map((connection, index) => (
                                        <div key={index} className='bg-neutral-800 p-4 rounded-lg hover:bg-neutral-750 transition-colors'>
                                            <Link to={connection?._id === currentUserData?._id ? `/profile` : `/profile/${encodeURIComponent(connection.username)}`} onClick={onClose} className='flex items-center gap-3'>
                                                <div className='h-12 w-12 overflow-hidden rounded-full flex-shrink-0'>
                                                    <img 
                                                        src={connection?.UserProfile?.avatar?.url || "https://via.placeholder.com/150"} 
                                                        alt={`${connection?.firstName} ${connection?.lastName}`} 
                                                        className='h-12 w-12 object-cover' 
                                                    />
                                                </div>
                                                <div className='flex-1 min-w-0'>
                                                    <h2 className='font-medium text-amber-100 truncate'>{connection?.firstName} {connection?.lastName}</h2>
                                                    {connection?.education && (
                                                        <div className='text-sm text-neutral-400 flex gap-1 truncate'>
                                                           <p> {connection?.education?.standard || connection?.education?.degree }</p>
                                                            <p>{connection?.education?.stream || connection?.education?.field}</p>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className='flex-shrink-0'>
                                                    <PeerButtonManage className='rounded-2xl w-20' currentUser={ProfileData?._id} OtherUser={connection?._id} />
                                                </div>
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    <p>No connections found</p>
                                    {searchTerm && (
                                        <button 
                                            className="text-purple-400 hover:text-purple-300 mt-2"
                                            onClick={() => setSearchTerm("")}
                                        >
                                            Clear search
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className='p-4'>
                            {filteredNetwork.length > 0 ? (
                                <div className='grid grid-cols-1 gap-4'>
                                    {filteredNetwork.map((connection, index) => (
                                        <div key={index} className='bg-neutral-800 p-4 rounded-lg hover:bg-neutral-750 transition-colors'>
                                            <div className='flex items-center gap-3'>
                                                <div className='h-12 w-12 overflow-hidden rounded-full flex-shrink-0'>
                                                    <img 
                                                        src={connection?.UserProfile?.avatar?.url || "https://via.placeholder.com/150"} 
                                                        alt={`${connection?.firstName} ${connection?.lastName}`} 
                                                        className='h-12 w-12 object-cover' 
                                                    />
                                                </div>
                                                <div className='flex-1 min-w-0'>
                                                    <h2 className='font-medium text-amber-100 truncate'>{connection?.firstName} {connection?.lastName}</h2>
                                                    {connection?.education && (
                                                        <div className='text-sm text-neutral-400 truncate'>
                                                            {connection?.education?.standard}
                                                            {connection?.education.standard || connection?.education?.degree && `, ${connection?.education?.stream || connection?.education?.field}`}
                                                        </div>
                                                    )}
                                                    <div className="text-xs text-purple-400 mt-1">
                                                        Mutual: {connection.mutualConnections || 0} connections
                                                    </div>
                                                </div>
                                                <PeerButtonManage className='rounded-2xl w-20' currentUser={ProfileData?._id} OtherUser={connection?._id} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                    </svg>
                                    <p>No network connections found</p>
                                    {searchTerm && (
                                        <button 
                                            className="text-purple-400 hover:text-purple-300 mt-2"
                                            onClick={() => setSearchTerm("")}
                                        >
                                            Clear search
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default OpenPeersModel