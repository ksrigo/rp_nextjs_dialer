"use client";
import { useEffect } from "react";
import { requestMicrophonePermission, requestNotificationPermission } from "@/lib/permissions";
import toast from "react-hot-toast";

export default function PermissionsGate({ enabled = false }) {
  useEffect(() => {
    if (!enabled) return;

    // Skip mic permission on insecure origins (only show a helpful message)
    const isSecure =
      (typeof window !== 'undefined' && window.isSecureContext === true) ||
      (typeof window !== 'undefined' && window.location?.protocol === 'https:') ||
      (typeof window !== 'undefined' && ['localhost', '127.0.0.1','172.16.0.108'].includes(window.location?.hostname));

    const alreadyRequested = typeof window !== "undefined" && window.localStorage.getItem("permissionsRequested") === "true";
    if (alreadyRequested) return;

    const requestPermissions = async () => {
      if (!isSecure) {
        toast.error("Microphone access needs HTTPS or localhost. Please use a secure origin.");
      } else {
        const micGranted = await requestMicrophonePermission();
        if (!micGranted) {
          alert("Microphone permission is required for this app to work. Please enable it.");
          return;
        }
      }

      const notifGranted = await requestNotificationPermission();
      if (!notifGranted) {
        alert("Notification permission is required for this app to work. Please enable it.");
        return;
      }

      try {
        window.localStorage.setItem("permissionsRequested", "true");
      } catch {}
      toast.success("Permissions granted. You’re all set!");
    };

    requestPermissions();
  }, [enabled]);

  return null;
}


