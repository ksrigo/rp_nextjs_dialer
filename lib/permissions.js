// Function to check and request microphone permission
export const requestMicrophonePermission = async () => {
  try {
    // Guard: only run in browser and secure context (https or localhost)
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return false;
    }
    const isSecure =
      (window.isSecureContext === true) ||
      window.location.protocol === 'https:' ||
      ['localhost', '127.0.0.1'].includes(window.location.hostname);
    const mediaDevices = navigator.mediaDevices;
    if (!isSecure || !mediaDevices || typeof mediaDevices.getUserMedia !== 'function') {
      console.warn('Microphone access requires a secure context (HTTPS or localhost) and getUserMedia support.');
      return false;
    }
    const stream = await mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => track.stop()); // Stop the track immediately
    return true;
  } catch (err) {
    console.error("Microphone permission denied or error occurred:", err);
    return false;
  }
};

// Function to check and request notification permission
export const requestNotificationPermission = async () => {
  try {
    if (typeof window === 'undefined' || typeof Notification === 'undefined') {
      return false;
    }
    if (Notification.permission === "granted") {
      return true; // Notification permission already granted
    }
    const permission = await Notification.requestPermission();
    return permission === "granted";
  } catch (err) {
    console.error("Error requesting notification permission:", err);
    return false;
  }
};