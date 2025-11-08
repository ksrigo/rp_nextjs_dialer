"use server";

import { customFetch } from '@/api/customFetch';

export const fetchContacts = async (extensionId) => {
    try {
        const response = await customFetch(`extension/${extensionId}/contacts`, "GET");
        return {
            success: true,
            data: response
        };
    } catch (error) {
        console.error('Error fetching contacts:', error);
        return { success: false, message: 'Failed to fetch contacts', data: [] };
    }
}

export const addContact = async (extensionId, data) => {
    try {
        const response = await customFetch(`extension/${extensionId}/contacts`, "POST", [data]);
        return {
            success: true,
            message: response.detail || response.message,
            data: response
        };
    } catch (error) {
        console.error('Error adding contact:', error);
        return { success: false, message: error.message || 'Failed to add contact', data: [] };
    }
}

export const deleteContact = async (contactId) => {
    try {
        const response = await customFetch(`contact/${contactId}`, "DELETE");
        return {
            success: true,
            message: response.detail || response.message,
            data: response
        };
    } catch (error) {
        console.error('Error deleting contact:', error);
        return { success: false, message: error.message || 'Failed to delete contact', data: [] };
    }
}

export const editContact = async (contactId, data) => {
    try {
        const response = await customFetch(`contact/${contactId}`, "PATCH", data);
        return {
            success: true,
            message: response.detail || response.message,
            data: response
        };
    } catch (error) {
        console.error('Error editing contact:', error);
        return { success: false, message: error.message || 'Failed to edit contact', data: [] };
    }
}