import Credentials from "next-auth/providers/credentials";
import NextAuth from "next-auth";
import { customFetch } from "@/api/customFetch";
import  { jwtDecode } from "jwt-decode";
import { refreshToken } from "@/services/auth";

async function refreshAccessToken(token) {
  console.log("refreshAccessToken", token);
  try {
    const resp = await refreshToken({ refreshToken: token.refreshToken });
    console.log("resp", resp);
    if (!resp.success) {
      return { ...token, error: "RefreshAccessTokenError" };
    }
    const newAccessToken = resp.data?.access_token || resp.data?.accessToken;
    const newRefreshToken = resp.data?.refresh_token || resp.data?.refreshToken || token.refreshToken; 
    if (!newAccessToken) {
      return { ...token, error: "InvalidRefreshResponse" };
    }
    const decoded = jwtDecode(newAccessToken);
    return {
      ...token,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      accessTokenExpires: decoded.exp,
      error: undefined,
    };
  } catch (e) {
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

export const authOptions = {
  providers: [ 
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Missing credentials");
        }

        try {

          const response = await customFetch("signin", "POST", {
              username: credentials.username,
              password: credentials.password
          }, true); 

          console.log("response", response.access_token);
          
          if(response.detail && response.status === 400){
            throw new Error(response.detail);
          }

          // Normalize backend response shapes
          const userData = response?.data?.user || response?.user || null;
          const access =
            response?.data?.accessToken ||
            response?.data?.access_token ||
            response?.access_token ||
            response?.accessToken;
          const refresh =
            response?.data?.refreshToken ||
            response?.data?.refresh_token ||
            response?.refresh_token ||
            response?.refreshToken;

          if (!access) {
            const message =
              response?.detail ||
              response?.message ||
              response?.error ||
              "Invalid response from server";
            throw new Error(message);
          }

          const {
            id,
            firstName,
            lastName,
            username,
            email,
            role,
          } = userData || {};

          return {
            id: id || credentials.username,
            userId: id || credentials.username,
            username: username || credentials.username,
            name: (firstName && lastName) ? `${firstName} ${lastName}` : (firstName || lastName || credentials.username),
            email: email || credentials.username,
            role: role,
            accessToken: access,
            refreshToken: refresh,
          };
        } catch (error) {
          console.error("Authentication error:", error);
          if (error?.message) {
            throw new Error(error.message);
          } else if (error?.response?.data?.detail) {
            throw new Error(error.response.data.detail);
          } else {
            throw new Error("Authentication failed");
          }
        }
      },
    }),
  ],
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: "/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours - ensure JWT persistence
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },
  callbacks: {
    
    async jwt({ token, user }) {
      
      if (user) {
        const decoded = jwtDecode(user.accessToken);
        // Store only essential data to reduce cookie size
        token.userId = user.userId;
        token.role = user.role?.name; // Store role name for easy authorization checks
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.accessTokenExpires = decoded.exp;
        console.log("JWT callback - new login, setting initial tokens:", {
          hasAccessToken: !!token.accessToken,
          hasRefreshToken: !!token.refreshToken,
          accessTokenExpires: token.accessTokenExpires
        });
        return token;
      }

      // If token expired, try to refresh using refresh token
      const nowSec = Math.floor(Date.now() / 1000);
    
      if (token?.accessTokenExpires && typeof token.accessTokenExpires === "number" && token.accessTokenExpires <= nowSec) {
        const refreshed = await refreshAccessToken(token);
        if (refreshed?.error) {
          console.log("JWT callback - refresh failed:", refreshed.error);
        }
        return refreshed;
      }

      // Not expired, return as-is
      return token;
    },

    async session({ session, token }) {
      console.log("Session callback - token:", { 
        hasAccessToken: !!token.accessToken, 
        hasRefreshToken: !!token.refreshToken,
        accessTokenExpires: token.accessTokenExpires 
      });
      if (session.user) {
        // Store only essential data - fetch full user/role data from API when needed
        session.user.userId = token.userId;
        session.user.role = token.role;
        session.accessToken = token.accessToken;
        session.refreshToken = token.refreshToken;
        if (token?.error) {
          session.error = token.error;
        }
      }
      console.log("Session callback - final session:", { 
        hasAccessToken: !!session.accessToken, 
        hasRefreshToken: !!session.refreshToken 
      });
      return session;
    },
  },
  debug: process.env.NODE_ENV !== "production",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
