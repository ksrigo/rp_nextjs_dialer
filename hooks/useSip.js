'use client'

import { playRingingSound } from '@/lib/ringtone';   
import { stopRingingSound } from '@/lib/ringtone';
// import { loadRingingSound } from '/lib/ringtone';
import { useState, useEffect } from 'react';
import { UserAgent, RegistererState, Registerer, SessionState } from 'sip.js';
import { useDialer } from '@/app/context/DialerContext';
// const config = {
//     USER: process.env.USER_ID,
//     DOMAIN: process.env.DOMAIN,
//     PASSWORD: process.env.PASSWORD,
//     NAME: process.env.NAME,
//     PROXY: process.env.PROXY
// };

// USER_ID=1002
// DOMAIN=10012.ringplus.co.uk
// PASSWORD=0Yvb20132LI
// NAME=Dialer
// PROXY=wss://phone.driverszone.fr:4643

export const useSip = (delegate) => {

    const {extensionData, selectedExtension} = useDialer();

    const current = selectedExtension || (Array.isArray(extensionData) ? extensionData[0] : null);
    const config = {
        USER: current?.extension,
        DOMAIN: current?.domain,
        PASSWORD: current?.password,
        NAME: current?.name,
        PROXY: current?.proxy ? `wss://${current?.proxy}:4643` : null
    };


    const [sipState, setSipState] = useState({
        userAgent: null,
        registerer: null,
        status: 'Disconnected',
        connected: false,
        error: null
    });

    // console.log('config', config);
    useEffect(() => {
        let mounted = true;

        const initializeUA = async () => {
            try {
                // Don't initialize if extension data is not available
                if (!extensionData?.[0] || !config.USER || !config.DOMAIN || !config.PASSWORD || !config.PROXY) {
                    console.log('Extension data not available yet, skipping SIP initialization');
                    return;
                }
                const uri = UserAgent.makeURI(`sip:${config.USER}@${config.DOMAIN}`);
                if (!uri) {
                    throw new Error("Failed to create URI");
                }

                // Revert to simpler configuration (no outbound instance enforcement)
                const instanceId = undefined;

                const userAgentOptions = {
                    logLevel: "debug",
                    uri: uri,
                    authorizationUsername: config.USER,
                    authorizationPassword: config.PASSWORD,
                    displayName: config.NAME,
                    sipExtensionReplaces: "Supported",
                    sipExtensionExtraSupported: ["replaces"],
                    instanceId: undefined,
                    instanceIdAlwaysAdded: false,
                    transportOptions: {
                        server: config.PROXY,
                        keepAliveInterval: 0,
                        connectionTimeout: 90,
                        traceSip: true,
                    },
                    sessionDescriptionHandlerFactoryOptions: {
                        constraints: {
                            audio: true,
                            video: false
                        },
                        peerConnectionOptions: {
                            rtcConfiguration: {
                                iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }],
                            },
                        },
                    },
                    delegate: delegate,
                    hackAllowUnregisteredOptionTags: true,
                    allowLegacyNotifications: true,
                    contact: undefined,
                    register: true,
                    contactParams: {},
                    contactName: config.USER,
                };
        

                const userAgent = new UserAgent(userAgentOptions);
                await userAgent.start();

                const registererOptions = {
                    expires: 180,
                    refreshFrequency: 90,
                };

                const registerer = new Registerer(userAgent, registererOptions);

                if (mounted) {
                    setSipState(prev => ({ ...prev, userAgent, registerer }));
                }

                registerer.stateChange.addListener((state) => {
                    if (!mounted) return;
                    
                    let status = "Connecting";
                    switch (state) {
                        case RegistererState.Registered:
                            status = "Registered";
                            break;
                        case RegistererState.Unregistered:
                            status = "Unregistered";
                            break;
                        case RegistererState.Terminated:
                            status = "Terminated";
                            break;
                        case RegistererState.Rejected:
                            status = "Rejected";
                            break;
                        case RegistererState.Answered:
                            status = "Answered";
                            break;
                        case RegistererState.Terminating:
                            status = "Terminating";
                            break;
                        case RegistererState.Connecting:
                            status = "Connecting";
                            break;
                        case RegistererState.Transferring:
                            status = "Transferring";
                            break;
                        case RegistererState.Hold:
                            status = "Hold";
                            break;
                        case RegistererState.Progress:
                            status = "Progress";
                            break;
                      
                            

                    }
                    
                    setSipState(prev => ({ ...prev, status }));
                });

                await registerer.register();
                // loadRingingSound();

                if (mounted) {
                    setSipState(prev => ({ ...prev, status: 'Registered', connected: true, error: null }));
                }
            } catch (error) {
                if (mounted) {
                    setSipState(prev => ({
                        ...prev,
                        error: error.message,
                        status: 'Error',
                        connected: false
                    }));
                }
            }
        };

        // Track local UA/registerer for proper cleanup on extension change
        let localUA; let localRegisterer;
        (async () => {
            try {
                const uri = UserAgent.makeURI(`sip:${config.USER}@${config.DOMAIN}`);
                if (!uri) return;
                const ua = new UserAgent({
                    ...{
                        logLevel: "debug",
                        uri,
                        authorizationUsername: config.USER,
                        authorizationPassword: config.PASSWORD,
                        displayName: config.NAME,
                        sipExtensionReplaces: "Supported",
                        sipExtensionExtraSupported: ["replaces"],
                        transportOptions: { server: config.PROXY, keepAliveInterval: 0, connectionTimeout: 90, traceSip: true },
                        sessionDescriptionHandlerFactoryOptions: {
                            constraints: {
                                audio: true,
                                video: false
                            },
                            peerConnectionOptions: {
                                rtcConfiguration: { iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }] }
                            }
                        },
                        delegate: delegate,
                        hackAllowUnregisteredOptionTags: true,
                        allowLegacyNotifications: true,
                        register: true,
                        contactName: config.USER,
                        contactParams: {}
                    }
                });
                localUA = ua;
                await ua.start();
                const reg = new Registerer(ua, { expires: 180, refreshFrequency: 90 });
                localRegisterer = reg;
                if (mounted) setSipState(prev => ({ ...prev, userAgent: ua, registerer: reg }));
                reg.stateChange.addListener((state) => {
                    if (!mounted) return;
                    let status = "Connecting";
                    switch (state) {
                        case RegistererState.Registered: status = "Registered"; break;
                        case RegistererState.Unregistered: status = "Unregistered"; break;
                        case RegistererState.Terminated: status = "Terminated"; break;
                        case RegistererState.Rejected: status = "Rejected"; break;
                        default: status = "Connecting"; break;
                    }
                    setSipState(prev => ({ ...prev, status }));
                });
                await reg.register();
                if (mounted) setSipState(prev => ({ ...prev, status: 'Registered', connected: true, error: null }));
            } catch (e) {
                if (mounted) setSipState(prev => ({ ...prev, error: e.message, status: 'Error', connected: false }));
            }
        })();

        return () => {
            mounted = false;
            // Cleanup previous UA/registration
            if (localRegisterer) { try { localRegisterer.unregister(); } catch (_) {} }
            if (localUA) { try { localUA.stop(); } catch (_) {} }
        };
    }, [delegate, selectedExtension]);

    return sipState;
};

