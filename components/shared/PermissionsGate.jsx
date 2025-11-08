"use client";
import { useEffect } from "react";
import { requestMicrophonePermission, requestNotificationPermission } from "@/lib/permissions";
import toast from "react-hot-toast";

export default function PermissionsGate({ enabled = false }) {
  useEffect(() => {
    if (!enabled) return;

    const alreadyRequested = typeof window !== "undefined" && window.localStorage.getItem("permissionsRequested") === "true";
    if (alreadyRequested) return;

    const requestPermissions = async () => {
      const micGranted = await requestMicrophonePermission();
      if (!micGranted) {
        alert("Microphone permission is required for this app to work. Please enable it.");
        return;
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


