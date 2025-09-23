// import React, { useState, useEffect } from 'react'
// import { FcGoogle } from 'react-icons/fc';
// import { auth, googleProvider } from './FirebaseSDK';
// import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
// import { useNavigate } from 'react-router-dom';

// const GoogleProvider = ({ onSuccess, onError, isJustSignIn }) => {
//     const [Loading, setLoading] = useState(false);
//     const Navigate = useNavigate();
//     const [JustSignIn, setJustSignedIn] = useState(false);

//     useEffect(() => {
//         const FetchBackend = async () => {
//             if (JustSignIn && auth.currentUser) {
//                 try {
//                     const response = await fetch(`${import.meta.env.VITE_API_URL}/Auth/google-signin`, {
//                         method: "POST",
//                         headers: {
//                             "Content-Type": "application/json",
//                         },
//                         body: JSON.stringify({
//                             uid: auth.currentUser.uid,
//                         }),
//                     });
                    
//                     const data = await response.json();
//                     console.log("Backend response:", data);
                    
//                     if (data.exist === true) {
//                         if (data.token) {
//                             localStorage.setItem("token", data.token);
//                         }
//                         isJustSignIn(false); // Tell parent this is NOT a new Google sign-in
//                         Navigate('/home');
//                     } else {
//                         isJustSignIn(true); // Tell parent this IS a new Google sign-in
//                         Navigate('/fillprofile');
//                     }
//                 } catch (error) {
//                     console.log("Error checking user:", error.message);
//                     onError && onError({ error: error.message });
//                     // Fallback navigation
//                     Navigate('/fillprofile');
//                 }
//             }
//         };
        
//         FetchBackend();
//     }, [JustSignIn, Navigate, onError, isJustSignIn]);

//     const handleGoogleSignIn = async (e) => {
//         e.preventDefault();
//         if (Loading) return;
//         try {
//             setLoading(true);
//             const result = await signInWithPopup(auth, googleProvider);
//             const credential = GoogleAuthProvider.credentialFromResult(result);
//             const token = credential.accessToken;
//             const user = result.user;

//             if (onSuccess) {
//                 onSuccess({
//                     user,
//                     token,
//                     provider: 'google',
//                 })
//             }
//             setJustSignedIn(true);
//         } catch (err) {
//             if (onError) {
//                 onError({
//                     error: err.message,
//                     provider: 'google',
//                 })
//             }
//         } finally {
//             setLoading(false);
//         }
//     }

//     return (
//         <>
//             <div className=''>
//                 <div className='Border position-absolute top-50 start-50 translate-middle'>
//                     <div className='p-5'>
//                         <button onClick={handleGoogleSignIn} className="flex bg-neutral-800 p-2 items-center justify-center cursor-pointer rounded-5 px-24">
//                             {Loading ? (
//                                 <span className="mr-2">Loading...</span>
//                             ) : (
//                                 <>
//                                     <FcGoogle className='mr-2.5 font-bold text-2xl lg:text-3xl xl:text-3xl ' />
//                                     Sign in with Google
//                                 </>
//                             )}
//                         </button>
//                     </div>
//                 </div>
//             </div>
//         </>
//     )
// }

// export default GoogleProvider









import React, { useState, useEffect } from 'react'
import { FcGoogle } from 'react-icons/fc';
import { auth, googleProvider } from './FirebaseSDK';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const GoogleProvider = ({ onSignInStatus, onError }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // Clear error after 5 seconds
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => {
                setError(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    const handleGoogleSignIn = async (e) => {
        e.preventDefault();
        if (loading) return;

        try {
            setLoading(true);
            setError(null);

            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            // Check if user exists in our database
            const response = await fetch(`${import.meta.env.VITE_API_URL}/Auth/google-signin`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    uid: user.uid,
                    email: user.email,
                    name: user.displayName,
                    photoURL: user.photoURL
                }),
            });

            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status}`);
            }

            const data = await response.json();

            if (data.exist === true) {
                // Existing user - store token and navigate to home
                if (data.token) {
                    localStorage.setItem("token", data.token);
                }
                onSignInStatus && onSignInStatus(false);
                navigate('/home');
            } else {
                // New user - navigate to profile setup
                onSignInStatus && onSignInStatus(true);
                navigate('/fillprofile');
            }

        } catch (err) {
            console.error("Google sign-in error:", err);
            
            let errorMessage = "Failed to sign in with Google. Please try again.";
            
            if (err.code) {
                switch (err.code) {
                    case 'auth/popup-closed-by-user':
                        errorMessage = "Sign-in was cancelled. Please try again.";
                        break;
                    case 'auth/popup-blocked':
                        errorMessage = "Popup was blocked. Please allow popups for this site.";
                        break;
                    case 'auth/network-request-failed':
                        errorMessage = "Network error. Please check your internet connection.";
                        break;
                    case 'auth/too-many-requests':
                        errorMessage = "Too many attempts. Please try again later.";
                        break;
                    case 'auth/user-disabled':
                        errorMessage = "This account has been disabled.";
                        break;
                    default:
                        errorMessage = err.message || errorMessage;
                }
            } else if (err.message.includes('Network Error')) {
                errorMessage = "Network error. Please check your internet connection.";
            }

            setError(errorMessage);
            onError && onError(errorMessage);
            
            setTimeout(() => {
                navigate('/fillprofile');
            }, 2000);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="w-full">
            {error && (
                <div className="mb-4 bg-rose-500/20 border border-rose-500 text-rose-200 px-4 py-3 rounded-lg flex items-center">
                    <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm">{error}</span>
                </div>
            )}

            <button 
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-lg px-6 py-3 font-medium transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
                {loading ? (
                    <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Connecting...
                    </div>
                ) : (
                    <>
                        <FcGoogle className="w-5 h-5 mr-3" />
                        Continue with Google
                    </>
                )}
            </button>

            <div className="relative flex items-center my-6">
                <div className="flex-grow border-t border-gray-600"></div>
                <span className="flex-shrink mx-4 text-gray-400 text-sm">or</span>
                <div className="flex-grow border-t border-gray-600"></div>
            </div>
        </div>
    )
}

export default GoogleProvider;