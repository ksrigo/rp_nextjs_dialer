// Utility functions
import { UserAgent } from "sip.js";

export const cleanPhoneNumber = (phoneNumber) => {
    if (!phoneNumber || typeof phoneNumber !== 'string') {
        throw new Error('Invalid phone number');
    }
    const cleaned = phoneNumber.replace(/[^\d]/g, '');
    if (!cleaned) throw new Error('Invalid phone number format');
    return cleaned;
};

export const createTargetUri = (number, domain) => {
    const uri = UserAgent.makeURI(`sip:${number}@${domain}`);
    if (!uri) throw new Error(`Failed to create target URI for ${number}`);
    return uri;
};

export const validateUserAgent = (userAgent) => {
    if (!userAgent) throw new Error('UserAgent is invalid or not initialized');
    if (!userAgent.isConnected()) throw new Error('UserAgent is not connected');
    return true;
};

export const validateSession = (session) => {
    if (!session) throw new Error('Session is null or undefined');
    if (!session._userAgent) throw new Error('Session has no associated UserAgent');
    if (!session.sessionDescriptionHandler) throw new Error('Session has no description handler');
    return true;
};

export const validateSessionHandler = (session) => {
    const handler = session?.sessionDescriptionHandler;
    if (!handler) throw new Error('No session description handler found');
    
    const peerConnection = handler.peerConnection;
    if (!peerConnection) throw new Error('No peer connection found');
    
    if (peerConnection.connectionState === 'failed' || 
        peerConnection.connectionState === 'closed') {
        throw new Error(`Invalid peer connection state: ${peerConnection.connectionState}`);
    }
    
    return peerConnection;
};

export const cleanupMediaTracks = (session) => {
    if (!session?.sessionDescriptionHandler?.peerConnection) return;
    
    const pc = session.sessionDescriptionHandler.peerConnection;
    try {
        // Stop and cleanup senders
        pc.getSenders().forEach(sender => {
            if (sender.track) {
                sender.track.stop();
                sender.replaceTrack(null);
            }
        });

        // Stop and cleanup receivers
        pc.getReceivers().forEach(receiver => {
            if (receiver.track) {
                receiver.track.stop();
            }
        });

        // Close the connection and remove all event listeners
        pc.close();
        pc.removeAllListeners?.();
    } catch (error) {
        console.warn('Error during media cleanup:', error);
    }
};

export const recycleUserAgent = async (sipUserAgent, timeout = 5000) => {
    if (!sipUserAgent) return;
    
    try {
        const recyclePromise = (async () => {
            await sipUserAgent.stop();
            await sipUserAgent.start();
        })();

        // Add timeout protection
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('UserAgent recycling timed out')), timeout);
        });

        await Promise.race([recyclePromise, timeoutPromise]);
    } catch (error) {
        console.warn('Error recycling user agent:', error);
        throw error; // Re-throw to allow caller to handle the error
    }
};

export const getConnectionState = (session) => {
    try {
        const pc = validateSessionHandler(session);
        return {
            connectionState: pc.connectionState,
            iceConnectionState: pc.iceConnectionState,
            signalingState: pc.signalingState
        };
    } catch (error) {
        console.warn('Error getting connection state:', error);
        return null;
    }
};

export const checkMediaPermissions = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        return true;
    } catch (error) {
        console.warn('Media permissions check failed:', error);
        return false;
    }
};

export const debugAudioSetup = (session) => {
    console.group('🔊 Audio Debug Information');
    
    try {
        // Check session structure
        console.log('Session object:', {
            hasSession: !!session,
            sessionState: session?.state,
            hasSessionDescriptionHandler: !!session?.sessionDescriptionHandler,
            hasLocalStream: !!session?._localStream,
            hasAudioContext: !!session?._audioContext
        });

        // Check session description handler
        const handler = session?.sessionDescriptionHandler;
        if (handler) {
            console.log('Session Description Handler:', {
                hasPeerConnection: !!handler.peerConnection,
                hasRemoteStream: !!handler.remoteMediaStream,
                hasLocalStream: !!handler.localMediaStream
            });

            // Check peer connection
            const pc = handler.peerConnection;
            if (pc) {
                console.log('Peer Connection State:', {
                    connectionState: pc.connectionState,
                    iceConnectionState: pc.iceConnectionState,
                    signalingState: pc.signalingState
                });

                // Check senders (outgoing audio)
                const senders = pc.getSenders();
                console.log('Audio Senders:', senders.map(sender => ({
                    hasTrack: !!sender.track,
                    trackKind: sender.track?.kind,
                    trackEnabled: sender.track?.enabled,
                    trackId: sender.track?.id,
                    trackReadyState: sender.track?.readyState
                })));

                // Check receivers (incoming audio)
                const receivers = pc.getReceivers();
                console.log('Audio Receivers:', receivers.map(receiver => ({
                    hasTrack: !!receiver.track,
                    trackKind: receiver.track?.kind,
                    trackEnabled: receiver.track?.enabled,
                    trackId: receiver.track?.id,
                    trackReadyState: receiver.track?.readyState
                })));

                // Check remote stream
                if (handler.remoteMediaStream) {
                    const remoteTracks = handler.remoteMediaStream.getTracks();
                    console.log('Remote Stream Tracks:', remoteTracks.map(track => ({
                        kind: track.kind,
                        enabled: track.enabled,
                        readyState: track.readyState,
                        id: track.id
                    })));
                }
            }
        }

        // Check audio context setup
        if (session?._audioContext) {
            console.log('Audio Context Setup:', {
                hasGainNode: !!session._audioContext.gainNode,
                gainValue: session._audioContext.gainNode?.gain?.value,
                hasAudioSource: !!session._audioContext.audioSource,
                hasAudioDestination: !!session._audioContext.audioDestination,
                audioContextState: session._audioContext.audioContext?.state
            });
        }

        // Check local stream
        if (session?._localStream) {
            const localTracks = session._localStream.getTracks();
            console.log('Local Stream Tracks:', localTracks.map(track => ({
                kind: track.kind,
                enabled: track.enabled,
                readyState: track.readyState,
                id: track.id
            })));
        }

    } catch (error) {
        console.error('Error during audio debug:', error);
    }
    
    console.groupEnd();
};

