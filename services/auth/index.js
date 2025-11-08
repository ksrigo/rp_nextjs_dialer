"use server";

import { customFetch } from '@/api/customFetch';
import { signOut } from 'next-auth/react';

export const forgotPassword = async (data) => {
    try {
        const response = await customFetch('forget_password', 'POST', data);
        return {
            success: true,
            message: response.detail || response.message,
            data: response
        };
    } catch (error) {
        console.error('Error forgot password:', error);
        return { success: false, message: error.message || response?.detail?.[0]?.msg || 'Failed to forgot password', data: [] };
    }
}

export const login = async (data) => {
    try {
        const response = await customFetch('signin', 'POST', data, true);
        return {
            success: true,
            message: response.detail || response.message || 'Login successful',
            data: response
        };
    } catch (error) {
        console.error('Error login:', error);
        return { success: false, message: error.message || 'Failed to login', data: [] };
    }
}

export const changePassword = async (data) => {
    try {
        const response = await customFetch('password', 'PUT', data);
        console.log("response", response);
        if(response.detail || response.message == "new password and current password cannot be the same") {
            return {
                success: false,
                message: 'New password and current password cannot be the same',
                data: response
            };
        }
        return {
            success: true,
            message: response.detail || response.message || 'Password changed successfully',
            data: response
        };
    } catch (error) {
        console.error('Error reset password:', error);
        return { success: false, message: error.message || 'Failed to reset password', data: [] };
    }
}

export const refreshToken = async (data) => {
    try {
        const API_URL = process.env.API_URL;
        const resp = await fetch(`${API_URL}/refresh`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ refresh_token: data.refreshToken })
        });
        const json = await resp.json().catch(() => ({}));
        if (!resp.ok) {
            return {
                success: false,
                message: json?.detail || json?.message || 'Failed to refresh token',
                data: []
            };
        }
        return {
            success: true,
            message: json.detail || json.message || 'Token refreshed successfully',
            data: json
        };
    } catch (error) {
        console.error('Error refresh token:', error);
        return { success: false, message: error.message || 'Failed to refresh token', data: [] };
    }
}

