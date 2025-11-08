"use server";

import { customFetch } from '@/api/customFetch';

export const fetchDashboard = async () => {
    try {
        const extensionsResponse = await customFetch("extensions/mobile", "GET");
        if(extensionsResponse?.[0]?.id){
            const [contactResponse, callHistoryResponse, profileResponse, recordingResponse] = await Promise.all([
                customFetch(`extension/${extensionsResponse?.[0]?.id}/contacts`, "GET"),
                customFetch(`extension/${extensionsResponse?.[0]?.id}/calls?limit=10`, "GET"),
                customFetch(`me`, "GET"),
                customFetch(`extension/${extensionsResponse?.[0]?.id}/records`, "GET")
            ])
            
            return {
                success: true,
                data: {
                    extensionData: extensionsResponse,
                    contactData: contactResponse,
                    callHistoryData: callHistoryResponse,
                    profileData: profileResponse,
                    recordingData: recordingResponse
                }
            }
        }
        else {
            return {
                success: false,
                message: 'No extension data found',
                data: []
            };
        }
    } catch (error) {
        console.error('Error fetching dashboard:', error);
        return { success: false, message: 'Failed to fetch dashboard', data: [] };
    }
}