"use client"
import Script from 'next/script'
import '@/public/assets/css/bootstrap.min.css'
import '@/public/assets/css/icons.min.css'
import '@/public/assets/css/app.min.css'
import '@/public/assets/css/dialer.css'
import { useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { SessionProvider } from 'next-auth/react'
// import RefreshToken from '/components/shared/RefreshToken'
// import { createContext } from 'react';
// export const ExtensionContext = createContext();

export default function RootLayout({ children }) {

  useEffect(() => {
    const handleUserInteraction = () => {
        document.body.setAttribute('data-user-interacted', 'true');
    };
    
    // Common user interaction events
    const interactionEvents = [
        'click',
        'keydown',
        'touchstart',
        'mousedown',
        'scroll',
        'wheel',
        'input',
        'focus'
    ];
    
    // Add all event listeners
    interactionEvents.forEach(event => {
        document.body.addEventListener(event, handleUserInteraction);
    });
    
    // Cleanup function to remove all event listeners
    return () => {
        interactionEvents.forEach(event => {
            document.body.removeEventListener(event, handleUserInteraction);
        });
    };
}, []);
  
  return (
    <html lang="en">
      <body>
        {/* <RefreshToken /> */}
          <SessionProvider>
            {children}
          </SessionProvider>
        {/* <LayoutWrapper></LayoutWrapper> */}
        {/* <script src="/assets/libs/jquery/jquery.min.js"></script> */}
        <Script src="/assets/libs/bootstrap/js/bootstrap.bundle.min.js" strategy="beforeInteractive" />
        {/* <script src="/assets/libs/simplebar/simplebar.min.js"></script> */}
        {/* <script src="/assets/libs/node-waves/waves.min.js"></script> */}
        {/* <script src="/assets/libs/magnific-popup/jquery.magnific-popup.min.js"></script> */}
        {/* <script src="/assets/libs/owl.carousel/owl.carousel.min.js"></script> */}
        {/* <script src="/assets/js/pages/index.init.js"></script> */}
        {/* <Script src="/assets/js/app.js" strategy="afterInteractive" /> */}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
