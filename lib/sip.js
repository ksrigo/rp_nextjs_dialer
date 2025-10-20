'use client'

import { UserAgent,Registerer, RegistererState } from 'sip.js';


const createConfig = (extensionData) => ({
    USER: extensionData?.[0]?.extension,
    DOMAIN: extensionData?.[0]?.domain,
    PASSWORD: extensionData?.[0]?.password,
    NAME: extensionData?.[0]?.name,
    PROXY: extensionData?.[0]?.proxy ? `wss://${extensionData?.[0]?.proxy}:4643` : null
});
const speakerDeviceId = "default";
let userAgent;
let registerer;

export const initUserAgent = async (delegate, extensionData) => {
    try {
        const config = createConfig(extensionData);
        
        if (!config.USER || !config.DOMAIN || !config.PASSWORD || !config.PROXY) {
            throw new Error("Extension data is incomplete");
        }
        
        const uri = UserAgent.makeURI(`sip:${config.USER}@${config.DOMAIN}`);
        if (!uri) {
            throw new Error("Failed to create URI");
        }

        const userAgentOptions = {
            logLevel: "debug",
            uri: uri,
            authorizationUsername: config.USER,
            authorizationPassword: config.PASSWORD,
            displayName: config.NAME,
            transportOptions: {
                server: config.PROXY,
                keepAliveInterval: 0,
                connectionTimeout: 90,
                traceSip: true,
            },
            sessionDescriptionHandlerFactoryOptions: {
                peerConnectionOptions: {
                    rtcConfiguration: {
                        iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }],
                    },
                },
            },
            delegate: delegate,
            hackAllowUnregisteredOptionTags: true,
            allowLegacyNotifications: true,
            contact: {
                uri: uri,
                params: { transport: "ws", ob: null },
            },
            register: true,
            contactParams: {},
            contactName: config.USER,
        };

        // Initialize UserAgent
        const userAgent = new UserAgent(userAgentOptions);
        await userAgent.start();

        // console.log("✅ UserAgent started successfully");

        // Registerer options
        const registererOptions = {
            expires: 180,
            refreshFrequency: 90,
        };

        const registerer = new Registerer(userAgent, registererOptions);

        // Track registration state
        let registrationStatus = "Connecting";

        registerer.stateChange.addListener((state) => {
            switch (state) {
                case RegistererState.Registered:
                    console.log("✅ Registration successful!");
                    registrationStatus = "Registered";
                    break;
                case RegistererState.Unregistered:
                    console.log("❌ Unregistered from SIP server");
                    registrationStatus = "Unregistered";
                    break;
                case RegistererState.Terminated:
                    console.log("❌ Registration terminated");
                    registrationStatus = "Terminated";
                    break;
            }
        });

        // Send REGISTER request
        await registerer.register({
            requestDelegate: {
                onReject(response) {
                    console.error("❌ Registration rejected:", response.message.statusCode);
                    registrationStatus = "Rejected";
                },
                onAccept(response) {
                    console.log("✅ Registration accepted!");
                    registrationStatus = "Registered";
                },
            },
        });

        return {
            userAgent,
            registerer,
            status: registrationStatus,
            connected: true,
        };
    } catch (error) {
        console.error("❌ Connection setup failed:", error);
        return { error: error.message, status: "Error" };
    }
};

// // Function to initialize SIP UserAgent
// export const initUserAgent = async () => {
//   const uri = UserAgent.makeURI('sip:' + config.user + '@' + config.domain);
  


//   try {
//     userAgent = new UserAgent({
//         logLevel: "debug",
//         uri: uri,
//         authorizationUsername: config.authorizationUser,
//         authorizationPassword: config.password,
//         displayName: config.displayName,
//         transportOptions: {
//           server: config.proxy[0],
//           keepAliveInterval: 15,
//           connectionTimeout: 10,
//           speakerDeviceId: speakerDeviceId,
//         },
//         register: true,
//         traceSip: true,
//         contactName: config.contactName,
//       });
//     await userAgent.start();
    
//     // Set up registerer
//     registerer = new Registerer(userAgent, {
//       expires: 180,
//       refreshFrequency: 90,
//     });

//     await registerer.register();

//     // Set up incoming call handler
//     userAgent.delegate = {
//       onInvite: (invitation) => {
//         console.log('Incoming call...');
//         handleIncomingCall(invitation);
//       },
//     };

//     return userAgent;
//   } catch (error) {
//     console.error('Error initializing SIP UserAgent:', error);
//     throw error;
//   }
// };

// // Handle incoming calls
// const handleIncomingCall = (invitation) => {
//   // You can interact with the incoming invitation here.
//   console.log(`Incoming call from: ${invitation.remoteIdentity.uri}`);

//   // Answer the incoming call with a 200 OK response
//   invitation.accept().then(() => {
//     console.log('Call accepted');
//     // Now you can manage the call (e.g., set up media, mute/unmute, etc.)
//   }).catch((error) => {
//     console.error('Error accepting the call:', error);
//   });
// };


// export {userAgent};


