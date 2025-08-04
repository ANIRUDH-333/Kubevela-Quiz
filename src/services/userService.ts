import { UserData } from '../types/quiz';

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

export const saveUserData = async (userData: UserData): Promise<{ success: boolean; message: string }> => {
    try {
        const response = await fetch(`${API_BASE_URL}/user-data`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }

        return {
            success: true,
            message: data.message || 'User data saved successfully'
        };
    } catch (error) {
        console.error('Error saving user data:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to save user data');
    }
};
