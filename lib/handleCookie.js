'use server'

import { cookies } from "next/headers";

export async function setLoginCookie(accessToken, refreshToken) {
    const cookieStore = await cookies();
    cookieStore.set('at', accessToken, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    });
    cookieStore.set('rt', refreshToken, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    });

}

export async function getLoginCookie() {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('at');
    const refreshToken = cookieStore.get('rt');
    return { accessToken: accessToken?.value, refreshToken: refreshToken?.value };
}

export async function deleteLoginCookie() {
    const cookieStore = await cookies();
    cookieStore.delete('at');
    cookieStore.delete('rt');
}

// export async function isLoginCookieValid() {
//     const { accessToken, refreshToken } = await getLoginCookie();
//     const accessTokenValue = accessToken?.value;
//     const refreshTokenValue = refreshToken?.value;
    
//     console.log("accessToken", accessTokenValue);
//     console.log("refreshToken", refreshTokenValue);
//     if (!accessTokenValue || !refreshTokenValue || accessTokenValue === "" || refreshTokenValue === "" || accessTokenValue === undefined || refreshTokenValue === undefined || accessTokenValue === null || refreshTokenValue === null) {
//         return false;
//     }
//     return true;
// }
