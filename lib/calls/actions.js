// Call control actions (answer, reject, end, etc.)
import { stopRingingSound } from "@/lib/ringtone";

export const handleAnswerCall = async (session) => {
    try {
        await stopRingingSound();
        
        console.log('Answering call with session:', session);
        
        // If session is empty or doesn't have accept or invitation.accept, throw early
        if (!session || (typeof session.accept !== 'function' && !session.invitation)) {
            throw new Error(`Invalid session object: ${JSON.stringify(session)}`);
        }
        
        // Use existing stream if available, otherwise get new one
        let stream = session._localStream;
        
        if (!stream) {
            console.log('🔊 No existing stream found, getting new microphone stream...');
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    },
                    video: false
                });
                console.log('✅ New microphone stream obtained');
            } catch (mediaError) {
                console.error('❌ Error accessing microphone:', mediaError);
                throw new Error('Microphone access denied or not available');
            }
        } else {
            console.log('✅ Using existing microphone stream');
        }
        
        // Store the stream for later use
        session._localStream = stream;
        
        // Don't attach stream before accept - SIP.js will create new peer connection
        console.log('🔊 Stream will be passed to SIP.js during accept process');
        
        console.log('🔊 Preparing accept options with stream:', stream.id);
        console.log('🔊 Stream audio tracks:', stream.getAudioTracks().map(t => `${t.id} (${t.enabled ? 'enabled' : 'disabled'})`));
        
        const acceptOptions = {
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
                        iceTransportPolicy: 'all',
                        iceCandidatePoolSize: 10
                    }
                },
                // Add more aggressive ICE gathering for mobile compatibility
                iceGatheringTimeout: 3000
            },
            // Add extra headers for better mobile compatibility
            extraHeaders: [
                'User-Agent: SIP.js/0.21.1 WebRTC-Mobile-Compatible',
                'Supported: replaces, timer, path',
                'Allow: INVITE, ACK, CANCEL, BYE, REFER, OPTIONS, NOTIFY'
            ],
            sessionDescriptionHandlerModifiers: [
                (description) => {
                    // Ensure the SDP has sendrecv for audio and is compatible
                    let sdp = description.sdp;
                    
                    // Log the original SDP for debugging
                    console.log('🔊 Original Answer SDP:', sdp);
                    
                    // Replace sendonly or inactive with sendrecv for audio
                    sdp = sdp.replace(/a=sendonly\r\n/g, 'a=sendrecv\r\n');
                    sdp = sdp.replace(/a=inactive\r\n/g, 'a=sendrecv\r\n');
                    sdp = sdp.replace(/a=recvonly\r\n/g, 'a=sendrecv\r\n');
                    
                    // Ensure we have sendrecv if no direction attribute exists for audio
                    if (!sdp.includes('a=sendrecv') && sdp.includes('m=audio')) {
                        // Find the audio media section and add sendrecv after it
                        sdp = sdp.replace(/(m=audio[^\r\n]*\r\n(?:(?!m=)[^\r\n]*\r\n)*)/g, (match) => {
                            if (!match.includes('a=sendrecv') && !match.includes('a=sendonly') && 
                                !match.includes('a=recvonly') && !match.includes('a=inactive')) {
                                // Insert sendrecv after the media line
                                return match.replace(/(m=audio[^\r\n]*\r\n)/, '$1a=sendrecv\r\n');
                            }
                            return match;
                        });
                    }
                    
                    // Ensure proper codec compatibility - prefer common codecs and simplify SDP
                    const audioLineMatch = sdp.match(/m=audio (\d+) UDP\/TLS\/RTP\/SAVPF (.+)\r\n/);
                    if (audioLineMatch) {
                        const port = audioLineMatch[1];
                        const codecs = audioLineMatch[2].split(' ');
                        
                        // Use only the most compatible codecs for mobile clients
                        const compatibleCodecs = [];
                        
                        // Only use PCMU and PCMA for maximum compatibility
                        if (codecs.includes('0')) compatibleCodecs.push('0'); // PCMU
                        if (codecs.includes('8')) compatibleCodecs.push('8'); // PCMA
                        
                        // Add telephone-event if available
                        codecs.forEach(codec => {
                            if (codec === '101' || codec === '100' || codec === '126' || codec === '99') {
                                compatibleCodecs.push(codec);
                            }
                        });
                        
                        // If we have compatible codecs, use only those
                        if (compatibleCodecs.length > 0) {
                            const newAudioLine = `m=audio ${port} UDP/TLS/RTP/SAVPF ${compatibleCodecs.join(' ')}\r\n`;
                            sdp = sdp.replace(/m=audio[^\r\n]*\r\n/, newAudioLine);
                            console.log('🔊 Using only compatible codecs:', compatibleCodecs.join(' '));
                            
                            // Remove rtpmap lines for codecs we're not using
                            const usedCodecs = new Set(compatibleCodecs);
                            sdp = sdp.replace(/a=rtpmap:(\d+)[^\r\n]*\r\n/g, (match, codecId) => {
                                return usedCodecs.has(codecId) ? match : '';
                            });
                            
                            // Remove fmtp lines for codecs we're not using
                            sdp = sdp.replace(/a=fmtp:(\d+)[^\r\n]*\r\n/g, (match, codecId) => {
                                return usedCodecs.has(codecId) ? match : '';
                            });
                            
                            // Remove complex attributes that might confuse mobile clients
                            sdp = sdp.replace(/a=rtcp-fb:[^\r\n]*\r\n/g, ''); // Remove RTCP feedback
                            sdp = sdp.replace(/a=rtcp-xr:[^\r\n]*\r\n/g, ''); // Remove RTCP extended reports
                            sdp = sdp.replace(/a=record:[^\r\n]*\r\n/g, ''); // Remove recording attributes
                            
                            // Simplify crypto - keep only the first, most compatible one
                            const cryptoLines = sdp.match(/a=crypto:[^\r\n]*\r\n/g);
                            if (cryptoLines && cryptoLines.length > 1) {
                                // Keep only the first crypto line (usually the most compatible)
                                const firstCrypto = cryptoLines[0];
                                sdp = sdp.replace(/a=crypto:[^\r\n]*\r\n/g, '');
                                sdp = sdp.replace(/(a=sendrecv\r\n)/, `${firstCrypto}$1`);
                                console.log('🔊 Simplified crypto to single line for compatibility');
                            }
                        } else {
                            // Fallback to original reordering if no compatible codecs found
                            const reorderedCodecs = [];
                            if (codecs.includes('0')) reorderedCodecs.push('0');
                            if (codecs.includes('8')) reorderedCodecs.push('8');
                            if (codecs.includes('96')) reorderedCodecs.push('96');
                            
                            codecs.forEach(codec => {
                                if (!reorderedCodecs.includes(codec)) {
                                    reorderedCodecs.push(codec);
                                }
                            });
                            
                            const newAudioLine = `m=audio ${port} UDP/TLS/RTP/SAVPF ${reorderedCodecs.join(' ')}\r\n`;
                            sdp = sdp.replace(/m=audio[^\r\n]*\r\n/, newAudioLine);
                            console.log('🔊 Fallback codec reordering:', reorderedCodecs.join(' '));
                        }
                    }
                    
                    // Log the modified SDP
                    console.log('🔊 Modified Answer SDP:', sdp);
                    
                    description.sdp = sdp;
                    return Promise.resolve(description);
                }
            ]
        };
        
        // Add session event handlers to track ACK issues
        const actualSession = session.invitation || session;
        
        // Track ACK timeout issues
        if (actualSession.stateChange) {
            actualSession.stateChange.addListener((state) => {
                console.log('🔊 Session state change during answer:', state);
            });
        }
        
        // Add ACK timeout handler if available
        if (actualSession.delegate) {
            const originalDelegate = actualSession.delegate;
            actualSession.delegate = {
                ...originalDelegate,
                onAckTimeout: () => {
                    console.warn('⚠️ ACK timeout detected - remote client may have connectivity issues');
                    if (originalDelegate.onAckTimeout) {
                        originalDelegate.onAckTimeout();
                    }
                }
            };
        }
        
        // Check what kind of session object we have and accept appropriately
        if (typeof session.accept === 'function') {
            console.log('🔊 Accepting call using session.accept');
            await session.accept(acceptOptions);
        } else if (session.invitation && typeof session.invitation.accept === 'function') {
            console.log('🔊 Accepting call using session.invitation.accept');
            await session.invitation.accept(acceptOptions);
        } else {
            throw new Error('Cannot find an accept method on the session');
        }
        
        console.log('✅ Call accepted successfully');
        session.status = 'answered';
        
        // Wait for session establishment
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Aggressively ensure the microphone stream is attached after accept
        if (stream) {
            const audioTrack = stream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = true;
                console.log('🔊 Audio track enabled:', audioTrack.enabled);
                console.log('🔊 Audio track readyState:', audioTrack.readyState);
                
                // Force attachment to the peer connection created by SIP.js
                try {
                    const sessionHandler = session.sessionDescriptionHandler || session.invitation?.sessionDescriptionHandler;
                    if (sessionHandler && sessionHandler.peerConnection) {
                        const pc = sessionHandler.peerConnection;
                        const senders = pc.getSenders();
                        const audioSenders = senders.filter(s => s.track && s.track.kind === 'audio');
                        
                        console.log('🔊 Post-accept validation - Audio senders found:', audioSenders.length);
                        console.log('🔊 All senders:', senders.map(s => ({
                            track: s.track ? `${s.track.kind} (${s.track.id})` : 'no track',
                            enabled: s.track ? s.track.enabled : 'N/A'
                        })));
                        
                        if (audioSenders.length === 0) {
                            console.warn('⚠️ No audio senders found - adding microphone track to peer connection');
                            pc.addTrack(audioTrack, stream);
                            console.log('✅ Added microphone track to peer connection');
                        } else {
                            // Replace existing tracks with our microphone stream
                            console.log('🔊 Replacing existing audio tracks with microphone stream');
                            for (const sender of audioSenders) {
                                await sender.replaceTrack(audioTrack);
                                console.log('✅ Replaced audio track:', sender.track.id);
                            }
                        }
                        
                        // Final validation
                        const finalSenders = pc.getSenders().filter(s => s.track && s.track.kind === 'audio');
                        console.log('🔊 Final audio senders count:', finalSenders.length);
                        finalSenders.forEach((sender, index) => {
                            console.log(`🔊 Final sender ${index}:`, {
                                trackId: sender.track.id,
                                enabled: sender.track.enabled,
                                readyState: sender.track.readyState
                            });
                        });
                    }
                } catch (validationError) {
                    console.error('❌ Error during post-accept validation:', validationError);
                }
            }
        }
        
        if (session.delegate?.onAnswered) {
            await session.delegate.onAnswered();
        }
        
        return session;
    } catch (error) {
        console.error('Error answering call:', error);
        throw error;
    }
}