const forceStopRingingSound = async () => {
    await stopRingingSound();
};

export const initSession = (invitation, sessionStatus, silent = false, callbacks = {}) => {
    const session = invitation;
    const {
        onSessionStateChange,
        onTabChange,
        onRejectCall,
        onSessionData
    } = callbacks;

    session.displayName = session.remoteIdentity?.displayName || session.remoteIdentity?.uri?.user;
    session.ctxid = Math.random().toString(36).substr(2, 9);
    session.isOnHold = false;
    session.silent = silent;

    // console.log('newSession');
    // console.log('session=====================',session);
    // console.log('session.request',session.request);
    // const callId = session.request?.callId || session.id || 'unknown';
    // console.log('Call ID:', callId);

    const newSessionData = {
        'id': session.ctxid,
        'phoneNumber': session.remoteIdentity.uri.user,
        'calledNumber': session.localIdentity.uri.user,
        'displayName': session.displayName,
        'status': sessionStatus,
        'callState': session.state
    };
    
    if (onSessionData) {
        onSessionData(newSessionData);
    }
    session.data = newSessionData;

    if (sessionStatus === 'incoming' && !silent) {
         playRingingSound();

    }

    console.log('sessionStatus',sessionStatus);

    session.stateChange.addListener((state) => {
        console.log("📞 Call State Changed........:", state);
        if (onSessionStateChange) {
            onSessionStateChange(state);
        }

        if (state === SessionState.Terminated || state === SessionState.Terminating) {
            if (callbacks.onSessionTerminated) {
                callbacks.onSessionTerminated(session);
            }
        }
    });

    session.delegate = {
        onInvite: async (invitation) => {
            console.log("INVITE received - stopping sound");
            await forceStopRingingSound();
        },
        
        onBye: async () => {
            console.log("BYE received - stopping sound");
            await forceStopRingingSound();
        },
        onCancel: async () => {
            console.log("CANCEL received - stopping sound");
            session.status = 'Terminated';
            if (onTabChange) {
                onTabChange(1);
            }
            await forceStopRingingSound();
        },
        onRefer: async () => {
            console.log("REFER received - stopping sound");
            await forceStopRingingSound();
        },
        onBye: async () => {
            console.log("BYE received - cleaning up and updating UI");
            await forceStopRingingSound();
            session.status = 'Terminated';
            if (callbacks.onTerminatedCall) {
                await callbacks.onTerminatedCall();
            }
        },
        onAnswered: async () => {
            console.log("ANSWERED received - stopping sound");
            await forceStopRingingSound();
            session.status = 'Answered';
            if (callbacks.onAnsweredCall) {
                await callbacks.onAnsweredCall();   
            }
            // console.log('session.request=========',session.request);
            // const callId = session.request?.callId || session.id || 'unknown';
            // console.log('Call ID:', callId);
        },
        onTransferring: async () => {
            console.log("TRANSFERRING received - stopping sound");
            // await forceStopRingingSound();
            session.status = 'Transferring';
        },
        // onReject: async () => {
        //     console.log("REJECT received - stopping sound");
        //     await forceStopRingingSound();
        //     session.status = 'Rejected';
        //     if (onRejectCall) {
        //         await onRejectCall();
        //     }
        // },
        onRejected: async () => {
            console.log("REJECTED received - stopping sound");
            await forceStopRingingSound();
            session.status = 'Rejected';
            if (callbacks.onRejectedCall) {
                await callbacks.onRejectedCall();
            }
        },
        onTerminated: async () => {
            console.log("TERMINATED received - stopping sound");
            await forceStopRingingSound();
            session.status = 'Terminated';
            if (callbacks.onTerminatedCall) {
                await callbacks.onTerminatedCall();
            }
        }
    };

    return session;
}

