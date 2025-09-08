const firebaseAuthErrors = {
  "auth/email-already-in-use": "This email is already registered. Please log in.",
  "auth/invalid-email": "The email address is not valid.",
  "auth/operation-not-allowed": "This sign-in method is disabled. Contact support.",
  "auth/weak-password": "Password must be at least 6 characters long.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/user-not-found": "No account found with this email.",
  "auth/wrong-password": "Incorrect password. Please try again.",
  "auth/popup-closed-by-user": "The sign-in popup was closed before finishing.",
  "auth/cancelled-popup-request": "Only one popup can be open at a time.",
  "auth/requires-recent-login": "Please log in again to continue.",
  "auth/network-request-failed": "Network error. Please check your connection.",
  "auth/too-many-requests": "Too many attempts. Please try again later.",
  "auth/internal-error": "Something went wrong. Please try again.",
};

export default function getFirebaseErrorMessage(error) {
  return firebaseAuthErrors[error.code] || "An unexpected error occurred.";
}
