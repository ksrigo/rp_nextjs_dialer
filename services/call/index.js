"use server";

import { customFetch } from '@/api/customFetch';

export const fetchCallHistory = async (extensionId) => {
    try {
        const response = await customFetch(`extension/${extensionId}/calls`, "GET");
        console.log("response", response);
        return {
            success: true,
            data: response
        };
    } catch (error) {
        console.error('Error fetching call history:', error);
        return { success: false, message: 'Failed to fetch call history', data: [] };
    }
}

export const fetchRecording = async (extensionId) => {
    try {
        const response = await customFetch(`extension/${extensionId}/records`, "GET");
        console.log("response", response);
        return {
            success: true,
            data: response
        };
    } catch (error) {
        console.error('Error fetching call history:', error);
        return { success: false, message: 'Failed to fetch call history', data: [] };
    }
}

export const recordCall = async (extensionId, data) => {
    try {
        const response = await customFetch(`extension/${extensionId}/record`, "POST", data);
        return {
            success: true,
            data: response
        };
    } catch (error) {
        console.error('Error recording call:', error);
        return { success: false, message: 'Failed to record call', data: [] };
    }
}