// const initDelegate = (userDelegate) => {
//     console.log("InitDelegate: Setting up SIP delegate");
    
//     // Extract setActiveTap from the delegate if available
//     const setActiveTap = userDelegate?.setActiveTap;
    
//     // Create a container for active sessions
//     const sessions = [];
    
//     const createAudioContext = () => {
//         return new (window.AudioContext || window.webkitAudioContext)();
//     };
    
//     // Helper function to terminate a session
//     const terminate = (session) => {
//         try {
//             if (session && session.state !== SessionState.Terminated) {
//                 session.terminate();
//             }
//         } catch (error) {
//             console.error('Error terminating session:', error);
//         }
//     };
    
//     // Handle established session and set up audio
//     const sessionEstablishedHandler = async (session) => {
//         console.log("Session established:", session);
        
//         if (session.data.status === 'incoming') {
//             await stopRingingSound();
//         }
        
//         // Create and configure remote audio element
//         const remoteAudioElement = new Audio();
//         const remoteStream = session.sessionDescriptionHandler.remoteMediaStream;
        
//         remoteAudioElement.srcObject = remoteStream;
//         remoteAudioElement.autoplay = true;
//         remoteAudioElement.play().catch((error) => {
//             console.error(`Failed to play remote media:`, error.message);
//         });
        
