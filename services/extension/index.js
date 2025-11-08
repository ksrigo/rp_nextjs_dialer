"use server";

import { customFetch } from '@/api/customFetch';

export const fetchExtensions = async () => {
    try {
        const response = await customFetch("extensions/mobile", "GET");
        return {
            success: true,
            data: response
        };
    } catch (error) {
        console.error('Error fetching extensions:', error);
        return { success: false, message: 'Failed to fetch extensions', data: [] };
    }
}