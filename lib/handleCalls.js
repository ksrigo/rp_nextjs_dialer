
import { initSession } from "@/hooks/useSip";
import { stopRingingSound } from "@/lib/ringtone";
import { Inviter, UserAgent } from "sip.js";
import { SessionState } from "sip.js";

export const handleIncomingCall = async (invitation, callbacks = {}) => {  
    const CALL_STATUS_INCOMING = 'incoming';
    try {
        console.log('Ringing sound played', invitation);

        // Initialize session with proper callbacks
        const session = initSession(invitation, CALL_STATUS_INCOMING, false, {
            onSessionStateChange: (state) => {
                console.log('Session state changed:', state);
            },
            onSessionTerminated: (session) => {
                console.log('Session terminated:', session);
                if (callbacks.onSessionTerminated) {
                    callbacks.onSessionTerminated(session);
                }
            },
            onSessionData: (data) => {
                console.log('Session data:', data);
            }
        });

        console.log('Session initialized:', session);
        return session;
    } catch (error) {
        console.error('Error handling incoming call:', error);
    }
}

export const handleRejectCall = async (session) => {
    console.log('Rejecting call', session);
    try {
        await stopRingingSound(); // Explicitly stop the ringtone
        await session.reject();
        const CALL_STATUS_REJECTED = 'rejected';
        session.status = CALL_STATUS_REJECTED;
        return session;
    } catch (error) {
        console.error('Error rejecting call:', error);
        throw error;
    }
}

export const handleAnswerCall = async (session) => {
    console.log('Answering call', session);
    try {
        await stopRingingSound();
        
        // Accept the call with specific media constraints
        await session.accept({
            sessionDescriptionHandlerOptions: {
                constraints: {
                    audio: true,
                    video: false
                }
            }
        });
        
        const CALL_STATUS_ANSWERED = 'answered';
        session.status = CALL_STATUS_ANSWERED;
        
        // Wait a moment for the session to be fully established
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // If there's an onAnsweredCall callback in the session delegate, call it
        if (session.delegate?.onAnswered) {
            await session.delegate.onAnswered();
        }
        
        return session;
    } catch (error) {
        console.error('Error answering call:', error);
        throw error;
    }
}

export const handleEndCall = async (session, sipUserAgent) => {
    console.log('Ending call', session);
    try {
        // Force cleanup of the session
        if (session.sessionDescriptionHandler?.close) {
            session.sessionDescriptionHandler.close();
        }

        // Ensure media streams are stopped
        if (session.sessionDescriptionHandler?.peerConnection) {
            const pc = session.sessionDescriptionHandler.peerConnection;
            
            // Stop all tracks
            pc.getSenders().forEach(sender => {
                if (sender.track) {
                    sender.track.stop();
                }
            });
            
            pc.getReceivers().forEach(receiver => {
                if (receiver.track) {
                    receiver.track.stop();
                }
            });
            
            // Close the peer connection
            pc.close();
        }

        // Additional cleanup for SIP user agent
        if (sipUserAgent) {
            try {
                await sipUserAgent.stop();
                await sipUserAgent.start();
            } catch (e) {
                console.warn('Error recycling user agent:', e);
            }
        }

        const CALL_STATUS_ENDED = 'ended';
        session.status = CALL_STATUS_ENDED;
        console.log('Call ended successfully');

        return session;
    } catch (error) {
        console.error('Error ending call:', error);
        // Try alternative method if the first attempt fails
        try {
            if (session.invitation) {
                await session.invitation.bye();
            }
        } catch (secondError) {
            console.error('Second attempt to end call failed:', secondError);
        }
        
        session.status = 'ended';
        return session;
    }
}