export const handleRejectCall = async (session) => {
    try {
        await stopRingingSound();
        await session.reject();
        session.status = 'rejected';
        return session;
    } catch (error) {
        console.error('Error rejecting call:', error);
        throw error;
    }
}

export const handleEndCall = async (session, sipUserAgent) => {
    try {
        // Signal remote party appropriately
        try {
            if (typeof session.bye === 'function') {
                await session.bye();
            } else if (typeof session.cancel === 'function') {
                await session.cancel();
            } else if (typeof session.reject === 'function') {
                await session.reject();
            }
        } catch (signalError) {
            console.warn('Warning: error sending BYE/CANCEL/REJECT:', signalError);
        }

        // Stop ringing sound if still playing
        try { await stopRingingSound(); } catch (_) {}

        // Cleanup media and peer connection
        try {
            if (session.sessionDescriptionHandler?.peerConnection) {
                const pc = session.sessionDescriptionHandler.peerConnection;
                pc.getSenders().forEach(sender => { if (sender.track) sender.track.stop(); });
                pc.getReceivers().forEach(receiver => { if (receiver.track) receiver.track.stop(); });
                if (pc.signalingState !== 'closed') pc.close();
            }
        } catch (pcError) {
            console.warn('Warning: error cleaning up peer connection:', pcError);
        }

        // Stop any locally cached stream
        if (session._localStream) {
            try { session._localStream.getTracks().forEach(t => t.stop()); } catch (_) {}
            session._localStream = null;
        }

        // Tear down custom audio context chain used for mute
        if (session._audioContext) {
            try { session._audioContext.gainNode?.disconnect(); } catch (_) {}
            try { session._audioContext.audioSource?.disconnect(); } catch (_) {}
            try { session._audioContext.audioDestination?.disconnect(); } catch (_) {}
            try { session._audioContext.audioContext?.close(); } catch (_) {}
            session._audioContext = null;
        }

        // Do not stop the UserAgent here; keep REGISTER alive for next calls

        session.status = 'ended';
        return session;
    } catch (error) {
        console.error('Error ending call:', error);
        session.status = 'ended';
        return session;
    }
} 