//         // Access the session description handler and peer connection
//         const sessionDescriptionHandler = session.sessionDescriptionHandler;
//         if (!sessionDescriptionHandler || typeof sessionDescriptionHandler.getDescription !== 'function') {
//             throw new Error("Session's session description handler is not properly initialized.");
//         }
        
//         const peerConnection = sessionDescriptionHandler.peerConnection;
//         if (!peerConnection) {
//             throw new Error("Peer connection closed.");
//         }
        
//         // Set up audio processing to ensure bidirectional audio works
//         const audioContext = createAudioContext();
//         const senders = peerConnection.getSenders();
        
//         // Find audio sender
//         const sender = senders.find(s => s.track && s.track.kind === 'audio');
        
//         if (sender && sender.track) {
//             // Ensure track is enabled
//             sender.track.enabled = true;
            
//             // Create gain node for volume control (important for audio path)
//             const gainNode = audioContext.createGain();
//             const stream = new MediaStream([sender.track]);
//             const audioSource = audioContext.createMediaStreamSource(stream);
//             const audioDestination = audioContext.createMediaStreamDestination();
            
//             audioSource.connect(gainNode);
//             gainNode.connect(audioDestination);
//             gainNode.gain.value = 1; // Ensure volume is up
            
//             // Replace track with processed one to ensure audio path is maintained
//             sender.replaceTrack(audioDestination.stream.getTracks()[0]);
            
//             // Store audio context and nodes in session for later reference
//             session._audioContext = {
//                 remote_audio: remoteAudioElement,
//                 gain_node: gainNode,
//                 audio_source: audioSource,
//                 init_sender_track: audioDestination.stream.getTracks()[0],
//                 audio_ctx: audioContext
//             };
            
//             console.log('Audio processing chain established');
//         } else {
//             console.warn('No audio sender found in peer connection');
//         }
        
//         // Log connection details for debugging
//         console.log('SDP:', sessionDescriptionHandler.peerConnection.remoteDescription.sdp);
//         console.log('Audio Senders:', peerConnection.getSenders().map(s => 
//             s.track ? `${s.track.kind} (${s.track.enabled ? 'enabled' : 'disabled'})` : 'no track'));
//         console.log('Audio Receivers:', peerConnection.getReceivers().map(r => 
//             r.track ? `${r.track.kind} (${r.track.enabled ? 'enabled' : 'disabled'})` : 'no track'));
//     };
    
//     return {
//         onInvite: (invitation) => {
//             console.log("Incoming call invitation received");
            
//             // Use setActiveTap if available
//             if (typeof setActiveTap === 'function') {
//                 setActiveTap(4); // Navigate to incoming call screen
//             }
            
//             // Create caller info object
//             const callerInfo = {
//                 displayName: invitation.remoteIdentity.displayName || 'Unknown',
//                 phoneNumber: invitation.remoteIdentity.uri.user,
//                 callerId: invitation.remoteIdentity.uri.user
//             };
            
//             // Reject if we already have 2 active sessions
//             if (sessions.length >= 2) {
//                 console.log("Already 2 sessions - rejecting call");
//                 invitation.reject();
//                 return;
//             }
            
//             console.log("Creating new session for incoming call");
//             const session = initSession(invitation, 'incoming');
//             sessions.push(session);
            