export const handleOutgoingCall = async (userAgent, phoneNumber, isSecondCall = false) => {
    try {
        console.log('Making outgoing call to:', phoneNumber, isSecondCall ? '(second call)' : '');
        
        // Validate userAgent
        if (!userAgent) {
            throw new Error('UserAgent is invalid or not initialized');
        }

        // Validate and clean phone number
        if (!phoneNumber || typeof phoneNumber !== 'string') {
            throw new Error('Invalid phone number');
        }
        const cleanNumber = phoneNumber.replace(/[^\d]/g, '');
        if (!cleanNumber) {
            throw new Error('Invalid phone number format');
        }

        // Create the target URI with the domain from environment
        const targetUri = UserAgent.makeURI(`sip:${cleanNumber}@${process.env.DOMAIN}`);
        if (!targetUri) {
            throw new Error(`Failed to create target URI for ${cleanNumber}`);
        }

        // Create inviter with specific options for second call
        const inviter = new Inviter(userAgent, targetUri, {
            sessionDescriptionHandlerOptions: {
                constraints: {
                    audio: true,
                    video: false
                }
            }
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
};

export const handleTransferCall = async (session, transferNumber) => {
    try {
        console.log('Initiating transfer for session:', session.state);
        
        if (!session || !session._userAgent) {
            throw new Error('Invalid session');
        }

        if (session.state === SessionState.Established) {
            if (session._dialog) {
                // Ensure proper formatting of the transfer number
                const cleanNumber = transferNumber.replace(/[^\d]/g, '');
                const targetUri = UserAgent.makeURI(`sip:${cleanNumber}@${process.env.DOMAIN}`);
                
                if (!targetUri) {
                    throw new Error(`Failed to create target URI for ${transferNumber}`);
                }

                // Modify the session description handler to handle re-INVITEs
                const originalSDH = session.sessionDescriptionHandler;
                session.sessionDescriptionHandler = {
                    ...originalSDH,
                    setDescription: async function(description, ...args) {
                        try {
                            // Get current DTLS parameters
                            const pc = originalSDH.peerConnection;
                            const transceivers = pc.getTransceivers();
                            if (transceivers.length > 0) {
                                const dtlsParameters = transceivers[0].sender.transport?.getLocalParameters();
                                if (dtlsParameters?.fingerprints?.[0]) {
                                    const fingerprint = dtlsParameters.fingerprints[0].value;
                                    
                                    // Add DTLS fingerprint if missing
                                    if (!description.sdp.includes('a=fingerprint:')) {
                                        description.sdp = description.sdp.replace(
                                            /(m=audio.*(?:\r\n|\r|\n))/,
                                            `$1a=setup:actpass\r\na=fingerprint:sha-256 ${fingerprint}\r\n`
                                        );
                                    }
                                }
                            }
                            return originalSDH.setDescription.call(this, description, ...args);
                        } catch (error) {
                            console.error('Error in setDescription:', error);
                            throw error;
                        }
                    },
                    getDescription: async function(...args) {
                        const description = await originalSDH.getDescription.call(this, ...args);
                        return description;
                    }
                };

                // Configure transfer options
                const sdpOptions = {
                    sessionDescriptionHandlerOptions: {
                        constraints: {
                            audio: true,
                            video: false
                        }
                    }
                };

                const extraHeaders = [
                    `Refer-To: <sip:${cleanNumber}@${process.env.DOMAIN}>`,
                    `Referred-By: <${session._userAgent.configuration.uri}>`,
                    `Contact: <${session._userAgent.configuration.uri}>`
                ];

                // Send REFER
                await session._dialog.refer(targetUri, {
                    extraHeaders,
                    ...sdpOptions,
                    requestDelegate: {
                        onAccept: () => {
                            console.log('Transfer accepted');
                        },
                        onReject: (response) => {
                            console.error('Transfer rejected:', response.message.reasonPhrase);
                        },
                        onNotify: (notification) => {
                            console.log('Transfer notification:', notification.message);
                            if (notification.message.statusCode === 200) {
                                console.log('Transfer completed successfully');
                                session.bye();
                            }
                        }
                    }
                });
                
                console.log('Transfer initiated successfully');

            } else {
                throw new Error('No dialog available for transfer');
            }
        } else {
            throw new Error(`Cannot transfer call in state: ${session.state}`);
        }

    } catch (error) {
        console.error('Error in transfer:', error);
        console.error('Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        throw error;
    }
}

export const handleHoldCall = async (session, hold) => {
    try {
        if (!session?.sessionDescriptionHandler) {
            console.warn('No session description handler found');
            return false;
        }

        const sessionDescriptionHandler = session.sessionDescriptionHandler;
        const peerConnection = sessionDescriptionHandler.peerConnection;

        if (!peerConnection) {
            console.warn('No peer connection found');
            return false;
        }

        // Get all audio and video tracks
        const senders = peerConnection.getSenders();
        
        if (hold) {
            // To hold: disable all tracks
            senders.forEach(sender => {
                if (sender.track) {
                    sender.track.enabled = false;
                }
            });
        } else {
            // To unhold: enable all tracks
            senders.forEach(sender => {
                if (sender.track) {
                    sender.track.enabled = true;
                }
            });
        }

        // Only try to send SDP if the session is still active
        if (session.state === SessionState.Established) {
            try {
                // Send hold/unhold SDP using reinvite method
                await session.sessionDescriptionHandler.sendReinvite({
                    sessionDescriptionHandlerOptions: {
                        hold: hold
                    }
                });
            } catch (e) {
                console.warn('Error sending hold/unhold SDP:', e);
                // Continue even if SDP negotiation fails
            }
        }

        console.log(`Call ${hold ? 'held' : 'resumed'} successfully`);
        return true;

    } catch (error) {
        console.error('Error in handleHold:', error);
        return false;
    }
};

export const handleAddCall = async (session, secondCallNumber) => {
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
        const cleanNumber = secondCallNumber.replace(/[^\d]/g, '');
        if (!cleanNumber) {
            throw new Error('Invalid phone number');
        }

        const targetUri = UserAgent.makeURI(`sip:${cleanNumber}@${process.env.DOMAIN}`);
        if (!targetUri) {
            throw new Error(`Failed to create target URI for ${cleanNumber}`);
        }

        // Create new invitation with optimized SDP options
        const inviter = new Inviter(session._userAgent, targetUri, {
            sessionDescriptionHandlerOptions: {
                constraints: {
                    audio: true,
                    video: false
                },
                iceCheckingTimeout: 500,
                // Optimize SDP by limiting codecs and removing unnecessary options
                offerOptions: {
                    offerToReceiveAudio: true,
                    offerToReceiveVideo: false,
                    voiceActivityDetection: true
                }
            },
            // Reduce SIP headers to minimize message size
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

export const handleMergeCalls = async (firstSession, secondSession) => {
    try {
        if (!firstSession || !secondSession) {
            throw new Error('Both sessions are required for merging calls');
        }

        // Ensure both calls are established
        if (firstSession.state !== SessionState.Established || 
            secondSession.state !== SessionState.Established) {
            throw new Error('Both calls must be established to merge');
        }

        // Create a conference bridge using REFER method
        const conferenceUri = UserAgent.makeURI(`sip:conference@${process.env.DOMAIN}`);
        
        if (!conferenceUri) {
            throw new Error('Failed to create conference URI');
        }

        // Send REFER to first session
        await firstSession.refer(conferenceUri, {
            extraHeaders: [
                'Referred-By: <sip:conference@${process.env.DOMAIN}>',
                'Require: replaces'
            ]
        });

        // Send REFER to second session
        await secondSession.refer(conferenceUri, {
            extraHeaders: [
                'Referred-By: <sip:conference@${process.env.DOMAIN}>',
                'Require: replaces'
            ]
        });

        // Update session states
        firstSession.data.isInConference = true;
        secondSession.data.isInConference = true;

        return {
            conferenceUri,
            participants: [firstSession, secondSession]
        };

    } catch (error) {
        console.error('Error merging calls:', error);
        throw error;
    }
};

export const handleMute = async (session) => {
    try {
        console.log('Current session:', session);
        
        // Get the session description handler from the active session
        const sessionDescriptionHandler = 
            session.sessionDescriptionHandler || 
            session.invitation?.sessionDescriptionHandler;

        if (!sessionDescriptionHandler) {
            console.warn('No session description handler found');
            return false;
        }

        // Access the peer connection
        const peerConnection = sessionDescriptionHandler.peerConnection;
        if (!peerConnection) {
            console.warn('No peer connection found');
            return false;
        }

        // Find audio tracks
        const audioTracks = peerConnection.getSenders()
            .filter(sender => sender.track?.kind === 'audio')
            .map(sender => sender.track);

        if (audioTracks.length === 0) {
            console.warn('No audio tracks found');
            return false;
        }

        // Get current mute state from first track
        const currentMuteState = !audioTracks[0].enabled;
        
        // Toggle mute state on all audio tracks
        audioTracks.forEach(track => {
            track.enabled = currentMuteState;
        });

        console.log(`Microphone ${!currentMuteState ? 'muted' : 'unmuted'} successfully`);
        return true;

    } catch (error) {
        console.error('Error in handleMute:', error);
        return false;
    }
};

export const handleRecord = async (session, startRecording, { onDataAvailable, onRecordingStop }) => {
    try {
        if (!session?.sessionDescriptionHandler) {
            console.warn('No session description handler found');
            return { success: false };
        }

        const sessionDescriptionHandler = session.sessionDescriptionHandler;
        const peerConnection = sessionDescriptionHandler.peerConnection;

        if (!peerConnection) {
            console.warn('No peer connection found');
            return { success: false };
        }

        if (startRecording) {
            // Create a new MediaStream for recording
            const recordingStream = new MediaStream();

            // Add remote and local audio tracks
            peerConnection.getReceivers()
                .filter(receiver => receiver.track?.kind === 'audio')
                .forEach(receiver => recordingStream.addTrack(receiver.track));

            peerConnection.getSenders()
                .filter(sender => sender.track?.kind === 'audio')
                .forEach(sender => recordingStream.addTrack(sender.track));

            if (recordingStream.getTracks().length === 0) {
                console.error('No tracks available for recording');
                return { success: false };
            }

            // Create MediaRecorder
            const recorder = new MediaRecorder(recordingStream, {
                mimeType: 'audio/webm',
                bitsPerSecond: 128000
            });

            recorder.ondataavailable = (event) => {
                if (event.data?.size > 0 && onDataAvailable) {
                    onDataAvailable(event.data);
                }
            };

            recorder.onstop = () => {
                if (onRecordingStop) {
                    onRecordingStop();
                }
            };

            recorder.start(1000); // Collect data every second
            return { success: true, recorder };

        } else {
            return { success: true, recorder: null };
        }

    } catch (error) {
        console.error('Error in handleRecord:', error);
        return { success: false };
    }
};

export const handleMakeCall = async (userAgent, number, { setSession, setCallerInfo, setPhoneNumber, setActiveTap }) => {
    try {
        if (!userAgent) {
            throw new Error('SIP User Agent not initialized');
        }

        // Reset states before making new call
        setSession({});
        setCallerInfo(null);
        
        // Immediately show outgoing call view
        setActiveTap(5);

        const session = await handleOutgoingCall(userAgent, number);
        
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
                        sessionDescriptionHandler: session.sessionDescriptionHandler
                    }));
                    setActiveTap(3);
                    break;
                case SessionState.Terminated:
                    console.log('Call terminated, cleaning up...');
                    setSession({});
                    setCallerInfo(null);
                    setPhoneNumber('');
                    setActiveTap(1);
                    break;
                case SessionState.Hold:
                    console.log('Call held');
                    break;
                case SessionState.Unhold:
                    console.log('Call unheld');
                    break;
                case SessionState.Reinvite:
                    console.log('Call reinvite');
                    break;
            
                default:
                    console.log('Other state:', state);
            }
        });

        // Update local state with the complete session object
        setSession({
            ...session,
            sessionDescriptionHandler: session.sessionDescriptionHandler
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




