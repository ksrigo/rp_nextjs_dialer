'use server'

import { getLoginCookie } from "@/lib/handleCookie";
import { cookies } from "next/headers";

export const updateAccessTokenCookie = async (accessToken) => {
    try {
        const cookieStore = await cookies();
        // cookieStore.set('at', accessToken, { path: '/', httpOnly: true, secure: true });
        console.log('Access token cookie set successfully');
    } catch (error) {
        console.error('Error setting access token cookie:', error);
    }
};

export const customFetch = async (url, method="GET", body={}, isFormData=false, headers={}) => {
    const API_URL = process.env.API_URL;
    const {accessToken} = await getLoginCookie();

    
    const defaultHeaders = {
        "Accept": "application/json",
        ...(accessToken && { "Authorization": `Bearer ${accessToken}` }),
        ...headers
    };

    

    try {
        const options = {
            method,
            headers: defaultHeaders,
        };

        if (body && method.toUpperCase() !== "GET" && method.toUpperCase() !== "DELETE") {
            if(isFormData) {
                const formBody = Object.keys(body)
                    .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(body[key]))
                    .join('&');
                options.headers["Content-Type"] = "application/x-www-form-urlencoded";
                options.body = formBody;
            } else {
                options.headers["Content-Type"] = "application/json";
                options.body = JSON.stringify(body);
            }
        }
  
        const response = await fetch(`${API_URL}/${url}`, options);
        const data = await response.json();

        // console.log("data customFetch", data);
        
        // if(data?.detail === "Token expired" || data?.detail === "Invalid token") {
        //     try {
        //         const refreshResult = await refreshLoginCookie();
        //         if (!refreshResult || refreshResult.detail === "Invalid token") {
        //             // const deleteResult = await deleteLoginCookie();
        //             // console.log("deleteResult", deleteResult);
        //             // return { error: true, message: "Session expired" };
        //         }
                
        //         // Update cookies with new token
        //         await updateAccessTokenCookie(refreshResult.accessToken);

        //         // cookieStore.set('accessToken', refreshResult.accessToken, { path: '/', httpOnly: true, secure: true });
        //         console.log("refreshResult", refreshResult);
        //         // Retry the original request with new token
        //         options.headers["Authorization"] = `Bearer ${refreshResult.accessToken}`;
        //         const retryResponse = await fetch(`${API_URL}/${url}`, options);
        //         return await retryResponse.json();
        //     } catch (error) {
        //         console.log("error", error);
        //         await deleteLoginCookie();
        //         return { error: true, message: "Authentication failed" };
        //     }
        // }

        return data;

    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
}