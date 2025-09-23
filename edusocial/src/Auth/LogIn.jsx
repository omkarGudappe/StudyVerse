// import React, { useState, useEffect, useRef } from "react";
// import { EmailContextExport } from "./AuthProviders/EmailContexProvider";
// import { useNavigate } from "react-router-dom";
// import GoogleProvider from "./AuthProviders/GoogleProvider";
// import getFirebaseErrorMessage from '../Auth/AuthProviders/FirebaseError';
// import { auth } from '../Auth/AuthProviders/FirebaseSDK';

// const LogIn = () => {
//   const [Email, setEmail] = useState(null);
//   const [Password, setPassword] = useState(null);
//   const [IsLogin, setIsLogin] = useState(true);
//   const [error, setError] = useState([]);
//   const [Loading, setLoading] = useState(false);
//   const { Login, SignUp, NewUser } = EmailContextExport();
//   const [EnterOtp, setEnterOtp] = useState(false);
//   const [hidePassword, setHidePassword] = useState(false);
//   const [ChidePassword, setCHidePassword] = useState(false);
//   const [OTP, setOTP] = useState(new Array(6).fill(""));
//   const [JustSignIn , setJustSignedIn] = useState(false);
//   const Navigate = useNavigate();
//   const [ConformPassword, setConformPassword] = useState(null);
//   const [CheckIsJustSignInByGoogle , setCheckIsJustSignInByGoogle] = useState(false);
//   const InputOtpRef = useRef([]);

//   useEffect(() => {
//       const unsubscribe = auth.onAuthStateChanged((user) => {
//           if (user && !CheckIsJustSignInByGoogle) {
//               // Only auto-navigate if it's NOT a new Google sign-in
//               Navigate("/home");
//           }
//       });
//       return () => unsubscribe();
//   }, [Navigate, CheckIsJustSignInByGoogle]);


//   const handleSubmit = async () => {
//     if (IsLogin) {
//       try {
//         if (!Email || !Password) {
//           throw new Error("Please Fill all fields");
//         }
//         setLoading(true);
//         const data = await Login(Email, Password);
//         if (data.user) {
//           Navigate("/home");
//         } else {
//           throw new Error("Invalid email or password");
//         }
//       } catch (err) {
//         setError((preve) => [
//           ...preve,
//           { error: getFirebaseErrorMessage(err) || err.message, timestamp: new Date().toISOString() },
//         ]);
//       } finally {
//         setLoading(false);
//       }
//     } else {
//       try {
//         if (!Email || !Password || !ConformPassword) {
//           throw new Error("Please Fill all fields");
//         }

//         const regex =
//           /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

//         if (!regex.test(Password)) {
//           throw new Error(
//             "Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character."
//           );
//         }

//         if (Password !== ConformPassword) {
//           throw new Error("Password Does not match");
//         }
//         setLoading(true);
//         const res = await SignUp(Email);
//         console.log("SignUp Response:", res);
//         if (res.status) {
//           setLoading(false);
//           setEnterOtp(true);
//           console.log("Hello from the loading", EnterOtp);
//         } else {
//           throw new Error("Invalid email or password");
//         }
//       } catch (err) {
//         setError((preve) => [
//           ...preve,
//           { error: getFirebaseErrorMessage(err) || err.message, timestamp: new Date().toISOString() },
//         ]);
//       } finally {
//         setLoading(false);
//       }
//     }
//   };

//   const VerifyOTP = async () => {
//     try{
//       const otp = OTP.join("");
//       if(otp.length !== 6){
//         throw new Error("Please enter a valid 6-digit OTP");
//       }
//       setLoading(true);
//       const Data = await fetch(`${import.meta.env.VITE_API_URL}/Auth/verify-otp` , {
//         method: "POST",
//         headers: { "Content-type": "application/json" },
//         body: JSON.stringify({ otp , email: Email}),
//       })

//       const result = await Data.json();

//       if(result.ok){
//         const data = await NewUser(Email , Password);
//         if(data.ok){
//           if (data.token) {
//               localStorage.setItem("token", data.token);
//           }
//           setEnterOtp(false);
//           setEmail(null);
//           setPassword(null);
//           setConformPassword(null);
//           setOTP(new Array(6).fill(""));
//           setLoading(false);
//           setJustSignedIn(true);
//           setCheckIsJustSignInByGoogle(false);
//           Navigate("/fillprofile");
//         }else{
//           throw new Error(data.error || "Failed to create user");
//         }
//       }else{
//         throw new Error(result.message || "Failed to verify OTP");
//       }
//     }catch(err){
//       setError((prev) => [
//         ...prev,
//         { error: getFirebaseErrorMessage(err) || err.message, timestamp: new Date().toISOString() },
//       ]);
//     }finally{
//       setLoading(false);
//     }
//   } 

