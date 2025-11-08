"use server";

import { customFetch } from '@/api/customFetch';

export const fetchProfile = async () => {
    try {
        const response = await customFetch("me", "GET");
        return {
            success: true,
            data: response
        };
    } catch (error) {
        console.error('Error fetching profile:', error);
        return { success: false, message: 'Failed to fetch profile', data: [] };
    }
}

export const updateProfile = async (data) => {
    try {
        const response = await customFetch("me", "PATCH", data);
        return {
            success: true,
            data: response,
            message:'Profile updated successfully',
        };
    } catch (error) {
        console.error('Error updating profile:', error);
        return { success: false, message: 'Failed to update profile', data: [] };
    }
}