//             session.stateChange.addListener((newState) => {
//                 console.log("📞 Call State Changed:", newState);
                
//                 switch (newState) {
//                     case SessionState.Established:
//                         console.log("Call Established");
//                         sessionEstablishedHandler(session);
//                         break;
//                     case SessionState.Terminated:
//                         console.log("Call Terminated");
//                         const index = sessions.indexOf(session);
//                         if (index !== -1) {
//                             sessions.splice(index, 1);
//                         }
//                         break;
//                 }
//             });
//         },
        
//         onDisconnect: async (error) => {
//             console.log('🔌 SIP Disconnected:', error);
            
//             // Terminate all active sessions
//             sessions.forEach(session => {
//                 terminate(session);
//             });
            
//             sessions.length = 0; // Clear sessions array
            
//             // Only attempt to reconnect if network/server dropped the connection
//             if (error) {
//                 console.log('Disconnection error:', error);
//                 // Will reconnect via useEffect cleanup and recreation
//             }
//         },
        
//         onNotify: (notification) => {
//             console.log('📬 SIP Notification received');
//             notification.accept();
//         },
        
//         onBye: (bye) => {
//             console.log("BYE received from remote party");
//         },
        
//         onCancel: (message) => {
//             console.log("🔔 CANCEL received from caller");
//         },
        
//         onRefer: (referral) => {
//             console.log("REFER received");
//         },
        
//         onMessage: (message) => {
//             console.log("MESSAGE received:", message);
//             message.accept();
//         },
        
//         // These handlers ensure the SDP for audio is correctly configured
//         onConnect: (connection) => {
//             console.log("WebSocket connection established");
//         },
        
//         onTransportError: (error) => {
//             console.error("Transport error:", error);
//         }
//     };
// };

export const createAudioContext = function () {
    const AudioContext = window.AudioContext // Default
      || window.webkitAudioContext // old versions of Chrome or Safari
      || false
  
    if (AudioContext) {
      return new AudioContext
    }
  
    throw new Error("Web Audio API is not supported by your browser")
  }


// Utilities to manage full-duplex hold using SIP re-INVITE and local media toggles
const replaceSdpDirection = (sdp, newDirection) => {
    if (!sdp) return sdp;
    const lines = sdp.split(/\r?\n/);
    const output = [];
    let inAudio = false;
    let insertedForThisMedia = false;

    const pushDirectionIfNeeded = () => {
        if (inAudio && !insertedForThisMedia) {
            output.push(`a=${newDirection}`);
            insertedForThisMedia = true;
        }
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line.startsWith('m=')) {
            // Before switching sections, ensure we have direction for the previous audio m-section
            pushDirectionIfNeeded();

            // Start of a new media section
            inAudio = line.startsWith('m=audio');
            insertedForThisMedia = false;
            output.push(line);
            continue;
        }

        if (inAudio && /^a=(sendrecv|sendonly|recvonly|inactive)$/.test(line)) {
            // Replace existing direction line with our new one (only once)
            if (!insertedForThisMedia) {
                output.push(`a=${newDirection}`);
                insertedForThisMedia = true;
            }
            // Skip original direction line(s)
            continue;
        }

        output.push(line);
    }

    // After processing all lines, ensure last audio section has direction
    pushDirectionIfNeeded();

    return output.join('\r\n');
};

const makeHoldModifier = (direction) => (description) => {
    if (description && typeof description.sdp === 'string') {
        description.sdp = replaceSdpDirection(description.sdp, direction);
    }
    return Promise.resolve(description);
};

const setLocalMicEnabled = (session, enabled) => {
    const sdh = session?.sessionDescriptionHandler;
    const pc = sdh?.peerConnection;
    if (!pc) return;
    pc.getSenders().forEach((sender) => {
        const track = sender.track;
        if (track && track.kind === 'audio') {
            track.enabled = enabled;
        }
    });
};

