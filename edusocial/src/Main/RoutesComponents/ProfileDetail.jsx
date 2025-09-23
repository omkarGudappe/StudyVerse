import React, { useState, useEffect } from 'react'
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../Auth/AuthProviders/FirebaseSDK';

const ProfileDetail = () => {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        dob: null,
        gender: "",
        education: {
            level: "",
            standard: "",
            stream: "",
            degree: "",
            field: "",
            institute: "",
            currentYear: "",
            startYear: new Date().getFullYear() - 1,
            endYear: new Date().getFullYear() + 3
        }
    });
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPopovers, setShowPopovers] = useState({});
    const [popoverTimeouts, setPopoverTimeouts] = useState({});
    const navigate = useNavigate();
    const [debugInfo, setDebugInfo] = useState(null);

    const userId = auth?.currentUser?.uid;

    useEffect(() => {
        Object.entries(showPopovers).forEach(([field, isVisible]) => {
            if (isVisible) {
                if (popoverTimeouts[field]) {
                    clearTimeout(popoverTimeouts[field]);
                }
                
                const timeoutId = setTimeout(() => {
                    setShowPopovers(prev => ({ ...prev, [field]: false }));
                }, 2000);
                
                setPopoverTimeouts(prev => ({ ...prev, [field]: timeoutId }));
            }
        });
        
        return () => {
            Object.values(popoverTimeouts).forEach(timeoutId => {
                if (timeoutId) clearTimeout(timeoutId);
            });
        };
    }, [showPopovers]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        if (name.startsWith('education.')) {
            const educationField = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                education: {
                    ...prev.education,
                    [educationField]: value
                }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
        
        if (showPopovers[name]) {
            setShowPopovers(prev => ({ ...prev, [name]: false }));
            
            if (popoverTimeouts[name]) {
                clearTimeout(popoverTimeouts[name]);
                setPopoverTimeouts(prev => ({ ...prev, [name]: null }));
            }
        }
    }

    const handleDateChange = (date) => {
        setFormData(prev => ({ ...prev, dob: date }));
        
        if (showPopovers.dob) {
            setShowPopovers(prev => ({ ...prev, dob: false }));
            if (popoverTimeouts.dob) {
                clearTimeout(popoverTimeouts.dob);
                setPopoverTimeouts(prev => ({ ...prev, dob: null }));
            }
        }
    }

    const validateForm = () => {
        const newPopovers = {};
        let isValid = true;
        
        // Validate basic info
        if (!formData.firstName.trim()) {
            newPopovers.firstName = true;
            isValid = false;
        }
        
        if (!formData.lastName.trim()) {
            newPopovers.lastName = true;
            isValid = false;
        }
        
        if (!formData.dob) {
            newPopovers.dob = true;
            isValid = false;
        }
        
        if (!formData.gender) {
            newPopovers.gender = true;
            isValid = false;
        }
        
        // Validate education
        if (!formData.education.level) {
            newPopovers['education.level'] = true;
            isValid = false;
        } else {
            if (!formData.education.institute.trim()) {
                newPopovers['education.institute'] = true;
                isValid = false;
            }
            
            if (formData.education.level === "school" && !formData.education.standard) {
                newPopovers['education.standard'] = true;
                isValid = false;
            }
            
            if (formData.education.level === "higher_secondary") {
                if (!formData.education.standard) {
                    newPopovers['education.standard'] = true;
                    isValid = false;
                }
                if (!formData.education.stream) {
                    newPopovers['education.stream'] = true;
                    isValid = false;
                }
            }
            
            if (formData.education.level === "undergraduate" || formData.education.level === "postgraduate") {
                if (!formData.education.degree) {
                    newPopovers['education.degree'] = true;
                    isValid = false;
                }
                if (!formData.education.field) {
                    newPopovers['education.field'] = true;
                    isValid = false;
                }
                if (!formData.education.currentYear) {
                    newPopovers['education.currentYear'] = true;
                    isValid = false;
                }
            }
        }
        
        setShowPopovers(newPopovers);
        return isValid;
    }

    // Enhanced error handling function
    const handleApiError = (error) => {
        console.error("API Error:", error);
        
        // Network errors
        if (!error.response) {
            return "Network error: Please check your internet connection and try again.";
        }
        
        const { status, data } = error.response;
        
        // Server-side validation errors
        if (status === 400) {
            if (data.message && data.message.includes("required")) {
                return "Please fill in all required fields correctly.";
            }
            return data.message || "Invalid data provided. Please check your information.";
        }
        
        // Authentication/Authorization errors
        if (status === 401) {
            return "Session expired. Please log in again.";
        }
        
        if (status === 403) {
            return "You don't have permission to perform this action.";
        }
        
        // User already exists
        if (status === 409 || (data.message && data.message.includes("already exists"))) {
            return "A profile already exists for this account. Please contact support if this is an error.";
        }
        
        // Server errors
        if (status >= 500) {
            return "Server is temporarily unavailable. Please try again in a few minutes.";
        }
        
        // MongoDB duplicate key errors
        if (data.message && data.message.includes("duplicate key")) {
            return "This profile already exists. Please contact support if you believe this is an error.";
        }
        
        // MongoDB validation errors
        if (data.message && data.message.includes("validation failed")) {
            return "Some information provided is invalid. Please review your details.";
        }
        
        // Fallback error message
        return data.message || "An unexpected error occurred. Please try again.";
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            setError("Please fill in all required fields correctly.");
            return;
        }
        
        // Validate user authentication
        if (!userId) {
            setError("Authentication error. Please log in again.");
            return;
        }
        
        try {
            setLoading(true);
            setError(""); // Clear previous errors
            
            // Validate date of birth (minimum age 5 years)
            const today = new Date();
            const minDob = new Date(today.getFullYear() - 5, today.getMonth(), today.getDate());
            if (formData.dob > minDob) {
                setError("You must be at least 5 years old to create a profile.");
                setLoading(false);
                return;
            }
            
            // Validate date of birth (maximum age 100 years)
            const maxDob = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
            if (formData.dob < maxDob) {
                setError("Please enter a valid date of birth.");
                setLoading(false);
                return;
            }
            
            // Prepare data according to backend expectations
            const formattedData = {
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                dob: formData.dob ? formData.dob.toISOString().split('T')[0] : '',
                gender: formData.gender,
                education: {
                    level: formData.education.level,
                    standard: formData.education.standard || null,
                    stream: formData.education.stream || null,
                    degree: formData.education.degree || null,
                    field: formData.education.field?.trim() || "",
                    institute: formData.education.institute.trim(),
                    currentYear: formData.education.currentYear || null,
                    startYear: formData.education.startYear || new Date().getFullYear() - 1,
                    endYear: formData.education.endYear || new Date().getFullYear() + 3
                },
                FUid: userId,
                Uid: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
            };
            
            // Additional validation for education years
            if (formattedData.education.startYear && formattedData.education.endYear) {
                if (formattedData.education.startYear >= formattedData.education.endYear) {
                    setError("End year must be after start year.");
                    setLoading(false);
                    return;
                }
            }
            
            setDebugInfo(formattedData);
            
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/user/userdetail`, formattedData, {
                timeout: 10000, // 10 second timeout
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            const result = res.data;

            if (result.ok) {
                setLoading(false);
                navigate('/profileBio');
            } else {
                setError(result.message || "Failed to create user profile. Please try again.");
            }
        } catch (err) {
            const errorMessage = handleApiError(err);
            setError(errorMessage);
            
            // If it's an authentication error, redirect to login after a delay
            if (errorMessage.includes("Session expired") || errorMessage.includes("log in")) {
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            }
        } finally {
            setLoading(false);
        }
    }

    const clearForm = () => {
        setFormData({
            firstName: "",
            lastName: "",
            dob: null,
            gender: "",
            education: {
                level: "",
                standard: "",
                stream: "",
                degree: "",
                field: "",
                institute: "",
                currentYear: "",
                startYear: new Date().getFullYear() - 1,
                endYear: new Date().getFullYear() + 3
            }
        });
        
        setShowPopovers({});
        setError("");

        Object.values(popoverTimeouts).forEach(timeoutId => {
            if (timeoutId) clearTimeout(timeoutId);
        });
        setPopoverTimeouts({});
    }

    const renderEducationFields = () => {
        const { level } = formData.education;
        
        if (!level) return null;

        return (
            <div className="mt-4 p-4 bg-neutral-800 rounded-lg border border-gray-700 transition-all duration-300">
                <h3 className="text-lg font-medium text-white mb-3">Education Details</h3>
                
                <div className="mb-4 relative">
                    <input
                        type="text"
                        name="education.institute"
                        value={formData.education.institute}
                        onChange={handleChange}
                        className="w-full px-4 py-2 rounded-lg text-gray-100 bg-neutral-800 border border-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none transition duration-200"
                        placeholder={level === "school" ? "School Name" : "Institute Name"}
                    />
                    {showPopovers['education.institute'] && (
                        <div className="popover absolute top-full left-0 mt-1 w-48 bg-rose-600 text-white p-2 rounded-lg shadow-lg z-10">
                            <div className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                Institute name is required
                            </div>
                            <div className="absolute -top-1 left-3 w-3 h-3 rotate-45 bg-rose-600"></div>
                        </div>
                    )}
                </div>

                {level === "school" && (
                    <div className="relative">
                        <select
                            name="education.standard"
                            value={formData.education.standard}
                            onChange={handleChange}
                            className="w-full p-2 bg-neutral-800 rounded-lg text-gray-100 border border-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none transition duration-200"
                        >
                            <option value="">Select Standard</option>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(grade => (
                                <option key={grade} value={grade}>{grade}th Standard</option>
                            ))}
                        </select>
                        {showPopovers['education.standard'] && (
                            <div className="popover absolute top-full left-0 mt-1 w-48 bg-rose-600 text-white p-2 rounded-lg shadow-lg z-10">
                                <div className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    Standard is required
                                </div>
                                <div className="absolute -top-1 left-3 w-3 h-3 rotate-45 bg-rose-600"></div>
                            </div>
                        )}
                    </div>
                )}

                {(level === "higher_secondary") && (
                    <>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className="relative">
                                <select
                                    name="education.standard"
                                    value={formData.education.standard}
                                    onChange={handleChange}
                                    className="w-full p-2 bg-neutral-800 rounded-lg text-gray-100 border border-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none transition duration-200"
                                >
                                    <option value="">Select Year</option>
                                    <option value="11">11th</option>
                                    <option value="12">12th</option>
                                </select>
                                {showPopovers['education.standard'] && (
                                    <div className="popover absolute top-full left-0 mt-1 w-48 bg-rose-600 text-white p-2 rounded-lg shadow-lg z-10">
                                        <div className="flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                            Year is required
                                        </div>
                                        <div className="absolute -top-1 left-3 w-3 h-3 rotate-45 bg-rose-600"></div>
                                    </div>
                                )}
                            </div>
                            <div className="relative">
                                <select
                                    name="education.stream"
                                    value={formData.education.stream}
                                    onChange={handleChange}
                                    className="w-full p-2 bg-neutral-800 rounded-lg text-gray-100 border border-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none transition duration-200"
                                >
                                    <option value="">Select Stream</option>
                                    <option value="Science">Science</option>
                                    <option value="Commerce">Commerce</option>
                                    <option value="Arts">Arts</option>
                                    <option value="Other">Other</option>
                                </select>
                                {showPopovers['education.stream'] && (
                                    <div className="popover absolute top-full left-0 mt-1 w-48 bg-rose-600 text-white p-2 rounded-lg shadow-lg z-10">
                                        <div className="flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                            Stream is required
                                        </div>
                                        <div className="absolute -top-1 left-3 w-3 h-3 rotate-45 bg-rose-600"></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {(level === "undergraduate" || level === "postgraduate") && (
                    <>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className="relative">
                                <select
                                    name="education.degree"
                                    value={formData.education.degree}
                                    onChange={handleChange}
                                    className="w-full p-2 bg-neutral-800 rounded-lg text-gray-100 border border-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none transition duration-200"
                                >
                                    <option value="">Select Degree</option>
                                    <option value="B.Sc">B.Sc</option>
                                    <option value="B.A">B.A</option>
                                    <option value="B.Com">B.Com</option>
                                    <option value="B.Tech">B.Tech</option>
                                    <option value="M.B.B.S">M.B.B.S</option>
                                    <option value="BBA">BBA</option>
                                    <option value="M.Sc">M.Sc</option>
                                    <option value="M.A">M.A</option>
                                    <option value="M.Com">M.Com</option>
                                    <option value="M.Tech">M.Tech</option>
                                    <option value="MBA">MBA</option>
                                    <option value="PhD">PhD</option>
                                    <option value="Other">Other</option>
                                </select>
                                {showPopovers['education.degree'] && (
                                    <div className="popover absolute top-full left-0 mt-1 w-48 bg-rose-600 text-white p-2 rounded-lg shadow-lg z-10">
                                        <div className="flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                            Degree is required
                                        </div>
                                        <div className="absolute -top-1 left-3 w-3 h-3 rotate-45 bg-rose-600"></div>
                                    </div>
                                )}
                            </div>
                            <div className="relative">
                                <input
                                    type="text"
                                    name="education.field"
                                    value={formData.education.field}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-lg text-gray-100 bg-neutral-800 border border-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none transition duration-200"
                                    placeholder="Field of Study"
                                />
                                {showPopovers['education.field'] && (
                                    <div className="popover absolute top-full left-0 mt-1 w-48 bg-rose-600 text-white p-2 rounded-lg shadow-lg z-10">
                                        <div className="flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                            Field of study is required
                                        </div>
                                        <div className="absolute -top-1 left-3 w-3 h-3 rotate-45 bg-rose-600"></div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="relative">
                                <select
                                    name="education.currentYear"
                                    value={formData.education.currentYear}
                                    onChange={handleChange}
                                    className="w-full p-2 bg-neutral-800 rounded-lg text-gray-100 border border-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none transition duration-200"
                                >
                                    <option value="">Current Year</option>
                                    <option value="1st">1st Year</option>
                                    <option value="2nd">2nd Year</option>
                                    <option value="3rd">3rd Year</option>
                                    <option value="4th">4th Year</option>
                                    <option value="5th">5th Year</option>
                                </select>
                                {showPopovers['education.currentYear'] && (
                                    <div className="popover absolute top-full left-0 mt-1 w-48 bg-rose-600 text-white p-2 rounded-lg shadow-lg z-10">
                                        <div className="flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                            Current year is required
                                        </div>
                                        <div className="absolute -top-1 left-3 w-3 h-3 rotate-45 bg-rose-600"></div>
                                    </div>
                                )}
                            </div>
                            <div className="relative">
                                <select
                                    name="education.startYear"
                                    value={formData.education.startYear}
                                    onChange={handleChange}
                                    className="w-full p-2 bg-neutral-800 rounded-lg text-gray-100 border border-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none transition duration-200"
                                >
                                    <option value="">Start Year</option>
                                    {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="relative">
                                <select
                                    name="education.endYear"
                                    value={formData.education.endYear}
                                    onChange={handleChange}
                                    className="w-full p-2 bg-neutral-800 rounded-lg text-gray-100 border border-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none transition duration-200"
                                >
                                    <option value="">End Year</option>
                                    {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-neutral-800 rounded-xl shadow-2xl shadow-gray-900 border border-gray-700 overflow-hidden">
                <div className="p-6">
                    <h1 className="text-2xl font-bold text-center mb-6 text-white">Complete Your Profile</h1>
                    
                    {error && (
                        <div className="mb-4 bg-rose-600 text-white p-3 rounded-lg flex items-start">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <div>
                                <span className="font-medium">{error}</span>
                                {debugInfo && (
                                    <div className="mt-2 text-xs opacity-75">
                                        Debug: {JSON.stringify(debugInfo)}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Basic Information */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="relative">
                                <input
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-lg text-gray-100 bg-neutral-800 border border-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none transition duration-200"
                                    placeholder="First Name"
                                />
                                {showPopovers.firstName && (
                                    <div className="popover absolute top-full left-0 mt-1 w-48 bg-rose-600 text-white p-2 rounded-lg shadow-lg z-10">
                                        <div className="flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                            First name is required
                                        </div>
                                        <div className="absolute -top-1 left-3 w-3 h-3 rotate-45 bg-rose-600"></div>
                                    </div>
                                )}
                            </div>
                            <div className="relative">
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-lg text-gray-100 bg-neutral-800 border border-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none transition duration-200"
                                    placeholder="Last Name"
                                />
                                {showPopovers.lastName && (
                                    <div className="popover absolute top-full left-0 mt-1 w-48 bg-rose-600 text-white p-2 rounded-lg shadow-lg z-10">
                                        <div className="flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                            Last name is required
                                        </div>
                                        <div className="absolute -top-1 left-3 w-3 h-3 rotate-45 bg-rose-600"></div>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-300 mb-1">Date of Birth</label>
                            <DatePicker
                                selected={formData.dob}
                                onChange={handleDateChange}
                                dateFormat="dd/MM/yyyy"
                                showYearDropdown
                                scrollableYearDropdown
                                yearDropdownItemNumber={30}
                                maxDate={new Date()}
                                minDate={new Date(new Date().getFullYear() - 100, new Date().getMonth(), new Date().getDate())}
                                placeholderText="Select your date of birth"
                                className="w-full px-4 py-2 rounded-lg text-gray-100 bg-neutral-800 border border-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none transition duration-200"
                            />
                            {showPopovers.dob && (
                                <div className="popover absolute top-full left-0 mt-1 w-48 bg-rose-600 text-white p-2 rounded-lg shadow-lg z-10">
                                    <div className="flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        Date of birth is required
                                    </div>
                                    <div className="absolute -top-1 left-3 w-3 h-3 rotate-45 bg-rose-600"></div>
                                </div>
                            )}
                        </div>
                        
                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-300 mb-2">Gender</label>
                            <div className="flex space-x-4">
                                {['male', 'female', 'other'].map(gender => (
                                    <label key={gender} className="flex items-center">
                                        <input
                                            type="radio"
                                            name="gender"
                                            value={gender}
                                            checked={formData.gender === gender}
                                            onChange={handleChange}
                                            className="mr-2"
                                        />
                                        <span className="capitalize">{gender}</span>
                                    </label>
                                ))}
                            </div>
                            {showPopovers.gender && (
                                <div className="popover absolute top-full left-0 mt-1 w-48 bg-rose-600 text-white p-2 rounded-lg shadow-lg z-10">
                                    <div className="flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        Please select a gender
                                    </div>
                                    <div className="absolute -top-1 left-3 w-3 h-3 rotate-45 bg-rose-600"></div>
                                </div>
                            )}
                        </div>
                        
                        {/* Education Level */}
                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-300 mb-2">Education Level</label>
                            <select
                                name="education.level"
                                value={formData.education.level}
                                onChange={handleChange}
                                className="w-full p-2 bg-neutral-800 rounded-lg text-gray-100 border border-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none transition duration-200"
                            >
                                <option value="">Select Education Level</option>
                                <option value="school">School (up to 10th)</option>
                                <option value="higher_secondary">Higher Secondary (11th-12th)</option>
                                <option value="undergraduate">Undergraduate</option>
                                <option value="postgraduate">Postgraduate</option>
                            </select>
                            {showPopovers['education.level'] && (
                                <div className="popover absolute top-full left-0 mt-1 w-48 bg-rose-600 text-white p-2 rounded-lg shadow-lg z-10">
                                    <div className="flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        Education level is required
                                    </div>
                                    <div className="absolute -top-1 left-3 w-3 h-3 rotate-45 bg-rose-600"></div>
                                </div>
                            )}
                        </div>
                        
                        {renderEducationFields()}
                        
                        <div className="flex space-x-3 pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-neutral-800 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Creating Profile...
                                    </div>
                                ) : 'Create Profile'}
                            </button>
                            <button
                                type="button"
                                onClick={clearForm}
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-neutral-800 transition duration-200"
                            >
                                Clear
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default ProfileDetail