export const validateAudioSetup = async (session) => {
    console.group('🔍 Audio Setup Validation');
    
    let issues = [];
    let recommendations = [];
    
    try {
        // Check if session has required components
        if (!session) {
            issues.push('❌ Session is null or undefined');
            return;
        }
        
        if (!session.sessionDescriptionHandler) {
            issues.push('❌ No sessionDescriptionHandler found');
            return;
        }
        
        const handler = session.sessionDescriptionHandler;
        const pc = handler.peerConnection;
        
        if (!pc) {
            issues.push('❌ No peer connection found');
            return;
        }
        
        // Check connection states
        if (pc.connectionState !== 'connected') {
            issues.push(`⚠️ Peer connection state: ${pc.connectionState} (should be 'connected')`);
        }
        
        if (pc.iceConnectionState !== 'connected' && pc.iceConnectionState !== 'completed') {
            issues.push(`⚠️ ICE connection state: ${pc.iceConnectionState} (should be 'connected' or 'completed')`);
        }
        
        // Check senders (outgoing audio)
        const senders = pc.getSenders();
        const audioSenders = senders.filter(s => s.track && s.track.kind === 'audio');
        
        if (audioSenders.length === 0) {
            issues.push('❌ No audio senders found - your voice won\'t be transmitted');
            recommendations.push('💡 Check microphone permissions and getUserMedia call');
        } else {
            console.log('✅ Audio senders found:', audioSenders.length);
            audioSenders.forEach((sender, index) => {
                if (!sender.track.enabled) {
                    issues.push(`⚠️ Audio sender ${index} track is disabled`);
                }
                if (sender.track.readyState !== 'live') {
                    issues.push(`⚠️ Audio sender ${index} track state: ${sender.track.readyState} (should be 'live')`);
                }
            });
        }
        
        // Check receivers (incoming audio)
        const receivers = pc.getReceivers();
        const audioReceivers = receivers.filter(r => r.track && r.track.kind === 'audio');
        
        if (audioReceivers.length === 0) {
            issues.push('❌ No audio receivers found - you won\'t hear the other party');
            recommendations.push('💡 Check SDP negotiation and remote stream setup');
        } else {
            console.log('✅ Audio receivers found:', audioReceivers.length);
            audioReceivers.forEach((receiver, index) => {
                if (!receiver.track.enabled) {
                    issues.push(`⚠️ Audio receiver ${index} track is disabled`);
                }
                if (receiver.track.readyState !== 'live') {
                    issues.push(`⚠️ Audio receiver ${index} track state: ${receiver.track.readyState} (should be 'live')`);
                }
            });
        }
        
        // Check remote stream
        if (handler.remoteMediaStream) {
            const remoteTracks = handler.remoteMediaStream.getTracks();
            const remoteAudioTracks = remoteTracks.filter(t => t.kind === 'audio');
            
            if (remoteAudioTracks.length === 0) {
                issues.push('❌ No audio tracks in remote stream');
            } else {
                console.log('✅ Remote audio tracks found:', remoteAudioTracks.length);
            }
        } else {
            issues.push('❌ No remote media stream found');
        }
        
        // Check local stream
        if (session._localStream) {
            const localTracks = session._localStream.getTracks();
            const localAudioTracks = localTracks.filter(t => t.kind === 'audio');
            
            if (localAudioTracks.length === 0) {
                issues.push('❌ No audio tracks in local stream');
            } else {
                console.log('✅ Local audio tracks found:', localAudioTracks.length);
            }
        } else {
            issues.push('⚠️ No local stream stored in session');
            recommendations.push('💡 Ensure getUserMedia is called and stream is stored');
        }
        
        // Check audio context setup
        if (session._audioContext) {
            const audioCtx = session._audioContext;
            if (audioCtx.audioContext && audioCtx.audioContext.state !== 'running') {
                issues.push(`⚠️ Audio context state: ${audioCtx.audioContext.state} (should be 'running')`);
                recommendations.push('💡 Try calling audioContext.resume()');
            }
            
            if (audioCtx.gainNode && audioCtx.gainNode.gain.value === 0) {
                issues.push('⚠️ Gain node is muted (gain value = 0)');
            }
        }
        
        // Summary
        if (issues.length === 0) {
            console.log('🎉 Audio setup validation passed! No issues found.');
        } else {
            console.warn(`⚠️ Found ${issues.length} audio issues:`);
            issues.forEach(issue => console.warn(issue));
        }
        
        if (recommendations.length > 0) {
            console.log('💡 Recommendations:');
            recommendations.forEach(rec => console.log(rec));
        }
        
    } catch (error) {
        console.error('❌ Error during audio validation:', error);
    }
    
    console.groupEnd();
}; 