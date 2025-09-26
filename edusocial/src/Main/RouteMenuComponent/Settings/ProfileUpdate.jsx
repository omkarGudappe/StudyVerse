import React, { useState, useEffect } from 'react'
import axios from 'axios'
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { UserDataContextExport } from '../CurrentUserContexProvider'
import { auth } from '../../../Auth/AuthProviders/FirebaseSDK';
import { useNavigate } from 'react-router-dom';

const ProfileUpdate = () => {
    const { ProfileData, setProfileData } = UserDataContextExport();
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        profileImage: null,
        description: "",
        heading: "",
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

    const userId = auth.currentUser?.uid;

    const mapEducationLevel = (dbLevel) => {
        switch (dbLevel) {
            case "school":
                return "school";
            case "higher_secondary":
                return "higher_secondary";
            case "undergraduate":
                return "undergraduate";
            case "postgraduate":
                return "postgraduate";
            case "other":
                return "other";
            default:
                return "";
        }
    };

    useEffect(() => {
        if (ProfileData) {
            const educationLevel = mapEducationLevel(ProfileData.education?.level);
            
            setFormData(prev => ({
                ...prev,
                firstName: ProfileData.firstName || "",
                lastName: ProfileData.lastName || "",
                description: ProfileData.UserProfile?.description || "",
                heading: ProfileData.UserProfile?.heading || "",
                dob: ProfileData.dob ? new Date(ProfileData.dob) : null,
                gender: ProfileData.gender || "",
                education: {
                    level: educationLevel,
                    standard: ProfileData.education?.standard || "",
                    stream: ProfileData.education?.stream || "",
                    degree: ProfileData.education?.degree || "",
                    field: ProfileData.education?.field || "",
                    institute: ProfileData.education?.institute || "",
                    currentYear: ProfileData.education?.currentYear || "",
                    startYear: ProfileData.education?.startYear || new Date().getFullYear() - 1,
                    endYear: ProfileData.education?.endYear || new Date().getFullYear() + 3
                }
            }));
        }
    }, [ProfileData]);

    const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    
    if (name === 'profileImage') {
        setFormData(prev => ({ ...prev, profileImage: files[0] }));
    } else if (name.startsWith('education.')) {
        const educationField = name.split('.')[1];
        
        if (educationField === 'level') {
            setFormData(prev => ({
                ...prev,
                education: {
                    level: value,
                    standard: "",
                    stream: "",
                    degree: "",
                    field: "",
                    institute: "",
                    currentYear: "",
                    startYear: new Date().getFullYear() - 1,
                    endYear: new Date().getFullYear() + 3
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                education: {
                    ...prev.education,
                    [educationField]: value
                }
            }));
        }
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
};

    const handleDateChange = (date) => {
        setFormData(prev => ({ ...prev, dob: date }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccessMessage("");

        try {
            const formDataToSend = new FormData();
            formDataToSend.append("firstName", formData.firstName);
            formDataToSend.append("lastName", formData.lastName);
            formDataToSend.append("description", formData.description);
            formDataToSend.append("heading", formData.heading);
            formDataToSend.append("gender", formData.gender);
            
            if (formData.dob) {
                formDataToSend.append("dob", formData.dob.toISOString().split('T')[0]);
            }

            if (formData.profileImage) {
                formDataToSend.append("image", formData.profileImage);
            }

            formDataToSend.append("education[level]", formData.education.level);
            formDataToSend.append("education[standard]", formData.education.standard || "");
            formDataToSend.append("education[stream]", formData.education.stream || "");
            formDataToSend.append("education[degree]", formData.education.degree || "");
            formDataToSend.append("education[field]", formData.education.field || "");
            formDataToSend.append("education[institute]", formData.education.institute);
            formDataToSend.append("education[currentYear]", formData.education.currentYear || "");
            formDataToSend.append("education[startYear]", formData.education.startYear);
            formDataToSend.append("education[endYear]", formData.education.endYear);

            const response = await axios.put(
                `${import.meta.env.VITE_API_URL}/user/profile/update/${userId}`,
                formDataToSend,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            if (response.data.ok) {
                setSuccessMessage("Profile updated successfully!");
                setProfileData(response.data.user);
            } else {
                setError(response.data.message || "Failed to update profile");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Error updating profile");
        } finally {
            setLoading(false);
        }
    };

    const renderEducationFields = () => {
        const { level } = formData.education;
        
        if (!level) return null;

        return (
            <div className="space-y-4 mt-4 p-4 bg-neutral-800 rounded-lg">
                <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                        {level === "school" ? "School Name" : 
                         level === "higher_secondary" ? "College Name" : "University Name"}
                    </label>
                    <input
                        type="text"
                        name="education.institute"
                        value={formData.education.institute}
                        onChange={handleInputChange}
                        className="w-full bg-neutral-900 border transition duration-200 border-neutral-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500 outline-none"
                        placeholder={`Enter ${level === "school" ? "school" : "institution"} name`}
                    />
                </div>

                {level === "school" && (
                    <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-2">
                            Standard
                        </label>
                        <select
                            name="education.standard"
                            value={formData.education.standard}
                            onChange={handleInputChange}
                            className="w-full bg-neutral-900 border transition duration-200 border-neutral-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500 outline-none"
                        >
                            <option value="">Select Standard</option>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(grade => (
                                <option key={grade} value={grade}>{grade}th Standard</option>
                            ))}
                        </select>
                    </div>
                )}

                {level === "higher_secondary" && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-300 mb-2">
                                    Year
                                </label>
                                <select
                                    name="education.standard"
                                    value={formData.education.standard}
                                    onChange={handleInputChange}
                                    className="w-full bg-neutral-900 border transition duration-200 border-neutral-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500 outline-none"
                                >
                                    <option value="">Select Year</option>
                                    <option value="11">11th</option>
                                    <option value="12">12th</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-300 mb-2">
                                    Stream
                                </label>
                                <select
                                    name="education.stream"
                                    value={formData.education.stream}
                                    onChange={handleInputChange}
                                    className="w-full bg-neutral-900 border transition duration-200 border-neutral-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500 outline-none"
                                >
                                    <option value="">Select Stream</option>
                                    <option value="Science">Science</option>
                                    <option value="Commerce">Commerce</option>
                                    <option value="Arts">Arts</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>
                    </>
                )}

                {(level === "undergraduate" || level === "postgraduate") && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-300 mb-2">
                                    Degree
                                </label>
                                <select
                                    name="education.degree"
                                    value={formData.education.degree}
                                    onChange={handleInputChange}
                                    className="w-full bg-neutral-900 border transition duration-200 border-neutral-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500 outline-none"
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
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-300 mb-2">
                                    Field of Study
                                </label>
                                <input
                                    type="text"
                                    name="education.field"
                                    value={formData.education.field}
                                    onChange={handleInputChange}
                                    className="w-full bg-neutral-900 border transition duration-200 border-neutral-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500 outline-none"
                                    placeholder="e.g., Computer Science"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-300 mb-2">
                                    Current Year
                                </label>
                                <select
                                    name="education.currentYear"
                                    value={formData.education.currentYear}
                                    onChange={handleInputChange}
                                    className="w-full bg-neutral-900 border transition duration-200 border-neutral-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500 outline-none"
                                >
                                    <option value="">Select Year</option>
                                    <option value="1">1st Year</option>
                                    <option value="2">2nd Year</option>
                                    <option value="3">3rd Year</option>
                                    <option value="4">4th Year</option>
                                    <option value="5">5th Year</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-300 mb-2">
                                    Start Year
                                </label>
                                <select
                                    name="education.startYear"
                                    value={formData.education.startYear}
                                    onChange={handleInputChange}
                                    className="w-full bg-neutral-900 border transition duration-200 border-neutral-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500 outline-none"
                                >
                                    <option value="">Start Year</option>
                                    {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-300 mb-2">
                                    End Year
                                </label>
                                <select
                                    name="education.endYear"
                                    value={formData.education.endYear}
                                    onChange={handleInputChange}
                                    className="w-full bg-neutral-900 border transition duration-200 border-neutral-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500 outline-none"
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
        <div className="min-h-screen bg-neutral-900 text-white">
            <nav className="bg-neutral-900 border-b border-neutral-700 px-4 py-3 sticky top-0 z-10">
                <div className="max-w-4xl flex items-center">
                    <button 
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-lg hover:bg-neutral-700 transition-colors mr-4"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <h1 className="text-xl font-semibold text-purple-400">Profile Settings</h1>
                </div>
            </nav>

            <div className="py-8 px-2">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-8">
                        <p className="text-neutral-400">Update your personal information and preferences</p>
                    </div>

                    {successMessage && (
                        <div className="bg-green-600 text-white p-4 rounded-lg mb-6">
                            {successMessage}
                        </div>
                    )}
                    {error && (
                        <div className="bg-red-600 text-white p-4 rounded-lg mb-6">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="rounded-2xl p-3">
                        <div className="mb-8 flex items-center justify-center flex-col">
                            <h2 className="text-xl font-semibold mb-4 text-purple-300">Profile Picture</h2>
                            <div className="flex flex-col justify-center items-center gap-6">
                                <div className="w-44 h-44 rounded-full bg-neutral-900 flex items-center justify-center overflow-hidden">
                                    {formData.profileImage ? (
                                        <img 
                                            src={URL.createObjectURL(formData.profileImage)} 
                                            alt="Profile preview" 
                                            className="w-full h-full object-cover"
                                        />
                                    ) : ProfileData?.UserProfile?.avatar?.url ? (
                                        <img 
                                            src={ProfileData.UserProfile.avatar.url} 
                                            alt="Current profile" 
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 text-neutral-400">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-6.627 0-12 5.373-12 12h24c0-6.627-5.373-12-12-12z"/>
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <div className='flex justify-center flex-col'>
                                    <input
                                        type="file"
                                        name="profileImage"
                                        onChange={handleInputChange}
                                        accept="image/*"
                                        className="hidden"
                                        id="profileImageInput"
                                    />
                                    <label
                                        htmlFor="profileImageInput"
                                        className="bg-purple-600 text-white justify-center px-4 py-2 rounded-lg cursor-pointer text-center"
                                    >
                                        Change Photo
                                    </label>
                                    <p className="text-sm text-center text-neutral-400 mt-2">JPG, PNG </p>
                                </div>
                            </div>
                        </div>

                        <div className="mb-8">
                            <h2 className="text-xl font-semibold mb-4 text-purple-300">Personal Information</h2>
                            <div className="grid grid-cols-2 md:grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                                        First Name
                                    </label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleInputChange}
                                        className="w-full bg-neutral-900 border transition duration-200 border-neutral-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500 outline-none"
                                        placeholder="Enter first name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                                        Last Name
                                    </label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleInputChange}
                                        className="w-full bg-neutral-900 border transition duration-200 border-neutral-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500 outline-none"
                                        placeholder="Enter last name"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-2 gap-4 mt-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                                        Date of Birth
                                    </label>
                                    <DatePicker
                                        selected={formData.dob}
                                        onChange={handleDateChange}
                                        dateFormat="dd/MM/yyyy"
                                        showYearDropdown
                                        scrollableYearDropdown
                                        yearDropdownItemNumber={30}
                                        maxDate={new Date()}
                                        className="w-full bg-neutral-900 border transition duration-200 border-neutral-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500 outline-none"
                                        placeholderText="Select date of birth"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                                        Gender
                                    </label>
                                    <select
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleInputChange}
                                        className="w-full bg-neutral-900 border transition duration-200 border-neutral-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500 outline-none"
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="mb-8">
                            <h2 className="text-xl font-semibold mb-4 text-purple-300">Profile Details</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                                        Profile Heading
                                    </label>
                                    <input
                                        type="text"
                                        name="heading"
                                        value={formData.heading}
                                        onChange={handleInputChange}
                                        className="w-full bg-neutral-900 border transition duration-200 border-neutral-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500 outline-none"
                                        placeholder="e.g., Software Developer, Student"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        rows="4"
                                        className="w-full bg-neutral-900 border transition duration-200 border-neutral-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                                        placeholder="Tell us about yourself..."
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mb-8">
                            <h2 className="text-xl font-semibold mb-4 text-purple-300">Education</h2>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-neutral-300 mb-2">
                                    Education Level
                                </label>
                                <select
                                    name="education.level"
                                    value={formData.education.level}
                                    onChange={handleInputChange}
                                    className="w-full bg-neutral-900 border transition duration-200 border-neutral-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500 outline-none"
                                >
                                    <option value="">Select Education Level</option>
                                    <option value="school">School (up to 10th)</option>
                                    <option value="higher_secondary">Higher Secondary (11th-12th)</option>
                                    <option value="undergraduate">Undergraduate</option>
                                    <option value="postgraduate">Postgraduate</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            {renderEducationFields()}
                        </div>

                        <div className="flex justify-center">
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-purple-600 text-white px-2 py-2 rounded-lg font-semibold text-lg min-w-40 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Updating...
                                    </div>
                                ) : "Update Profile"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default ProfileUpdate