"use client"
// Add these variables at the top level
const audioContext = typeof window !== 'undefined' ? new (window.AudioContext || window.webkitAudioContext)() : null;
let audio = null;
let isSourceConnected = false;

// Single function to initialize audio
const initializeAudio = async () => {
    if (audio) return audio;

    const sound = new Audio('/assets/audio/yarra.mp3');
    sound.preload = 'auto';
    sound.loop = true;
    sound.volume = 0.5;
    
    await new Promise((resolve, reject) => {
        sound.addEventListener('loadeddata', resolve);
        sound.addEventListener('error', reject);
    });
    
    // Connect to audio context only once
    if (!isSourceConnected && audioContext) {
        const source = audioContext.createMediaElementSource(sound);
        source.connect(audioContext.destination);
        isSourceConnected = true;
    }
    
    audio = sound;
    return sound;
};

// Single play function with retry logic
export const playRingingSound = async () => {
    try {
        if (!audioContext) {
            throw new Error('Audio context not available');
        }

        if (!audio) {
            await initializeAudio();
        }

        if (!audio) return false;

        audio.pause();
        audio.currentTime = 0;
        
        await audioContext.resume();

        const maxAttempts = 3;
        for (let i = 0; i < maxAttempts; i++) {
            try {
                await audio.play();
                return true;
            } catch (error) {
                console.log(`Attempt ${i + 1} failed:`, error);
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
        return false;
    } catch (error) {
        console.error("Error in playRingingSound:", error);
        return false;
    }
};

export const stopRingingSound = () => {
    if (audio) {
        audio.pause();
        audio.currentTime = 0;
    }
};

// Export the audio context if needed elsewhere
export const getAudioContext = () => audioContext;