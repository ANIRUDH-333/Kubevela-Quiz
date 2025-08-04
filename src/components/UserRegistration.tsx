import React, { useState } from 'react';
import { UserData } from '../types/quiz';

interface UserRegistrationProps {
    onSubmit: (userData: UserData) => void;
    isLoading?: boolean;
}

const UserRegistration: React.FC<UserRegistrationProps> = ({ onSubmit, isLoading = false }) => {
    const [formData, setFormData] = useState<UserData>({
        email: '',
        name: '',
        companyName: ''
    });
    const [errors, setErrors] = useState<Partial<UserData>>({});

    const handleInputChange = (field: keyof UserData, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        
        // Clear error for this field when user starts typing
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: undefined
            }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Partial<UserData> = {};

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (validateForm()) {
            const userData: UserData = {
                email: formData.email.trim(),
                name: formData.name.trim(),
                companyName: formData.companyName?.trim() || undefined
            };
            onSubmit(userData);
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent, action: () => void) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            action();
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 py-8 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md">
                {/* Logos */}
                <div className="flex justify-between items-center mb-6">
                    <img
                        src="/oss-summit-logo.jpeg"
                        alt="OSS Summit Logo"
                        className="h-10 object-contain"
                    />
                    <img
                        src="/guidewire-logo.png"
                        alt="Guidewire Logo"
                        className="h-10 object-contain"
                    />
                </div>
                
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        Welcome to the Quiz
                    </h1>
                    <p className="text-gray-600">
                        Please provide your details to get started
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Email Field */}
                    <div>
                        <label 
                            htmlFor="email" 
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                                errors.email ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Enter your email address"
                            disabled={isLoading}
                            aria-describedby={errors.email ? 'email-error' : undefined}
                        />
                        {errors.email && (
                            <p id="email-error" className="mt-1 text-sm text-red-600">
                                {errors.email}
                            </p>
                        )}
                    </div>

                    {/* Name Field */}
                    <div>
                        <label 
                            htmlFor="name" 
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="name"
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                                errors.name ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Enter your full name"
                            disabled={isLoading}
                            aria-describedby={errors.name ? 'name-error' : undefined}
                        />
                        {errors.name && (
                            <p id="name-error" className="mt-1 text-sm text-red-600">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    {/* Company Name Field */}
                    <div>
                        <label 
                            htmlFor="companyName" 
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            Company Name <span className="text-gray-400">(Optional)</span>
                        </label>
                        <input
                            id="companyName"
                            type="text"
                            value={formData.companyName}
                            onChange={(e) => handleInputChange('companyName', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                            placeholder="Enter your company name"
                            disabled={isLoading}
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        onKeyDown={(e) => handleKeyDown(e, () => handleSubmit(e as any))}
                        className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            isLoading 
                                ? 'bg-gray-400 cursor-not-allowed' 
                                : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                        }`}
                        tabIndex={0}
                        aria-label="Start quiz"
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                Starting Quiz...
                            </div>
                        ) : (
                            'Start Quiz'
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-500">
                    <p>Your information will be kept confidential and used only for quiz tracking purposes.</p>
                </div>
            </div>
        </div>
    );
};

export default UserRegistration;