const setRemotePlaybackEnabled = (session, enabled) => {
    const sdh = session?.sessionDescriptionHandler;
    const pc = sdh?.peerConnection;
    if (!pc) return;
    pc.getReceivers().forEach((receiver) => {
        const track = receiver.track;
        if (track && track.kind === 'audio') {
            track.enabled = enabled;
        }
    });
};

// --- Music On Hold helpers ---
const DEFAULT_MOH_URL = '/assets/audio/hold.mp3';
const getAudioSender = (session) => {
    const sdh = session?.sessionDescriptionHandler;
    const pc = sdh?.peerConnection;
    if (!pc) return null;
    const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'audio');
    return sender || null;
};

const startHoldMusic = async (session, options = {}) => {
    try {
        const sender = getAudioSender(session);
        if (!sender) return false;

        const audioCtx = createAudioContext();
        try { await audioCtx.resume(); } catch (_) {}
        const destination = audioCtx.createMediaStreamDestination();

        let sourceNode = null;
        let mohTrack = null;

        if (options.url) {
            // Prefer decoded buffer source for reliability
            let usedBufferSource = false;
            try {
                const resp = await fetch(options.url, { cache: 'force-cache' });
                const buf = await resp.arrayBuffer();
                const audioBuffer = await audioCtx.decodeAudioData(buf);
                const bufferSource = audioCtx.createBufferSource();
                bufferSource.buffer = audioBuffer;
                bufferSource.loop = true;
                bufferSource.connect(destination);
                const zeroGain = audioCtx.createGain();
                zeroGain.gain.value = 0;
                bufferSource.connect(zeroGain);
                zeroGain.connect(audioCtx.destination);
                bufferSource.start(0);
                sourceNode = bufferSource;
                session._hold = { audioCtx, destination, sourceNode, originalTrack: sender.track };
                usedBufferSource = true;
            } catch (_) {}
            if (!usedBufferSource) {
                // Fallback to media element source
                const el = new Audio(options.url);
                el.preload = 'auto';
                el.loop = true;
                el.muted = true; // prevent local playback
                try { el.crossOrigin = 'anonymous'; } catch (_) {}
                const mediaElementSource = audioCtx.createMediaElementSource(el);
                mediaElementSource.connect(destination);
                const zeroGain = audioCtx.createGain();
                zeroGain.gain.value = 0;
                mediaElementSource.connect(zeroGain);
                zeroGain.connect(audioCtx.destination);
                sourceNode = mediaElementSource;
                await el.play().catch(() => {});
                session._hold = { audioCtx, destination, sourceNode, mediaElement: el, originalTrack: sender.track };
            }
        } else {
            // Generate a simple tone as fallback MOH
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.value = 440; // A4
            gain.gain.value = 0.05; // low volume
            osc.connect(gain);
            gain.connect(destination);
            // also keep graph alive silently
            const zeroGain = audioCtx.createGain();
            zeroGain.gain.value = 0;
            gain.connect(zeroGain);
            zeroGain.connect(audioCtx.destination);
            osc.start();
            sourceNode = osc;
            session._hold = { audioCtx, destination, sourceNode, originalTrack: sender.track };
        }

        mohTrack = destination.stream.getAudioTracks()[0];
        if (mohTrack) {
            try { mohTrack.enabled = true; } catch (_) {}
            await sender.replaceTrack(mohTrack);
            session._hold.mohTrack = mohTrack;
            return true;
        }
        return false;
    } catch (_) {
        return false;
    }
};

