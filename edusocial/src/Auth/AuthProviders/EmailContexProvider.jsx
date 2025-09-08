import {
  useContext,
  createContext,
  useState,
  useEffect,
} from "react";
import {
  auth,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateEmail,
  updatePassword,
  EmailAuthProvider,
  createUserWithEmailAndPassword,
} from "./FirebaseSDK";
import { onAuthStateChanged } from "firebase/auth";
import getFirebaseErrorMessage from "./FirebaseError";
const EmailContextProvider = createContext();

export const EmailContextExport = () => {
  return useContext(EmailContextProvider);
};

export const EmailContext = ({ children }) => {

    const [currentUser , setCurrentUser] = useState(null);
    const [loading , setLoading] = useState(true);

    const SignUp = async (email) => {
        try {
            if (email) {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/Auth/verify`, {
                    method: "POST",
                    headers: { "Content-type": "application/json" },
                    body: JSON.stringify({ email })
                });
                const result = await res.json();
                console.log("Result :", result);
                if (!result.ok) {
                    throw new Error(result.message || "Failed to send email");
                } else {
                    if (result.status) {
                        
                        alert("Email sent successfully, Please check your inbox. if you don't see it, please check your spam folder.");
                    }else{
                        alert("Somthing problem to send the otp. Please try again ");
                    }
                }
                return { status: result.status, loading: false };
            } else {
                return { status: result.status, loading: false };
            }
        } catch (err) {
            alert(err.message);
            return { status: result.status, loading: false, error: err.message };
        }
    }

    const Login = (email , password) => {
        return signInWithEmailAndPassword(auth , email , password);
    }

    const Logout = () => {
        return auth.signOut();
    }

    const NewUser = async (email , password) => {
        try{
            const res = await createUserWithEmailAndPassword(auth , email , password);
            return {ok: true , user: res.user};
        }catch(err){
            console.log(err);
            return {ok: false , error: err.message};
        }
    }

    const ResetPassword = async (email) => {
        try{
            await sendPasswordResetEmail(auth , email);
            return {ok: true};
        }catch(err){
            console.log(err);
            return {ok: false , error: err.message};
        }
    }


    const UpdateUserEmail = async (email) => {
        try {
            await updateEmail(auth.currentUser , email);
            return {ok: true};
        }catch(err){
            console.log(err);
            return {ok: false , error: err.message};
        }
    }

    const UpdateUserPassword = (password) => {
        return updatePassword(auth.currentUser , password);
    }

 useEffect(() => {
   const unsubscribe = onAuthStateChanged(auth, (user) => {
     setCurrentUser(user);
     setLoading(false);
   });
   return unsubscribe;
 }, []);

    const value ={
        currentUser,
        SignUp,
        Login,
        NewUser,
        Logout,
        ResetPassword,
        UpdateUserEmail,
        UpdateUserPassword
    }

  return <EmailContextProvider value={value}>{children}</EmailContextProvider>;
};
