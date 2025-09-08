import React, { useState, useEffect, useRef } from "react";
import { EmailContextExport } from "./AuthProviders/EmailContexProvider";
import { useNavigate } from "react-router-dom";
import GoogleProvider from "./AuthProviders/GoogleProvider";
import getFirebaseErrorMessage from '../Auth/AuthProviders/FirebaseError';
import { auth } from '../Auth/AuthProviders/FirebaseSDK';

const LogIn = () => {
  const [Email, setEmail] = useState(null);
  const [Password, setPassword] = useState(null);
  const [IsLogin, setIsLogin] = useState(true);
  const [error, setError] = useState([]);
  const [Loading, setLoading] = useState(false);
  const { Login, SignUp, NewUser } = EmailContextExport();
  const [EnterOtp, setEnterOtp] = useState(false);
  const [hidePassword, setHidePassword] = useState(false);
  const [ChidePassword, setCHidePassword] = useState(false);
  const [OTP, setOTP] = useState(new Array(6).fill(""));
  const [JustSignIn , setJustSignedIn] = useState(false);
  const Navigate = useNavigate();
  const [ConformPassword, setConformPassword] = useState(null);
  const [CheckIsJustSignInByGoogle , setCheckIsJustSignInByGoogle] = useState(false);
  const InputOtpRef = useRef([]);

  useEffect(() => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
          if (user && !CheckIsJustSignInByGoogle) {
              // Only auto-navigate if it's NOT a new Google sign-in
              Navigate("/home");
          }
      });
      return () => unsubscribe();
  }, [Navigate, CheckIsJustSignInByGoogle]);


  const handleSubmit = async () => {
    if (IsLogin) {
      try {
        if (!Email || !Password) {
          throw new Error("Please Fill all fields");
        }
        setLoading(true);
        const data = await Login(Email, Password);
        if (data.user) {
          Navigate("/home");
        } else {
          throw new Error("Invalid email or password");
        }
      } catch (err) {
        setError((preve) => [
          ...preve,
          { error: getFirebaseErrorMessage(err) || err.message, timestamp: new Date().toISOString() },
        ]);
      } finally {
        setLoading(false);
      }
    } else {
      try {
        if (!Email || !Password || !ConformPassword) {
          throw new Error("Please Fill all fields");
        }

        const regex =
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

        if (!regex.test(Password)) {
          throw new Error(
            "Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character."
          );
        }

        if (Password !== ConformPassword) {
          throw new Error("Password Does not match");
        }
        setLoading(true);
        const res = await SignUp(Email);
        console.log("SignUp Response:", res);
        if (res.status) {
          setLoading(false);
          setEnterOtp(true);
          console.log("Hello from the loading", EnterOtp);
        } else {
          throw new Error("Invalid email or password");
        }
      } catch (err) {
        setError((preve) => [
          ...preve,
          { error: getFirebaseErrorMessage(err) || err.message, timestamp: new Date().toISOString() },
        ]);
      } finally {
        setLoading(false);
      }
    }
  };

  const VerifyOTP = async () => {
    try{
      const otp = OTP.join("");
      if(otp.length !== 6){
        throw new Error("Please enter a valid 6-digit OTP");
      }
      setLoading(true);
      const Data = await fetch(`${import.meta.env.VITE_API_URL}/Auth/verify-otp` , {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify({ otp , email: Email}),
      })

      const result = await Data.json();

      if(result.ok){
        const data = await NewUser(Email , Password);
        if(data.ok){
          setEnterOtp(false);
          setEmail(null);
          setPassword(null);
          setConformPassword(null);
          setOTP(new Array(6).fill(""));
          setLoading(false);
          setJustSignedIn(true);
          setCheckIsJustSignInByGoogle(false);
          Navigate("/fillprofile");
        }else{
          throw new Error(data.error || "Failed to create user");
        }
      }else{
        throw new Error(result.message || "Failed to verify OTP");
      }
    }catch(err){
      setError((prev) => [
        ...prev,
        { error: getFirebaseErrorMessage(err) || err.message, timestamp: new Date().toISOString() },
      ]);
    }finally{
      setLoading(false);
    }
  } 

  // useEffect(() => {
  //   if (error?.length > 0) {
  //     const timer = setTimeout(() => {
  //       setError((prev) => prev.slice(1));
  //     }, 9000);
  //     return () => clearTimeout(timer);
  //   }
  // }, [error]);

  // useEffect(() => {
  //   console.log(CheckIsJustSignInByGoogle);
  // }, [CheckIsJustSignInByGoogle])

  const handleData =(data) => {
    setCheckIsJustSignInByGoogle(data);
  }

  return (
    <>
      <div className="flex justify-center items-center flex-col lg:flex-row lg:px-10 gap-x-50 h-screen bg-neutral-900">
        <div className="h-auto w-auto flex items-center justify-center gap-0 flex-col">
          <div className="overflow-hidden flex items-center justify-center h-auto  ">
            <img src="/LOGO/StudyVerseLogo2.png" className="h-40 w-60 lg:h-60 lg:w-80" alt="LOGO" />
          </div>
          <p className="text-white text-center">
            Welcome to StudyVerse, your go-to platform for all your educational needs.
          </p>
        </div>
        <div className="flex justify-center items-center flex-col gap-5">
        <GoogleProvider isJustSignIn={handleData}/>
          <div className="border-2 border-neutral-800 h-auto py-5 w-auto px-5 flex justify-center items-center flex-col gap-5">
            <h1 className="text-white text-2xl font-bold">
              {IsLogin ? "Login" : "SignIn"}
            </h1>
            <form className="flex justify-center items-center flex-col gap-5">
              <input
                disabled={EnterOtp ? true : false}
                type="text"
                placeholder="Enter Your Email"
                value={Email}
                onChange={(e) => setEmail(e.target.value)}
                className={` ${EnterOtp ? 'bg-neutral-950' : 'bg-neutral-800'}  text-white p-2 rounded-md h-12 w-80 focus:outline-none border-none`}
              />
              <div className="relative">
                <input
                  disabled={EnterOtp ? true : false}
                  type={hidePassword ? "text" : "password"}
                  placeholder="Enter Your Password"
                  value={Password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={` ${EnterOtp ? 'bg-neutral-950' : 'bg-neutral-800'}  text-white p-2 rounded-md h-12 w-80 focus:outline-none border-none`}
                />
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setHidePassword(!hidePassword);
                  }}
                  className="absolute right-2 top-4 cursor-pointer"
                >
                  {hidePassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z" />
                      <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l.708.709z" />
                      <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z" />
                      <path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12-.708.708z" />
                    </svg>
                  )}
                </button>
              </div>
              {!IsLogin && (
                <div className="relative">
                  <input
                    disabled={EnterOtp ? true : false}
                    placeholder="Confirm Password"
                    type={ChidePassword ? "text" : "password"}
                    value={ConformPassword}
                    onChange={(e) => setConformPassword(e.target.value)}
                    className={` ${EnterOtp ? 'bg-neutral-950' : 'bg-neutral-800'}  text-white p-2 rounded-md h-12 w-80 focus:outline-none border-none`}
                  />
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setCHidePassword(!ChidePassword);
                    }}
                    className="absolute right-2 top-4 cursor-pointer"
                  >
                    {ChidePassword ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        fill="currentColor"
                        viewBox="0 0 16 16"
                      >
                        <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z" />
                        <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        fill="currentColor"
                        viewBox="0 0 16 16"
                      >
                        <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l.708.709z" />
                        <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z" />
                        <path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12-.708.708z" />
                      </svg>
                    )}
                  </button>
                </div>
              )}

                {EnterOtp && (
                  <div className="flex gap-4 flex-col">
                    <div className="flex items-center justify-center gap-4">
                      {OTP.map((value, index) => (
                        <input
                          className="h-10 w-10 text-center bg-neutral-800 text-white rounded-md "
                          ref={(el) => (InputOtpRef.current[index] = el)}
                          key={index}
                          maxLength="1"
                          value={value}
                          onChange={(e) => {
                            if (!/^\d?$/.test(e.target.value)) return;
                            const newOTP = [...OTP];
                            newOTP[index] = e.target.value;
                            setOTP(newOTP);
                            if (e.target.value) {
                              InputOtpRef.current[index + 1]?.focus();
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Backspace" && !value) {
                              InputOtpRef.current[index - 1]?.focus();
                            }
                          }}
                        />
                      ))}
                    </div>
                    <div className="flex justify-end itmes-end">
                      <button className="text-blue-500 cursor-pointer" onClick={(e) => {e.preventDefault(); handleSubmit();}}>Resend OTP</button>
                    </div>
                  </div>)
                }

              <div className="flex gap-5">
                {!EnterOtp ? <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleSubmit();
                  }}
                  disabled={Loading ? true : false}
                  className={`bg-gradient-to-bl to-[#e56cfd] from-[#7144e4] text-white p-2 rounded-md active:scale-90 ${
                    Loading ? "cursor-not-allowed" : "cursor-pointer"
                  } w-25`}
                  type="submit"
                >
                  {Loading ? (
                    <div className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      sending.
                    </div>
                  ) : IsLogin ? (
                    "Log In"
                  ) : (
                    "Sign In"
                  )}
                </button> : 
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    VerifyOTP();
                  }}
                  disabled={Loading ? true : false}
                  className={`bg-gradient-to-bl to-[#e56cfd] from-[#7144e4] text-white p-2 rounded-md active:scale-90 ${
                    Loading ? "cursor-not-allowed" : "cursor-pointer"
                  } w-25`}
                  type="submit"
                >
                  {Loading ? (
                    <div className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      sending.
                    </div>
                  ) : "Verify OTP"}
                </button>}
                {!EnterOtp && <button
                  className="bg-red-500 text-white p-2 rounded-md active:scale-90 cursor-pointer w-25"
                  onClick={(e) => {
                    e.preventDefault();
                    setEmail("");
                    setPassword("");
                    setConformPassword("");
                    setError("");
                  }}
                >
                  Clear
                </button>}
              </div>
            </form>
            {error &&
              error.map((err, index) => (
                <p className="text-red-500" key={index}>
                  {err.error}
                </p>
              ))}
            {!EnterOtp ? ( <p className="text-white">
              {IsLogin ? "Create new account" : "Already have an account?"}{" "}
              <button
                className="text-blue-400 cursor-pointer "
                onClick={() => setIsLogin(!IsLogin)}
              >
                {IsLogin ? "Sing In" : "Log In"}
              </button>
            </p>) : (
              <p className="text-white">
                {"Change "}
                <button
                  className="text-blue-400 cursor-pointer "
                  onClick={() => setEnterOtp(!EnterOtp)}
                >
                  Email
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default LogIn;
