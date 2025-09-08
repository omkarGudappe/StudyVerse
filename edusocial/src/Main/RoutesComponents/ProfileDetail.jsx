import React, { useState, useEffect } from 'react'
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../Auth/AuthProviders/FirebaseSDK';

const ProfileDetail = () => {
    const [formData, setFormData] = useState({
        FirstName: "",
        LastName: "",
        dob: "",
        gender: "",
        EduLevel: "",
    });
    const [User, setUser] = useState();
    const [dob, setDob] = useState(null);
    const [EduLevel, setEduLevel] = useState("");
    const [Education, setEducation] = useState({
        institute: "",
        Year: "",
        Stream: "",
        Degree: "",
        Major: "",
    });

    const Id = auth.currentUser.uid;
    const [Loading , setLoading] = useState(false);
    const [error, setError] = useState("");
    
    const [showPopovers, setShowPopovers] = useState({
        FirstName: false,
        LastName: false,
        dob: false,
        gender: false,
        EduLevel: false,
        institute: false,
        Year: false,
        Stream: false,
        Degree: false,
        Major: false
    });

    const [popoverTimeouts, setPopoverTimeouts] = useState({});
    const Navigate = useNavigate();
    const [Debugging, setDebugging] = useState();

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
        if(e.target.name === "profileImage"){
            setFormData({ ...formData , profileImage: e.target.files[0]})
        }else{
            setFormData({...formData , [e.target.name]: e.target.value})
        }
        
        if (showPopovers[e.target.name]) {
            setShowPopovers({
                ...showPopovers,
                [e.target.name]: false
            });
            
            if (popoverTimeouts[e.target.name]) {
                clearTimeout(popoverTimeouts[e.target.name]);
                setPopoverTimeouts(prev => ({ ...prev, [e.target.name]: null }));
            }
        }
    }

    const validateForm = () => {
        const newPopovers = {...showPopovers};
        let isValid = true;
        
        if (!formData.FirstName.trim()) {
            newPopovers.FirstName = true;
            isValid = false;
        }
        
        if (!formData.LastName.trim()) {
            newPopovers.LastName = true;
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
        
        if (!EduLevel) {
            newPopovers.EduLevel = true;
            isValid = false;
        }
        
        if (EduLevel) {
            if (!Education.institute.trim()) {
                newPopovers.institute = true;
                isValid = false;
            }
            
            if (!Education.Year) {
                newPopovers.Year = true;
                isValid = false;
            }
            
            if (EduLevel === "11-12" && !Education.Stream) {
                newPopovers.Stream = true;
                isValid = false;
            }
            
            if (EduLevel === "graduation" && (!Education.Degree || !Education.Major)) {
                if (!Education.Degree) newPopovers.Degree = true;
                if (!Education.Major) newPopovers.Major = true;
                isValid = false;
            }
        }
        
        setShowPopovers(newPopovers);
        return isValid;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        try {
            const form = new FormData();
            form.append("firstname", formData.FirstName);
            form.append("lastname", formData.LastName);
            form.append("gender", formData.gender);
            
            let formattedDate = "";
            if (formData.dob) {
                const d = new Date(formData.dob);
                formattedDate = d.toISOString().split("T")[0];
            }
            
            form.append("dob", formattedDate);

            let educationString = "";
            if (EduLevel === "school") {
                educationString = `${Education.Year},${Education.institute}`;
            } else if (EduLevel === "11-12") {
                educationString = `${Education.Year},${Education.Stream},${Education.institute}`;
            } else if (EduLevel === "graduation") {
                educationString = `${Education.Degree},${Education.Major},${Education.Year},${Education.institute}`;
            }
            form.append("education", educationString);

            const Uid = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            form.append("FUid", Id);
            form.append("Uid", Uid);
            setLoading(true);

            console.log(form);
            
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/user/userdetail`, form);
            
            const result = await res.data;
            setDebugging(result);

            if(result.ok){
                setLoading(false);
                console.log("Response Data:", result.user);
                Navigate('/profileBio');
            }else{
                setError(result.message || "Failed to create user");
            }

        } catch (err) {
            console.log("Error:", err)
            setError(`Error from here: ${err.message}` );
        } finally{
            setLoading(false);
        }
    }

    const clearForm = () => {
        setFormData({
            FirstName: "",
            LastName: "",
            dob: "",
            gender: "",
            EduLevel: "",
        });
        setDob(null);
        setEduLevel("");
        setEducation({
            institute: "",
            Year: "",
            Stream: "",
            Degree: "",
            Major: "",
        });
        
        setShowPopovers({
            FirstName: false,
            LastName: false,
            dob: false,
            gender: false,
            EduLevel: false,
            institute: false,
            Year: false,
            Stream: false,
            Degree: false,
            Major: false
        });

        document.getElementsByName("gender").forEach(input => {
            input.value = "";
            input.checked = false;
        });

        Object.values(popoverTimeouts).forEach(timeoutId => {
            if (timeoutId) clearTimeout(timeoutId);
        });
        setPopoverTimeouts({});
    }

    return (
        <div className='bg-neutral-900 text-white h-screen flex flex-col items-center justify-center px-3'>
            <div className=' gap-y-3'>
                {error && (
                    <div className="bg-rose-600 text-white p-2 rounded-lg shadow-lg">
                        First check Debugging: {JSON.stringify(Debugging)}<br />
                        {error}
                    </div>
                )}
            </div>
            <div className='border-white border rounded-xl shadow-2xl shadow-gray-800 h-auto w-auto py-5 max-w-md'>
                <h1 className='text-2xl text-center mb-2'>User Profile</h1>
                <div className='flex items-center justify-center flex-col gap-y-3 p-6 h-auto'>
                    <div className='flex gap-3 h-9 w-full relative'>
                        <div className='w-1/2 relative'>
                            <input 
                                type="text"
                                onChange={handleChange}
                                name="FirstName" 
                                value={formData.FirstName}
                                className='rounded-xl px-3 py-3 h-9 text-gray-100 border border-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none transition duration-200 w-full' 
                                placeholder='First Name' 
                            />
                            {showPopovers.FirstName && (
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
                        <div className='w-1/2 relative'>
                            <input 
                                type="text" 
                                onChange={handleChange} 
                                name="LastName" 
                                value={formData.LastName}
                                className='w-full h-9 rounded-xl px-3 py-3 text-gray-100 border border-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none transition duration-200' 
                                placeholder='Last Name' 
                            />
                            {showPopovers.LastName && (
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
                    
                    <div className="flex flex-col gap-2 w-full relative">
                        <label htmlFor="dob" className="text-gray-200 text-sm font-medium tracking-wide">
                            Date of Birth
                        </label>
                        <DatePicker
                            name='dob'
                            selected={dob}
                            onChange={(date) => {
                                setDob(date); 
                                setFormData({ ...formData, dob: date });
                                if (showPopovers.dob) {
                                    setShowPopovers({...showPopovers, dob: false});
                                    if (popoverTimeouts.dob) {
                                        clearTimeout(popoverTimeouts.dob);
                                        setPopoverTimeouts(prev => ({ ...prev, dob: null }));
                                    }
                                }
                            }}
                            dateFormat="dd/MM/yyyy"
                            showYearDropdown
                            scrollableYearDropdown
                            yearDropdownItemNumber={30}
                            maxDate={new Date()}
                            placeholderText="Select your date of birth"
                            className="w-full px-4 py-2 rounded-xl text-gray-100 border border-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none transition duration-200"
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
                    
                    <div className='flex flex-col w-full gap-y-2 relative'>
                        <h1 className='text-sm'>Select Gender</h1>
                        <div className='flex justify-start gap-6'>
                            <div className="flex items-center">
                                <input type="radio" className='cursor-pointer' value="male" onChange={handleChange} name="gender" id="Male" />
                                <label htmlFor="Male" className="ml-1">Male</label>
                            </div>
                            <div className="flex items-center">
                                <input type="radio" className='cursor-pointer' value="female" onChange={handleChange} name='gender' id='female'/>
                                <label htmlFor="female" className="ml-1">Female</label>
                            </div>
                            <div className="flex items-center">
                                <input type="radio" className='cursor-pointer' value="custom" onChange={handleChange} name='gender' id='custome'/>
                                <label htmlFor="custome" className="ml-1">Custom</label>
                            </div>
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
                    
                    <div className='flex flex-col w-full gap-y-2 relative'>
                        <h1 className='text-sm'>Select Education Level</h1>
                        <div className="relative">
                            <select
                                onChange={(e) => {
                                    setEduLevel(e.target.value);
                                    if (showPopovers.EduLevel) {
                                        setShowPopovers({...showPopovers, EduLevel: false});
                                        if (popoverTimeouts.EduLevel) {
                                            clearTimeout(popoverTimeouts.EduLevel);
                                            setPopoverTimeouts(prev => ({ ...prev, EduLevel: null }));
                                        }
                                    }
                                }}
                                value={EduLevel}
                                className="w-full p-2 bg-neutral-900 rounded-xl text-gray-100 border border-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none transition duration-200 cursor-pointer"
                            >
                                <option value="">Select Education Level</option>
                                <option value="school">School (up to 10th)</option>
                                <option value="11-12">11th / 12th</option>
                                <option value="graduation">Graduation</option>
                            </select>
                            {showPopovers.EduLevel && (
                                <div className="popover absolute top-full left-0 mt-1 w-60 bg-rose-600 text-white p-2 rounded-lg shadow-lg z-10">
                                    <div className="flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        Please select an education level
                                    </div>
                                    <div className="absolute -top-1 left-3 w-3 h-3 rotate-45 bg-rose-600"></div>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className='w-full'>
                        {EduLevel === "school" && (
                            <>
                                <div className='flex gap-3 h-9 w-full mb-2'>
                                    <div className='w-1/2 relative'>
                                        <input 
                                            type="text" 
                                            value={Education.institute} 
                                            onChange={(e) => {
                                                setEducation({...Education, institute:e.target.value});
                                                if (showPopovers.institute) {
                                                    setShowPopovers({...showPopovers, institute: false});
                                                    if (popoverTimeouts.institute) {
                                                        clearTimeout(popoverTimeouts.institute);
                                                        setPopoverTimeouts(prev => ({ ...prev, institute: null }));
                                                    }
                                                }
                                            }} 
                                            className='rounded-xl h-9 px-3 py-3 text-gray-100 border border-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none transition duration-200 w-full' 
                                            placeholder='School Name' 
                                        />
                                        {showPopovers.institute && (
                                            <div className="popover absolute top-full left-0 mt-1 w-48 bg-rose-600 text-white p-2 rounded-lg shadow-lg z-10">
                                                <div className="flex items-center">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                    </svg>
                                                    School name is required
                                                </div>
                                                <div className="absolute -top-1 left-3 w-3 h-3 rotate-45 bg-rose-600"></div>
                                            </div>
                                        )}
                                    </div>
                                    <div className='w-1/2 relative'>
                                        <select 
                                            onChange={(e) => {
                                                setEducation({...Education, Year:e.target.value});
                                                if (showPopovers.Year) {
                                                    setShowPopovers({...showPopovers, Year: false});
                                                    if (popoverTimeouts.Year) {
                                                        clearTimeout(popoverTimeouts.Year);
                                                        setPopoverTimeouts(prev => ({ ...prev, Year: null }));
                                                    }
                                                }
                                            }} 
                                            value={Education.Year}
                                            className='p-2 h-9 bg-neutral-900 rounded-xl text-gray-100 border border-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none transition duration-200 cursor-pointer w-full'
                                        >
                                            <option value="">Select Standard</option>
                                            <option value="10">10th</option>
                                            <option value="9">9th</option>
                                            <option value="8">8th</option>
                                            <option value="7">7th</option>
                                            <option value="6">6th</option>
                                            <option value="5">5th</option>
                                            <option value="4">4th</option>
                                            <option value="3">3rd</option>
                                            <option value="2">2nd</option>
                                            <option value="1">1st</option>
                                        </select>
                                        {showPopovers.Year && (
                                            <div className="popover absolute top-full left-0 mt-1 w-48 bg-rose-600 text-white p-2 rounded-lg shadow-lg z-10">
                                                <div className="flex items-center">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                    </svg>
                                                    Please select a standard
                                                </div>
                                                <div className="absolute -top-1 left-3 w-3 h-3 rotate-45 bg-rose-600"></div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                        
                        {EduLevel === "11-12" && (
                            <>
                                <div className='flex flex-col gap-3 w-full'>
                                    <div className='flex gap-3 h-9 w-full'>
                                        <div className='w-1/2 relative'>
                                            <input
                                                type="text"
                                                placeholder="College Name"
                                                value={Education.institute}
                                                onChange={(e) => {
                                                    setEducation({...Education, institute:e.target.value});
                                                    if (showPopovers.institute) {
                                                        setShowPopovers({...showPopovers, institute: false});
                                                        if (popoverTimeouts.institute) {
                                                            clearTimeout(popoverTimeouts.institute);
                                                            setPopoverTimeouts(prev => ({ ...prev, institute: null }));
                                                        }
                                                    }
                                                }}
                                                className="rounded-xl h-9 px-3 py-3 text-gray-100 border border-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none transition duration-200 w-full"
                                            />
                                            {showPopovers.institute && (
                                                <div className="popover absolute top-full left-0 mt-1 w-48 bg-rose-600 text-white p-2 rounded-lg shadow-lg z-10">
                                                    <div className="flex items-center">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                        </svg>
                                                        College name is required
                                                    </div>
                                                    <div className="absolute -top-1 left-3 w-3 h-3 rotate-45 bg-rose-600"></div>
                                                </div>
                                            )}
                                        </div>
                                        <div className='w-1/2 relative'>
                                            <select 
                                                onChange={(e) => {
                                                    setEducation({...Education, Year:e.target.value});
                                                    if (showPopovers.Year) {
                                                        setShowPopovers({...showPopovers, Year: false});
                                                        if (popoverTimeouts.Year) {
                                                            clearTimeout(popoverTimeouts.Year);
                                                            setPopoverTimeouts(prev => ({ ...prev, Year: null }));
                                                        }
                                                    }
                                                }} 
                                                value={Education.Year}
                                                className='p-2 h-9 bg-neutral-900 rounded-xl text-gray-100 border border-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none transition duration-200 cursor-pointer w-full'
                                            >
                                                <option value="">Select Year</option>
                                                <option value="11">11</option>
                                                <option value="12">12</option>
                                            </select>
                                            {showPopovers.Year && (
                                                <div className="popover absolute top-full left-0 mt-1 w-48 bg-rose-600 text-white p-2 rounded-lg shadow-lg z-10">
                                                    <div className="flex items-center">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                        </svg>
                                                        Please select a year
                                                    </div>
                                                    <div className="absolute -top-1 left-3 w-3 h-3 rotate-45 bg-rose-600"></div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className='relative'>
                                        <select 
                                            onChange={(e) => {
                                                setEducation({...Education, Stream:e.target.value});
                                                if (showPopovers.Stream) {
                                                    setShowPopovers({...showPopovers, Stream: false});
                                                    if (popoverTimeouts.Stream) {
                                                        clearTimeout(popoverTimeouts.Stream);
                                                        setPopoverTimeouts(prev => ({ ...prev, Stream: null }));
                                                    }
                                                }
                                            }} 
                                            value={Education.Stream}
                                            className="rounded-xl px-3 py-3 text-gray-100 border bg-neutral-900 border-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none transition duration-200 w-full"
                                        >
                                            <option value="">Select Stream</option>
                                            <option value="science">Science</option>
                                            <option value="commerce">Commerce</option>
                                            <option value="arts">Arts</option>
                                        </select>
                                        {showPopovers.Stream && (
                                            <div className="popover absolute top-full left-0 mt-1 w-48 bg-rose-600 text-white p-2 rounded-lg shadow-lg z-10">
                                                <div className="flex items-center">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                    </svg>
                                                    Please select a stream
                                                </div>
                                                <div className="absolute -top-1 left-3 w-3 h-3 rotate-45 bg-rose-600"></div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                        
                        {EduLevel === "graduation" && (
                            <>
                                <div className='flex flex-col gap-3'>
                                    <div className='relative'>
                                        <input
                                            type="text"
                                            placeholder="College / University Name"
                                            value={Education.institute}
                                            onChange={(e) => {
                                                setEducation({...Education, institute:e.target.value});
                                                if (showPopovers.institute) {
                                                    setShowPopovers({...showPopovers, institute: false});
                                                    if (popoverTimeouts.institute) {
                                                        clearTimeout(popoverTimeouts.institute);
                                                        setPopoverTimeouts(prev => ({ ...prev, institute: null }));
                                                    }
                                                }
                                            }}
                                            className="rounded-xl px-3 py-3 h-9 text-gray-100 border border-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none transition duration-200 w-full"
                                        />
                                        {showPopovers.institute && (
                                            <div className="popover absolute top-full left-0 mt-1 w-56 bg-rose-600 text-white p-2 rounded-lg shadow-lg z-10">
                                                <div className="flex items-center">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                    </svg>
                                                    University name is required
                                                </div>
                                                <div className="absolute -top-1 left-3 w-3 h-3 rotate-45 bg-rose-600"></div>
                                            </div>
                                        )}
                                    </div>
                                    <div className='flex gap-3 h-9'>
                                        <div className='w-1/2 relative'>
                                            <input
                                                type="text"
                                                value={Education.Degree}
                                                onChange={(e) => {
                                                    setEducation({...Education, Degree: e.target.value});
                                                    if (showPopovers.Degree) {
                                                        setShowPopovers({...showPopovers, Degree: false});
                                                        if (popoverTimeouts.Degree) {
                                                            clearTimeout(popoverTimeouts.Degree);
                                                            setPopoverTimeouts(prev => ({ ...prev, Degree: null }));
                                                        }
                                                    }
                                                }}
                                                placeholder="Degree (e.g., B.Tech, B.Sc)"
                                                className="rounded-xl h-9 px-3 py-3 text-gray-100 border border-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none transition duration-200 w-full"
                                            />
                                            {showPopovers.Degree && (
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
                                        <div className='w-1/2 relative'>
                                            <input
                                                type="text"
                                                value={Education.Major}
                                                onChange={(e) => {
                                                    setEducation({...Education, Major: e.target.value});
                                                    if (showPopovers.Major) {
                                                        setShowPopovers({...showPopovers, Major: false});
                                                        if (popoverTimeouts.Major) {
                                                            clearTimeout(popoverTimeouts.Major);
                                                            setPopoverTimeouts(prev => ({ ...prev, Major: null }));
                                                        }
                                                    }
                                                }}
                                                placeholder="Field / Major"
                                                className="rounded-xl h-9 px-3 py-3 text-gray-100 border border-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none transition duration-200 w-full"
                                            />
                                            {showPopovers.Major && (
                                                <div className="popover absolute top-full left-0 mt-1 w-48 bg-rose-600 text-white p-2 rounded-lg shadow-lg z-10">
                                                    <div className="flex items-center">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                        </svg>
                                                        Major is required
                                                    </div>
                                                    <div className="absolute -top-1 left-3 w-3 h-3 rotate-45 bg-rose-600"></div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className='relative'>
                                        <select 
                                            onChange={(e) => {
                                                setEducation({...Education, Year: e.target.value});
                                                if (showPopovers.Year) {
                                                    setShowPopovers({...showPopovers, Year: false});
                                                    if (popoverTimeouts.Year) {
                                                        clearTimeout(popoverTimeouts.Year);
                                                        setPopoverTimeouts(prev => ({ ...prev, Year: null }));
                                                    }
                                                }
                                            }} 
                                            value={Education.Year}
                                            className='rounded-xl px-3 py-3 cursor-pointer text-gray-100 border bg-neutral-900 border-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none transition duration-200 w-full'
                                        >
                                            <option value="">Select Year</option>
                                            <option value="1st">1st</option>
                                            <option value="2nd">2nd</option>
                                            <option value="3rd">3rd</option>
                                            <option value="4th">4th</option>
                                            <option value="5th">5th</option>
                                        </select>
                                        {showPopovers.Year && (
                                            <div className="popover absolute top-full left-0 mt-1 w-48 bg-rose-600 text-white p-2 rounded-lg shadow-lg z-10">
                                                <div className="flex items-center">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                    </svg>
                                                    Please select a year
                                                </div>
                                                <div className="absolute -top-1 left-3 w-3 h-3 rotate-45 bg-rose-600"></div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
                
                <div className='flex gap-10 items-center justify-between px-6 w-full mt-4'>
                    <button onClick={handleSubmit} className='bg-gradient-to-bl to-[#e56cfd] from-[#7144e4] cursor-pointer rounded-lg p-2 w-auto min-w-20 active:scale-95'>
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
                            sending..
                            </div>
                        ) : "Submit"}
                    </button>
                    <button onClick={clearForm} className='bg-red-500 rounded-lg p-2 w-auto min-w-20 cursor-pointer active:scale-95'>
                        Clear
                    </button>
                </div>
            </div>      
        </div>
    )
}

export default ProfileDetail