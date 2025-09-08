// import React , { useState } from 'react'
// import { FcGoogle } from 'react-icons/fc';
// import { auth , googleProvider } from './FirebaseSDK';
// import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
// import { useNavigate } from 'react-router-dom';


// const GoogleProvider = ({ onSuccess, onError }) => {

//     const [Loading , setLoading] = useState(false);
//     const Navigate = useNavigate();

//     const handleGoogleSignIn = async (e) => {
//       e.preventDefault();
//         try{
//             setLoading(true);
//             const result = await signInWithPopup(auth , googleProvider);
//             const credential = GoogleAuthProvider.credentialFromResult(result);
//             const token = credential.accessToken;
//             const user = result.user;

//             if(onSuccess){
//                 onSuccess({
//                     user,
//                     token,
//                     provider: 'google',
//                 })
//             }
//             Navigate('/home');
//         }catch(err){
//             if(onError){
//                 onError({
//                     error: err.message,
//                     provider: 'google',
//                 })
//             }
//         }
//     }

//   return (
//     <>
//         <div className=''>
//           <div className='Border position-absolute top-50 start-50 translate-middle'>
//             <div className='p-5'>
//               <button onClick={handleGoogleSignIn} className="flex bg-neutral-800 p-2 cursor-pointer rounded-5 px-24">
//                 {Loading ? (
//                   <Loading/>
//                 ) : (
//                   <>
//                     <FcGoogle style={{ fontSize: '20px' }} className='mr-2.5' />
//                     Sign in with Google
//                   </>
//                 )}
//               </button>
//             </div>
//           </div>
//         </div>
//     </>
//   )
// }

// export default GoogleProvider




import React , { useState , useEffect } from 'react'
import { FcGoogle } from 'react-icons/fc';
import { auth , googleProvider } from './FirebaseSDK';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const GoogleProvider = ({ onSuccess, onError }) => {
    const [Loading , setLoading] = useState(false);
    const Navigate = useNavigate();
    const [JustSignIn , setJustSignedIn] = useState(false);


    useEffect(() => {
      const FetchBackend = async () => {
        if (JustSignIn) {
          try {
       const response = await fetch(`${import.meta.env.VITE_API_URL}/Auth/google-signin`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
               uid: auth.currentUser.uid,
              }),
            });
            const data = await response.json();
            if (data.exist) {
              console.log(data.exist);
              Navigate('/home');
            } else {
              console.log(data.exist);
              Navigate('/fillprofile');
            }
          } catch (error) {
            console.log(error.message);
            onError && onError({ error: error.message });
          }
        }
      };
      FetchBackend();
      if (JustSignIn && auth.currentUser) {
        console.log("auth" , auth.currentUser.uid);
      }
    }, [JustSignIn]);


    const handleGoogleSignIn = async (e) => {
      e.preventDefault();
      if (Loading) return;
        try{
            setLoading(true);
            const result = await signInWithPopup(auth , googleProvider);
            const credential = GoogleAuthProvider.credentialFromResult(result);
            const token = credential.accessToken;
            const user = result.user;

            if(onSuccess){
                onSuccess({
                    user,
                    token,
                    provider: 'google',
                })
            }
            setJustSignedIn(true);
            // Navigate('/home');
        }catch(err){
            if(onError){
                onError({
                    error: err.message,
                    provider: 'google',
                })
            }
        } finally {
            setLoading(false);
        }
    }

  return (
    <>
        <div className=''>
          <div className='Border position-absolute top-50 start-50 translate-middle'>
            <div className='p-5'>
              <button onClick={handleGoogleSignIn} className="flex bg-neutral-800 p-2 items-center justify-center cursor-pointer rounded-5 px-24">
                {Loading ? (
                  <span className="mr-2">Loading...</span>
                ) : (
                  <>
                    <FcGoogle className='mr-2.5 font-bold text-2xl lg:text-3xl xl:text-3xl ' />
                    Sign in with Google
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
    </>
  )
}

export default GoogleProvider