//   // useEffect(() => {
//   //   if (error?.length > 0) {
//   //     const timer = setTimeout(() => {
//   //       setError((prev) => prev.slice(1));
//   //     }, 9000);
//   //     return () => clearTimeout(timer);
//   //   }
//   // }, [error]);

//   // useEffect(() => {
//   //   console.log(CheckIsJustSignInByGoogle);
//   // }, [CheckIsJustSignInByGoogle])

//   const handleData =(data) => {
//     setCheckIsJustSignInByGoogle(data);
//   }

//   return (
//     <>
//       <div className="flex justify-center items-center flex-col lg:flex-row lg:px-10 gap-x-50 h-screen bg-neutral-900">
//         <div className="h-auto w-auto flex items-center justify-center gap-0 flex-col">
//           <div className="overflow-hidden flex items-center justify-center h-auto  ">
//             <img src="/LOGO/StudyVerseLogo2.png" className="h-40 w-60 lg:h-60 lg:w-80" alt="LOGO" />
//           </div>
//           <p className="text-white text-center">
//             Welcome to StudyVerse, your go-to platform for all your educational needs.
//           </p>
//         </div>
//         <div className="flex justify-center items-center flex-col gap-5">
//         <GoogleProvider isJustSignIn={handleData}/>
//           <div className="border-2 border-neutral-800 h-auto py-5 w-auto px-5 flex justify-center items-center flex-col gap-5">
//             <h1 className="text-white text-2xl font-bold">
//               {IsLogin ? "Login" : "SignIn"}
//             </h1>
//             <form className="flex justify-center items-center flex-col gap-5">
//               <input
//                 disabled={EnterOtp ? true : false}
//                 type="text"
//                 placeholder="Enter Your Email"
//                 value={Email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 className={` ${EnterOtp ? 'bg-neutral-950' : 'bg-neutral-800'}  text-white p-2 rounded-md h-12 w-80 focus:outline-none border-none`}
//               />
//               <div className="relative">
//                 <input
//                   disabled={EnterOtp ? true : false}
//                   type={hidePassword ? "text" : "password"}
//                   placeholder="Enter Your Password"
//                   value={Password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   className={` ${EnterOtp ? 'bg-neutral-950' : 'bg-neutral-800'}  text-white p-2 rounded-md h-12 w-80 focus:outline-none border-none`}
//                 />
//                 <button
//                   onClick={(e) => {
//                     e.preventDefault();
//                     setHidePassword(!hidePassword);
//                   }}
//                   className="absolute right-2 top-4 cursor-pointer"
//                 >
//                   {hidePassword ? (
//                     <svg
//                       xmlns="http://www.w3.org/2000/svg"
//                       width="20"
//                       height="20"
//                       fill="currentColor"
//                       viewBox="0 0 16 16"
//                     >
//                       <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z" />
//                       <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z" />
//                     </svg>
//                   ) : (
//                     <svg
//                       xmlns="http://www.w3.org/2000/svg"
//                       width="20"
//                       height="20"
//                       fill="currentColor"
//                       viewBox="0 0 16 16"
//                     >
//                       <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l.708.709z" />
//                       <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z" />
//                       <path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12-.708.708z" />
//                     </svg>
//                   )}
//                 </button>
//               </div>
//               {!IsLogin && (
//                 <div className="relative">
//                   <input
//                     disabled={EnterOtp ? true : false}
//                     placeholder="Confirm Password"
//                     type={ChidePassword ? "text" : "password"}
//                     value={ConformPassword}
//                     onChange={(e) => setConformPassword(e.target.value)}
//                     className={` ${EnterOtp ? 'bg-neutral-950' : 'bg-neutral-800'}  text-white p-2 rounded-md h-12 w-80 focus:outline-none border-none`}
//                   />
//                   <button
//                     onClick={(e) => {
//                       e.preventDefault();
//                       setCHidePassword(!ChidePassword);
//                     }}
//                     className="absolute right-2 top-4 cursor-pointer"
//                   >
//                     {ChidePassword ? (
//                       <svg
//                         xmlns="http://www.w3.org/2000/svg"
//                         width="20"
//                         height="20"
//                         fill="currentColor"
//                         viewBox="0 0 16 16"
//                       >
//                         <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z" />
//                         <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z" />
//                       </svg>
//                     ) : (
//                       <svg
//                         xmlns="http://www.w3.org/2000/svg"
//                         width="20"
//                         height="20"
//                         fill="currentColor"
//                         viewBox="0 0 16 16"
//                       >
//                         <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l.708.709z" />
//                         <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z" />
//                         <path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12-.708.708z" />
//                       </svg>
//                     )}
//                   </button>
//                 </div>
//               )}