const stopHoldMusic = async (session) => {
    const hold = session?._hold;
    const sender = getAudioSender(session);
    if (!hold || !sender) return;
    try {
        if (hold.originalTrack) {
            await sender.replaceTrack(hold.originalTrack);
        }
    } catch (_) {}
    try {
        if (hold.mediaElement) {
            try { hold.mediaElement.pause(); } catch (_) {}
            try { hold.mediaElement.srcObject = null; } catch (_) {}
        }
        if (hold.sourceNode && typeof hold.sourceNode.stop === 'function') {
            try { hold.sourceNode.stop(); } catch (_) {}
        }
        if (hold.audioCtx && typeof hold.audioCtx.close === 'function') {
            try { await hold.audioCtx.close(); } catch (_) {}
        }
    } finally {
        delete session._hold;
    }
};

export const holdCall = async (session) => {
    if (!session) throw new Error('holdCall: session is required');
    if (session.isOnHold) return; // already on hold

    try {
        // Immediately mute both directions locally
        setLocalMicEnabled(session, false);
        setRemotePlaybackEnabled(session, false);

        // Attempt network hold via re-INVITE first
        const modifiersSendonly = [makeHoldModifier('sendonly')];
        const modifiersInactive = [makeHoldModifier('inactive')];

        const tryInviteWith = async (modifiers, holdBool) => {
            // Prefer session.invite if available, else fall back to SDH.sendReinvite
            if (typeof session.invite === 'function') {
                await session.invite(undefined, { sessionDescriptionHandlerModifiers: modifiers });
                return true;
            }
            const sdh = session.sessionDescriptionHandler;
            if (sdh && typeof sdh.sendReinvite === 'function') {
                await sdh.sendReinvite({
                    sessionDescriptionHandlerOptions: { hold: holdBool === true },
                    sessionDescriptionHandlerModifiers: modifiers
                });
                return true;
            }
            return false;
        };

        let negotiated = false;
        try { negotiated = await tryInviteWith(modifiersSendonly, true); } catch (_) { negotiated = false; }
        if (!negotiated) {
            await tryInviteWith(modifiersInactive, true); // fallback: remote PBX will pause media path
        }

        // After negotiation, only send MOH if we're actually allowed to send (sendonly)
        try {
            const sdh = session?.sessionDescriptionHandler;
            const pc = sdh?.peerConnection;
            const tx = pc?.getTransceivers?.().find(t => t?.sender?.track && t.sender.track.kind === 'audio');
            const dir = (tx && (tx.currentDirection || tx.direction)) || '';
            if (/sendonly|sendrecv/.test(dir)) {
                if (!session._mohUrl) session._mohUrl = DEFAULT_MOH_URL;
                await startHoldMusic(session, { url: session._mohUrl });
            }
        } catch (_) {}
        session.isOnHold = true;
        if (session.data) {
            session.data.status = 'Hold';
        }
    } catch (e) {
        // If renegotiation fails, try to at least restore local media
        try { await stopHoldMusic(session); } catch (_) {}
        setLocalMicEnabled(session, true);
        setRemotePlaybackEnabled(session, true);
        throw e;
    }
};

export const resumeCall = async (session) => {
    if (!session) throw new Error('resumeCall: session is required');
    if (!session.isOnHold) return; // already active

    try {
        // Negotiate back to a=sendrecv
        const modifiers = [makeHoldModifier('sendrecv')];
        if (typeof session.invite === 'function') {
            await session.invite(undefined, { sessionDescriptionHandlerModifiers: modifiers });
        } else if (session.sessionDescriptionHandler && typeof session.sessionDescriptionHandler.sendReinvite === 'function') {
            await session.sessionDescriptionHandler.sendReinvite({
                sessionDescriptionHandlerOptions: { hold: false },
                sessionDescriptionHandlerModifiers: modifiers
            });
        }

        // Stop MOH and restore original mic track
        await stopHoldMusic(session);

        // Re-enable both directions locally
        setLocalMicEnabled(session, true);
        setRemotePlaybackEnabled(session, true);

        session.isOnHold = false;
        if (session.data) {
            session.data.status = 'Answered';
        }
    } catch (e) {
        throw e;
    }
};

export const toggleHold = async (session, shouldHold) => {
    return shouldHold ? holdCall(session) : resumeCall(session);
};
