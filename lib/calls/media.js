// Media-related functions (mute, record)


export const handleMute = async (session) => {
    try {
        // First try to use the audio context gain node if available
        if (session._audioContext && session._audioContext.gainNode) {
            const gainNode = session._audioContext.gainNode;
            const currentGain = gainNode.gain.value;
            const newGain = currentGain === 0 ? 1 : 0;
            
            gainNode.gain.value = newGain;
            console.log(`Microphone ${newGain === 0 ? 'muted' : 'unmuted'} using gain node`);
            return true;
        }

        // Fallback to track.enabled method
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

        // Get current mute state from first track and toggle it
        const currentMuteState = !audioTracks[0].enabled;
        
        // Toggle mute state on all audio tracks
        audioTracks.forEach(track => {
            track.enabled = currentMuteState;
        });

        console.log(`Microphone ${!currentMuteState ? 'muted' : 'unmuted'} using track.enabled`);
        return true;

    } catch (error) {
        console.error('Error in handleMute:', error);
        return false;
    }
}

export const handleRecord = async (session, startRecording, callbacks) => {
    // ... existing code ...
} 