//                 {EnterOtp && (
//                   <div className="flex gap-4 flex-col">
//                     <div className="flex items-center justify-center gap-4">
//                       {OTP.map((value, index) => (
//                         <input
//                           className="h-10 w-10 text-center bg-neutral-800 text-white rounded-md "
//                           ref={(el) => (InputOtpRef.current[index] = el)}
//                           key={index}
//                           maxLength="1"
//                           value={value}
//                           onChange={(e) => {
//                             if (!/^\d?$/.test(e.target.value)) return;
//                             const newOTP = [...OTP];
//                             newOTP[index] = e.target.value;
//                             setOTP(newOTP);
//                             if (e.target.value) {
//                               InputOtpRef.current[index + 1]?.focus();
//                             }
//                           }}
//                           onKeyDown={(e) => {
//                             if (e.key === "Backspace" && !value) {
//                               InputOtpRef.current[index - 1]?.focus();
//                             }
//                           }}
//                         />
//                       ))}
//                     </div>
//                     <div className="flex justify-end itmes-end">
//                       <button className="text-blue-500 cursor-pointer" onClick={(e) => {e.preventDefault(); handleSubmit();}}>Resend OTP</button>
//                     </div>
//                   </div>)
//                 }

//               <div className="flex gap-5">
//                 {!EnterOtp ? <button
//                   onClick={(e) => {
//                     e.preventDefault();
//                     handleSubmit();
//                   }}
//                   disabled={Loading ? true : false}
//                   className={`bg-gradient-to-bl to-[#e56cfd] from-[#7144e4] text-white p-2 rounded-md active:scale-90 ${
//                     Loading ? "cursor-not-allowed" : "cursor-pointer"
//                   } w-25`}
//                   type="submit"
//                 >
//                   {Loading ? (
//                     <div className="flex items-center justify-center">
//                       <svg
//                         className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
//                         xmlns="http://www.w3.org/2000/svg"
//                         fill="none"
//                         viewBox="0 0 24 24"
//                       >
//                         <circle
//                           className="opacity-25"
//                           cx="12"
//                           cy="12"
//                           r="10"
//                           stroke="currentColor"
//                           strokeWidth="4"
//                         ></circle>
//                         <path
//                           className="opacity-75"
//                           fill="currentColor"
//                           d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//                         ></path>
//                       </svg>
//                       sending.
//                     </div>
//                   ) : IsLogin ? (
//                     "Log In"
//                   ) : (
//                     "Sign In"
//                   )}
//                 </button> : 
//                 <button 
//                   onClick={(e) => {
//                     e.preventDefault();
//                     VerifyOTP();
//                   }}
//                   disabled={Loading ? true : false}
//                   className={`bg-gradient-to-bl to-[#e56cfd] from-[#7144e4] text-white p-2 rounded-md active:scale-90 ${
//                     Loading ? "cursor-not-allowed" : "cursor-pointer"
//                   } w-25`}
//                   type="submit"
//                 >
//                   {Loading ? (
//                     <div className="flex items-center justify-center">
//                       <svg
//                         className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
//                         xmlns="http://www.w3.org/2000/svg"
//                         fill="none"
//                         viewBox="0 0 24 24"
//                       >
//                         <circle
//                           className="opacity-25"
//                           cx="12"
//                           cy="12"
//                           r="10"
//                           stroke="currentColor"
//                           strokeWidth="4"
//                         ></circle>
//                         <path
//                           className="opacity-75"
//                           fill="currentColor"
//                           d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//                         ></path>
//                       </svg>
//                       sending.
//                     </div>
//                   ) : "Verify OTP"}
//                 </button>}
//                 {!EnterOtp && <button
//                   className="bg-red-500 text-white p-2 rounded-md active:scale-90 cursor-pointer w-25"
//                   onClick={(e) => {
//                     e.preventDefault();
//                     setEmail("");
//                     setPassword("");
//                     setConformPassword("");
//                     setError("");
//                   }}
//                 >
//                   Clear
//                 </button>}
//               </div>
//             </form>
//             {error &&
//               error.map((err, index) => (
//                 <p className="text-red-500" key={index}>
//                   {err.error}
//                 </p>
//               ))}
//             {!EnterOtp ? ( <p className="text-white">
//               {IsLogin ? "Create new account" : "Already have an account?"}{" "}
//               <button
//                 className="text-blue-400 cursor-pointer "
//                 onClick={() => setIsLogin(!IsLogin)}
//               >
//                 {IsLogin ? "Sing In" : "Log In"}
//               </button>
//             </p>) : (
//               <p className="text-white">
//                 {"Change "}
//                 <button
//                   className="text-blue-400 cursor-pointer "
//                   onClick={() => setEnterOtp(!EnterOtp)}
//                 >
//                   Email
//                 </button>
//               </p>
//             )}
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };

