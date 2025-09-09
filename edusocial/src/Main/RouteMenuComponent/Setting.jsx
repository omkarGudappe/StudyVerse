import React, { useState, useEffect } from 'react'
import axios from 'axios'
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { UserDataContextExport } from './CurrentUserContexProvider'
import { auth } from '../../Auth/AuthProviders/FirebaseSDK';

const Setting = () => {
    const { ProfileData, setProfileData } = UserDataContextExport();
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        profileImage: null,
        description: "",
        heading: "",
        dob: "",
        gender: "",
        EduLevel: "",
    });

    const [Education, setEducation] = useState({
        institute: "",
        Year: "",
        Stream: "",
        Degree: "",
        Major: "",
    });

    const [dob, setDob] = useState(null);
    const [EduLevel, setEduLevel] = useState("");
    const userId = auth.currentUser?.uid;

    useEffect(() => {
        if (ProfileData) {
            setFormData({
                firstName: ProfileData.firstName || "",
                lastName: ProfileData.lastName || "",
                description: ProfileData.UserProfile?.description || "",
                heading: ProfileData.UserProfile?.heading || "",
                dob: ProfileData.dob || "",
                gender: ProfileData.gender || "",
                EduLevel: "",
            });

            if (ProfileData.dob) {
                setDob(new Date(ProfileData.dob));
            }

            if (ProfileData.education) {
                const eduParts = ProfileData.education.split(',');
                if (eduParts.length >= 2) {
                    setEducation({
                        institute: eduParts[1] || "",
                        Year: eduParts[0] || "",
                        Stream: eduParts[2] || "",
                        Degree: eduParts[0] || "",
                        Major: eduParts[1] || ""
                    });
                }
            }
        }
    }, [ProfileData]);

    const handleInputChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'profileImage') {
            setFormData(prev => ({ ...prev, profileImage: files[0] }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleEducationChange = (e) => {
        const { name, value } = e.target;
        setEducation(prev => ({ ...prev, [name]: value }));
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
                formDataToSend.append("dob", new Date(formData.dob).toISOString().split('T')[0]);
            }

            if (formData.profileImage) {
                formDataToSend.append("image", formData.profileImage);
            }

            let educationString = "";
            if (EduLevel === "school") {
                educationString = `${Education.Year},${Education.institute}`;
            } else if (EduLevel === "11-12") {
                educationString = `${Education.Year},${Education.Stream},${Education.institute}`;
            } else if (EduLevel === "graduation") {
                educationString = `${Education.Degree},${Education.Major},${Education.Year},${Education.institute}`;
            }
            formDataToSend.append("education", educationString);

            console.log(`${import.meta.env.VITE_API_URL}/user/profile/update/${userId}`, formDataToSend);

            const response = await axios.put(`${import.meta.env.VITE_API_URL}/user/profile/update/${userId}`,{
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            console.log(response);

            if (response.data.ok) {
                setSuccessMessage("Profile updated successfully!");
                setProfileData(response.data.user);
                console.log(response.data);
            } else {
                setError(response.data.message || "Failed to update profile");
            }
            if(response.exist){
                setError(response.exist);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Error updating profile");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-900 text-white py-8 px-2">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-purple-400 mb-2">Profile Settings</h1>
                    <p className="text-neutral-400">Update your personal information and preferences</p>
                </div>

                {/* Success/Error Messages */}
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

                <form onSubmit={handleSubmit} className=" rounded-2xl p-3">
                    {/* Profile Image Section */}
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
                                    selected={dob}
                                    onChange={(date) => {
                                        setDob(date);
                                        setFormData(prev => ({ ...prev, dob: date }));
                                    }}
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

                    {/* Profile Details Section */}
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

                    {/* Education Section */}
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold mb-4 text-purple-300">Education</h2>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-neutral-300 mb-2">
                                Education Level
                            </label>
                            <select
                                value={EduLevel}
                                onChange={(e) => setEduLevel(e.target.value)}
                                className="w-full bg-neutral-900 border transition duration-200 border-neutral-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500 outline-none"
                            >
                                <option value="">Select Education Level</option>
                                <option value="school">School (up to 10th)</option>
                                <option value="11-12">11th / 12th</option>
                                <option value="graduation">Graduation</option>
                            </select>
                        </div>

                        {EduLevel && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                                        {EduLevel === "school" ? "School Name" : 
                                         EduLevel === "11-12" ? "College Name" : "University Name"}
                                    </label>
                                    <input
                                        type="text"
                                        name="institute"
                                        value={Education.institute}
                                        onChange={handleEducationChange}
                                        className="w-full bg-neutral-900 border transition duration-200 border-neutral-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500 outline-none"
                                        placeholder={`Enter ${EduLevel === "school" ? "school" : "institution"} name`}
                                    />
                                </div>

                                {EduLevel === "school" && (
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-300 mb-2">
                                            Standard
                                        </label>
                                        <select
                                            name="Year"
                                            value={Education.Year}
                                            onChange={handleEducationChange}
                                            className="w-full bg-neutral-900 border transition duration-200 border-neutral-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500 outline-none"
                                        >
                                            <option value="">Select Standard</option>
                                            {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(grade => (
                                                <option key={grade} value={grade}>{grade}th</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {EduLevel === "11-12" && (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-neutral-300 mb-2">
                                                    Year
                                                </label>
                                                <select
                                                    name="Year"
                                                    value={Education.Year}
                                                    onChange={handleEducationChange}
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
                                                    name="Stream"
                                                    value={Education.Stream}
                                                    onChange={handleEducationChange}
                                                    className="w-full bg-neutral-900 border transition duration-200 border-neutral-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500 outline-none"
                                                >
                                                    <option value="">Select Stream</option>
                                                    <option value="science">Science</option>
                                                    <option value="commerce">Commerce</option>
                                                    <option value="arts">Arts</option>
                                                </select>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {EduLevel === "graduation" && (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-neutral-300 mb-2">
                                                    Degree
                                                </label>
                                                <input
                                                    type="text"
                                                    name="Degree"
                                                    value={Education.Degree}
                                                    onChange={handleEducationChange}
                                                    className="w-full bg-neutral-900 border transition duration-200 border-neutral-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500 outline-none"
                                                    placeholder="e.g., B.Tech, B.Sc"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-neutral-300 mb-2">
                                                    Major/Field
                                                </label>
                                                <input
                                                    type="text"
                                                    name="Major"
                                                    value={Education.Major}
                                                    onChange={handleEducationChange}
                                                    className="w-full bg-neutral-900 border transition duration-200 border-neutral-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500 outline-none"
                                                    placeholder="e.g., Computer Science"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-300 mb-2">
                                                Year
                                            </label>
                                            <select
                                                name="Year"
                                                value={Education.Year}
                                                onChange={handleEducationChange}
                                                className="w-full bg-neutral-900 border transition duration-200 border-neutral-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500 outline-none"
                                            >
                                                <option value="">Select Year</option>
                                                <option value="1st">1st Year</option>
                                                <option value="2nd">2nd Year</option>
                                                <option value="3rd">3rd Year</option>
                                                <option value="4th">4th Year</option>
                                                <option value="5th">5th Year</option>
                                            </select>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Submit Button */}
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
    )
}

export default Setting