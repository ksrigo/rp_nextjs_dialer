// Function to check and request microphone permission
export const requestMicrophonePermission = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => track.stop()); // Stop the track immediately
    return true;
  } catch (err) {
    console.error("Microphone permission denied or error occurred:", err);
    return false;
  }
};

// Function to check and request notification permission
export const requestNotificationPermission = async () => {
  if (Notification.permission === "granted") {
    return true; // Notification permission already granted
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  } catch (err) {
    console.error("Error requesting notification permission:", err);
    return false;
  }
};