// export default LogIn;







import React, { useState, useEffect, useRef } from "react";
import { EmailContextExport } from "./AuthProviders/EmailContexProvider";
import { useNavigate } from "react-router-dom";
import GoogleProvider from "./AuthProviders/GoogleProvider";
import getFirebaseErrorMessage from '../Auth/AuthProviders/FirebaseError';
import { auth } from '../Auth/AuthProviders/FirebaseSDK';

const LogIn = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [isLogin, setIsLogin] = useState(true);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const { Login, SignUp, NewUser } = EmailContextExport();
  const [enterOtp, setEnterOtp] = useState(false);
  const [hidePassword, setHidePassword] = useState(false);
  const [hideConfirmPassword, setHideConfirmPassword] = useState(false);
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [checkIsJustSignInByGoogle, setCheckIsJustSignInByGoogle] = useState(false);
  const navigate = useNavigate();
  const otpInputRefs = useRef([]);

  // Clear errors after 5 seconds
  useEffect(() => {
    if (errors.length > 0) {
      const timer = setTimeout(() => {
        setErrors(prev => prev.slice(1));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errors]);

  // Auto-navigate if user is already authenticated
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user && !checkIsJustSignInByGoogle) {
        navigate("/home");
      }
    });
    return () => unsubscribe();
  }, [navigate, checkIsJustSignInByGoogle]);

  const addError = (message) => {
    const errorObj = { 
      error: message, 
      timestamp: new Date().toISOString(),
      id: Date.now() + Math.random()
    };
    setErrors(prev => [...prev, errorObj]);
  };

  const clearErrors = () => {
    setErrors([]);
  };

  const validateForm = () => {
    const newErrors = [];

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.push("Email address is required");
    } else if (!emailRegex.test(formData.email)) {
      newErrors.push("Please enter a valid email address");
    }

    // Password validation
    if (!formData.password) {
      newErrors.push("Password is required");
    }

    if (!isLogin) {
      // Signup specific validations
      if (!formData.confirmPassword) {
        newErrors.push("Please confirm your password");
      }

      if (formData.password && formData.password.length < 8) {
        newErrors.push("Password must be at least 8 characters long");
      } else if (formData.password) {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(formData.password)) {
          newErrors.push("Password must contain uppercase, lowercase, number, and special character");
        }
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.push("Passwords do not match");
      }
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearErrors();

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      validationErrors.forEach(error => addError(error));
      return;
    }

    try {
      setLoading(true);

      if (isLogin) {
        // Login flow
        const data = await Login(formData.email, formData.password);
        if (data.user) {
          navigate("/home");
        } else {
          addError("Invalid email or password");
        }
      } else {
        // Signup flow
        const res = await SignUp(formData.email);
        if (res.status) {
          setEnterOtp(true);
        } else {
          addError("Failed to send verification email. Please try again.");
        }
      }
    } catch (err) {
      const errorMessage = getFirebaseErrorMessage(err) || err.message || "An unexpected error occurred";
      addError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    const otpString = otp.join("");
    
    if (otpString.length !== 6) {
      addError("Please enter a valid 6-digit OTP");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/Auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: otpString, email: formData.email }),
      });

      const result = await response.json();

      if (result.ok) {
        const data = await NewUser(formData.email, formData.password);
        if (data.ok) {
          if (data.token) {
            localStorage.setItem("token", data.token);
          }
          // Reset form and navigate
          setFormData({ email: "", password: "", confirmPassword: "" });
          setOtp(new Array(6).fill(""));
          setEnterOtp(false);
          setCheckIsJustSignInByGoogle(false);
          navigate("/fillprofile");
        } else {
          addError(data.error || "Failed to create account");
        }
      } else {
        addError(result.message || "Invalid OTP code");
      }
    } catch (err) {
      addError(getFirebaseErrorMessage(err) || "Failed to verify OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const resendOtp = async () => {
    try {
      setLoading(true);
      await SignUp(formData.email);
      addError("Verification code sent successfully!");
    } catch (err) {
      addError(getFirebaseErrorMessage(err) || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setFormData({ email: "", password: "", confirmPassword: "" });
    setOtp(new Array(6).fill(""));
    clearErrors();
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    clearForm();
    setEnterOtp(false);
  };

  const handleGoogleSignInStatus = (status) => {
    setCheckIsJustSignInByGoogle(status);
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-white flex flex-col lg:flex-row items-center justify-center lg:px-10 lg:gap-20 p-4">
      {/* Left Section - Branding */}
      <div className="flex flex-col items-center text-center mb-8 lg:mb-0 lg:max-w-md">
        <div className="mb-6">
          <img 
            src="/LOGO/StudyVerseLogo2.png" 
            className="h-32 w-48 lg:h-48 lg:w-64" 
            alt="StudyVerse Logo" 
          />
        </div>
        <p className="text-gray-300 text-lg leading-relaxed">
          Welcome to StudyVerse, your go-to platform for all your educational needs. 
          Join thousands of students learning together.
        </p>
      </div>

      {/* Right Section - Login Form */}
      <div className="w-full max-w-md">
        <GoogleProvider onSignInStatus={handleGoogleSignInStatus} />
        
        <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-6 mt-6 shadow-2xl">
          <h1 className="text-2xl font-bold text-white text-center mb-6">
            {enterOtp ? "Verify Your Email" : (isLogin ? "Welcome Back" : "Create Account")}
          </h1>

          {/* Error Messages */}
          {errors.length > 0 && (
            <div className="mb-4 space-y-2">
              {errors.map((err) => (
                <div 
                  key={err.id} 
                  className="bg-rose-500/20 border border-rose-500 text-rose-200 px-4 py-3 rounded-lg flex items-start"
                >
                  <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">{err.error}</span>
                </div>
              ))}
            </div>
          )}

          <form className="space-y-4">
            {/* Email Input */}
            <div>
              <input
                disabled={enterOtp}
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full bg-neutral-700 text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-neutral-900 disabled:cursor-not-allowed"
              />
            </div>

            {/* Password Inputs */}
            {!enterOtp && (
              <>
                <div className="relative">
                  <input
                    type={hidePassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full bg-neutral-700 text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setHidePassword(!hidePassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {hidePassword ? "🙈" : "👁️"}
                  </button>
                </div>

                {!isLogin && (
                  <div className="relative">
                    <input
                      type={hideConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full bg-neutral-700 text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setHideConfirmPassword(!hideConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {hideConfirmPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                )}
              </>
            )}

            {/* OTP Input */}
            {enterOtp && (
              <div className="space-y-4">
                <div className="text-center text-gray-300 mb-4">
                  We sent a 6-digit code to {formData.email}
                </div>
                <div className="flex justify-center space-x-2">
                  {otp.map((value, index) => (
                    <input
                      key={index}
                      ref={(el) => (otpInputRefs.current[index] = el)}
                      type="text"
                      maxLength="1"
                      value={value}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-12 h-12 text-center bg-neutral-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xl"
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={resendOtp}
                  className="text-indigo-400 hover:text-indigo-300 text-sm float-right"
                  disabled={loading}
                >
                  Resend Code
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-2">
              {!enterOtp ? (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {isLogin ? "Signing In..." : "Sending Code..."}
                    </div>
                  ) : (
                    isLogin ? "Sign In" : "Send Verification Code"
                  )}
                </button>
              ) : (
                <button
                  onClick={verifyOtp}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white p-3 rounded-lg hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Verifying...
                    </div>
                  ) : "Verify & Create Account"}
                </button>
              )}
              
              {!enterOtp && (
                <button
                  type="button"
                  onClick={clearForm}
                  className="px-6 bg-neutral-700 text-white p-3 rounded-lg hover:bg-neutral-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition duration-200"
                  disabled={loading}
                >
                  Clear
                </button>
              )}
            </div>
          </form>

          {/* Mode Toggle */}
          <div className="text-center mt-6 pt-4 border-t border-neutral-700">
            <p className="text-gray-400">
              {enterOtp ? (
                <>
                  Wrong email?{" "}
                  <button
                    onClick={() => setEnterOtp(false)}
                    className="text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    Change Email
                  </button>
                </>
              ) : (
                <>
                  {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                  <button
                    onClick={toggleMode}
                    className="text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    {isLogin ? "Sign Up" : "Sign In"}
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogIn;