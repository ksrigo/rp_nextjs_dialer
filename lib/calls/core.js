// Core call handling functions
import { SessionState, Inviter } from "sip.js";
import { cleanPhoneNumber, createTargetUri, validateUserAgent, debugAudioSetup, validateAudioSetup } from "./utils";
import { initSession, createAudioContext } from "@/hooks/useSip";
import { handleHoldCall } from "@/lib/calls/advanced";


export const sessionEstablishedHandler = async function (session, speakerDeviceId, isMuted) {
    console.log("🔊 Session Established Handler - Starting audio setup for session:", session?.id || session?.ctxid);
    
    // Validate session
    if (!session || !session.sessionDescriptionHandler) {
        console.error('❌ Invalid session or missing sessionDescriptionHandler');
        return;
    }

    const remoteAudioElement = new Audio()
    const remoteStream = session.sessionDescriptionHandler.remoteMediaStream;
    
    console.log('🔊 Remote stream available:', !!remoteStream);
    if (remoteStream) {
        console.log('🔊 Remote stream tracks:', remoteStream.getTracks().map(t => `${t.kind} (${t.enabled ? 'enabled' : 'disabled'})`));
    }
  
    try {
      await remoteAudioElement.setSinkId?.(speakerDeviceId);
    } catch (e) {
      console.error(e)
    }
  
    remoteAudioElement.srcObject = remoteStream;
    remoteAudioElement.autoplay = true;
    remoteAudioElement.play().catch((error) => {
      console.error(`Failed to play remote media`);
      console.error(error.message);
    })
  
    const sessionDescriptionHandler = session.sessionDescriptionHandler;
    if (!sessionDescriptionHandler || typeof sessionDescriptionHandler.getDescription !== 'function') {
      throw new Error(
        "Session's session description handler is not properly initialized."
      );
    }
    const peerConnection = sessionDescriptionHandler.peerConnection;
    if (!peerConnection) {
      throw new Error("Peer connection closed.");
    }
  
    // add gainNode to sender track to be able to mute sender track without using track.enabled
    const audioContext = createAudioContext()
    
    // Ensure audio context is running (browsers often start it suspended)
    if (audioContext.state === 'suspended') {
        console.log('🔊 Resuming suspended audio context...');
        try {
            await audioContext.resume();
            console.log('✅ Audio context resumed successfully');
        } catch (error) {
            console.error('❌ Failed to resume audio context:', error);
        }
    }
    
    const senders = peerConnection.getSenders()
    const audioSender = senders.find(sender => sender.track && sender.track.kind === 'audio')
    
    if (audioSender && audioSender.track) {
        console.log('🔊 Setting up audio processing for sender track:', audioSender.track.id);
        console.log('🔊 Sender track enabled:', audioSender.track.enabled);
        console.log('🔊 Sender track readyState:', audioSender.track.readyState);
        
        // Ensure the track is enabled and live
        if (!audioSender.track.enabled) {
            console.log('🔊 Enabling disabled audio track');
            audioSender.track.enabled = true;
        }
        
        if (audioSender.track.readyState !== 'live') {
            console.warn('⚠️ Audio track is not live, state:', audioSender.track.readyState);
        }
        
        const gainNode = audioContext.createGain()
        const stream = new MediaStream([audioSender.track])
        const audioSource = audioContext.createMediaStreamSource(stream)
        const audioDestination = audioContext.createMediaStreamDestination()
        audioSource.connect(gainNode)
        gainNode.connect(audioDestination)
        gainNode.gain.value = isMuted ? 0 : 1
        
        // Replace the track with the processed one
        await audioSender.replaceTrack(audioDestination.stream.getTracks()[0])
        
        // Store audio context info in session for later use
        session._audioContext = {
            gainNode,
            audioSource,
            audioDestination,
            audioContext
        };
        
        console.log('✅ Audio processing chain established successfully');
    } else {
        console.warn('❌ No audio sender track found in peer connection');
        console.log('Available senders:', senders.map(s => ({
            track: s.track ? `${s.track.kind} (${s.track.id})` : 'no track',
            enabled: s.track ? s.track.enabled : 'N/A',
            readyState: s.track ? s.track.readyState : 'N/A'
        })));
        
        // Try to add microphone stream if we have one but no sender
        if (session._localStream) {
            console.log('🔊 Attempting to add local stream to peer connection');
            try {
                const audioTrack = session._localStream.getAudioTracks()[0];
                if (audioTrack) {
                    peerConnection.addTrack(audioTrack, session._localStream);
                    console.log('✅ Added local audio track to peer connection');
                }
            } catch (error) {
                console.error('❌ Error adding local stream:', error);
            }
        }
    }

    // Debug audio setup
    debugAudioSetup(session);
    
    // Final audio validation
    await validateAudioSetup(session);
  
    // setSessionsAudioCtx(prev => ({
    //     ...prev,
    //     [session.ctxid]: {
    //         remote_audio: remoteAudioElement,
    //         gain_node: gainNode,
    //         audio_source: audioSource,
    //         init_sender_track: audioDestination.stream.getTracks()[0],
    //         audio_ctx: audioContext
    //     }
    // }));
    // setCallStateStatus('Call Established')
}

export const handleIncomingCall = async (invitation, callbacks = {}) => {
    const CALL_STATUS_INCOMING = 'incoming';
    try {
        console.log('🔊 Handling incoming call with invitation:', invitation);

        if (!invitation || typeof invitation.accept !== 'function') {
            throw new Error('Invalid invitation object received');
        }

        // Get microphone stream immediately for incoming calls
        let localStream;
        try {
            console.log('🔊 Getting microphone stream for incoming call...');
            localStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                },
                video: false
            });
            console.log('✅ Microphone stream obtained for incoming call');
        } catch (mediaError) {
            console.error('❌ Error accessing microphone for incoming call:', mediaError);
            throw new Error('Microphone access denied or not available for incoming call');
        }

        // Store the stream in the invitation for later use
        invitation._localStream = localStream;

        // Initialize session with proper callbacks
        const session = initSession(invitation, CALL_STATUS_INCOMING, false, {
            onSessionStateChange: (state) => {
                console.log('Session state changed:', state);
                if (callbacks.onSessionStateChange) {
                    callbacks.onSessionStateChange(state);
                }
            },
            onSessionTerminated: (session) => {
                console.log('Session terminated:', session);
                if (callbacks.onSessionTerminated) {
                    callbacks.onSessionTerminated(session);
                }
            },
            onSessionData: (data) => {
                console.log('Session data:', data);
                if (callbacks.onSessionData) {
                    callbacks.onSessionData(data);
                }
            },
            onAnsweredCall: async () => {
                if (callbacks.onAnsweredCall) {
                    await callbacks.onAnsweredCall();
                }
            }
        });

        // Ensure the local stream is available in the session
        session._localStream = localStream;

        console.log('✅ Session initialized with microphone stream:', session);
        return session;
    } catch (error) {
        console.error('❌ Error handling incoming call:', error);
        throw error;
    }
}

export const handleOutgoingCall = async (userAgent, phoneNumber, extensionData, isSecondCall = false, ) => {
    try {
        console.log('Making outgoing call to:', phoneNumber, isSecondCall ? '(second call)' : '');
        const config = {
            USER: extensionData?.[0]?.extension,
            DOMAIN: extensionData?.[0]?.domain,
            PASSWORD: extensionData?.[0]?.password,
            NAME: extensionData?.[0]?.name,
            PROXY: extensionData?.[0]?.proxy
        };

        
        validateUserAgent(userAgent);
        const cleanNumber = cleanPhoneNumber(phoneNumber);
        const targetUri = createTargetUri(cleanNumber, config.DOMAIN);

        // Get user's audio stream first for outgoing calls
        let stream;
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                },
                video: false
            });
        } catch (mediaError) {
            console.error('Error accessing microphone for outgoing call:', mediaError);
            throw new Error('Microphone access denied or not available');
        }

        const inviter = new Inviter(userAgent, targetUri, {
            sessionDescriptionHandlerOptions: {
                constraints: {
                    audio: true,
                    video: false
                },
                stream: stream,
                peerConnectionOptions: {
                    rtcConfiguration: {
                        iceServers: [
                            { urls: ["stun:stun.l.google.com:19302"] },
                            { urls: ["stun:stun1.l.google.com:19302"] }
                        ],
                        iceTransportPolicy: 'all'
                    }
                }
            },
            sessionDescriptionHandlerModifiers: [
                (description) => {
                    // Ensure the SDP has sendrecv for audio
                    let sdp = description.sdp;
                    
                    // Log the original SDP for debugging
                    console.log('Original Outgoing SDP:', sdp);
                    
                    // Replace sendonly or inactive with sendrecv for audio
                    sdp = sdp.replace(/a=sendonly\r\n/g, 'a=sendrecv\r\n');
                    sdp = sdp.replace(/a=inactive\r\n/g, 'a=sendrecv\r\n');
                    sdp = sdp.replace(/a=recvonly\r\n/g, 'a=sendrecv\r\n');
                    
                    // Log the modified SDP
                    console.log('Modified Outgoing SDP:', sdp);
                    
                    description.sdp = sdp;
                    return Promise.resolve(description);
                }
            ]
        });

        // Add state change listener
        inviter.stateChange.addListener((state) => {
            console.log(`${isSecondCall ? 'Second call' : 'Call'} state changed to:`, state);
        });

        // Initialize session data
        const sessionData = {
            id: Math.random().toString(36).substr(2, 9),
            phoneNumber: cleanNumber,
            calledNumber: cleanNumber,
            displayName: cleanNumber,
            status: 'outgoing',
            isSecondCall: isSecondCall
        };

        inviter.data = sessionData;
        inviter._localStream = stream; // Store the stream for later use

        // Send the INVITE
        await inviter.invite({
            requestDelegate: {
                onProgress: (response) => {
                    console.log('Call progress:', response.message.statusCode);
                },
                onAccept: (response) => {
                    console.log('Call accepted:', response.message.statusCode);
                    sessionData.status = 'established';
                },
                onReject: (response) => {
                    console.error('Call rejected:', response.message.reasonPhrase);
                    sessionData.status = 'rejected';
                }
            }
        });

        return inviter;

    } catch (error) {
        console.error('Error in handleOutgoingCall:', error);
        throw error;
    }
}

export const handleAddCall = async (session, secondCallNumber, extensionData) => {
    try {
        console.log('Starting add call process...', {
            currentSessionState: session?.state,
            secondCallNumber,
            hasUserAgent: !!session?._userAgent
        });

        if (!session || !session._userAgent) {
            throw new Error('Invalid session or no user agent available');
        }

        // Put current call on hold first
        const holdSuccess = await handleHoldCall(session, true);
        if (!holdSuccess) {
            throw new Error('Failed to hold current call');
        }

        // Create target URI for the second call
        const cleanNumber = cleanPhoneNumber(secondCallNumber);
        const targetUri = createTargetUri(cleanNumber, extensionData?.[0]?.domain);

        // Get user's audio stream for the second call
        let stream;
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                },
                video: false
            });
        } catch (mediaError) {
            console.error('Error accessing microphone for second call:', mediaError);
            throw new Error('Microphone access denied or not available for second call');
        }

        // Create new invitation with optimized SDP options
        const inviter = new Inviter(session._userAgent, targetUri, {
            sessionDescriptionHandlerOptions: {
                constraints: {
                    audio: true,
                    video: false
                },
                stream: stream,
                iceCheckingTimeout: 500,
                offerOptions: {
                    offerToReceiveAudio: true,
                    offerToReceiveVideo: false,
                    voiceActivityDetection: true
                },
                peerConnectionOptions: {
                    rtcConfiguration: {
                        iceServers: [
                            { urls: ["stun:stun.l.google.com:19302"] },
                            { urls: ["stun:stun1.l.google.com:19302"] }
                        ],
                        iceTransportPolicy: 'all'
                    }
                }
            },
            sessionDescriptionHandlerModifiers: [
                (description) => {
                    // Ensure the SDP has sendrecv for audio
                    let sdp = description.sdp;
                    
                    console.log('Original Second Call SDP:', sdp);
                    
                    // Replace sendonly or inactive with sendrecv for audio
                    sdp = sdp.replace(/a=sendonly\r\n/g, 'a=sendrecv\r\n');
                    sdp = sdp.replace(/a=inactive\r\n/g, 'a=sendrecv\r\n');
                    sdp = sdp.replace(/a=recvonly\r\n/g, 'a=sendrecv\r\n');
                    
                    console.log('Modified Second Call SDP:', sdp);
                    
                    description.sdp = sdp;
                    return Promise.resolve(description);
                }
            ],
            extraHeaders: [
                'Allow: ACK,CANCEL,INVITE,BYE,OPTIONS,INFO,NOTIFY,REFER'
            ]
        });

        // Add state change listener
        inviter.stateChange.addListener((state) => {
            console.log('Second call state changed to:', state);
        });

        // Initialize session data for the second call
        const sessionData = {
            id: Math.random().toString(36).substr(2, 9),
            phoneNumber: cleanNumber,
            calledNumber: cleanNumber,
            displayName: cleanNumber,
            status: 'outgoing',
            isSecondCall: true
        };

        inviter.data = sessionData;
        inviter._localStream = stream; // Store the stream for later use

        // Send the INVITE with detailed options
        await inviter.invite({
            requestDelegate: {
                onProgress: (response) => {
                    console.log('Second call progress:', response.message.statusCode);
                },
                onAccept: (response) => {
                    console.log('Second call accepted:', response.message);
                    sessionData.status = 'established';
                },
                onReject: async (response) => {
                    console.error('Second call rejected:', response.message.reasonPhrase);
                    // Automatically unhold first call if second call is rejected
                    try {
                        if (session && session.state === SessionState.Established) {
                            await handleHoldCall(session, false);
                        }
                    } catch (unholdError) {
                        console.error('Error unholding first call:', unholdError);
                    }
                }
            }
        });

        return inviter;

    } catch (error) {
        console.error('Error in handleAddCall:', error);
        // Attempt to unhold the first call
        try {
            if (session && session.state === SessionState.Established) {
                await handleHoldCall(session, false);
            }
        } catch (unholdError) {
            console.error('Error unholding first call:', unholdError);
        }
        throw error;
    }
};

export const handleMakeCall = async (userAgent, number, extensionData, { setSession, setCallerInfo, setPhoneNumber, setActiveTap }) => {
    try {
        validateUserAgent(userAgent);

        // Reset states before making new call
        setSession({});
        setCallerInfo(null);
        
        // Immediately show outgoing call view
        setActiveTap(5);

        const session = await handleOutgoingCall(userAgent, number, extensionData);
        
        // Set up session state listeners
        session.stateChange.addListener((state) => {
            console.log('Call state changed:', state);
            switch (state) {
                case SessionState.Established:
                    setSession(prev => ({
                        ...prev,
                        ...session, // Preserve the entire session object
                        startTime: Date.now(),
                        state: SessionState.Established,
                        status: 'Established', // Add explicit status for better tracking
                        sessionDescriptionHandler: session.sessionDescriptionHandler
                    }));
                    setActiveTap(3);
                    break;
                case SessionState.Terminated:
                    console.log('Call terminated, cleaning up...');
                    setSession(prev => ({ ...prev, status: 'Terminated', state: SessionState.Terminated })); // Update with status before clearing
                    setTimeout(() => {
                        setSession({});
                        setCallerInfo(null);
                        setPhoneNumber('');
                        setActiveTap(1);
                    }, 100); // Small delay to ensure state update is processed
                    break;
                case SessionState.Hold:
                    console.log('Call held');
                    setSession(prev => ({ ...prev, isHolding: true, status: 'Held' }));
                    break;
                case SessionState.Unhold:
                    console.log('Call unheld');
                    setSession(prev => ({ ...prev, isHolding: false, status: 'Active' }));
                    break;
                case SessionState.Reinvite:
                    console.log('Call reinvite');
                    break;
                default:
                    console.log('Other state:', state);
                    setSession(prev => ({ ...prev, state, status: state })); // Update session with any state change
            }
        });

        // Update local state with the complete session object
        setSession({
            ...session,
            sessionDescriptionHandler: session.sessionDescriptionHandler,
            status: 'Outgoing' // Set initial status
        });
        setCallerInfo(session.data);

        return session;
    } catch (error) {
        console.error('Error making call:', error);
        // Reset states on error
        setSession({});
        setCallerInfo(null);
        setPhoneNumber('');
        setActiveTap(1);
        throw error;
    }
};


