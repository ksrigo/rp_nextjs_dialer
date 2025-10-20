// app/context/DialerContext.jsx

'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { customFetch } from '@/api/customFetch';

export const DialerContext = createContext();

export function DialerProvider({ children, contactData: initialContactData, callHistoryData: initialCallHistoryData, profileData, extensionData, recordingData }) {
  const [activeTap, setActiveTap] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [contactData, setContactData] = useState(initialContactData);
  const [startCall, setStartCall] = useState(false);
  const [triggerCallHistory, setTriggerCallHistory] = useState(false);
  const [callId, setCallId] = useState('');
  const [callHistory, setCallHistory] = useState(initialCallHistoryData);
  const [sessionStatus, setSessionStatus] = useState(false);
  // New: selected extension to drive SIP and history
  const [selectedExtension, setSelectedExtension] = useState(() => {
    return Array.isArray(extensionData) && extensionData.length > 0 ? extensionData[0] : null;
  });

  // Function to fetch call history
  const getCallHistory = async () => {
    const extId = selectedExtension?.id || extensionData?.[0]?.id;
    if (extId) {
      try {
        console.log('Context: Fetching call history for extension:', extId);
        const callHistoryResponse = await customFetch(`extension/${extId}/calls`, "GET");
        console.log('Context: Call history response:', callHistoryResponse);
        
        if (callHistoryResponse && Array.isArray(callHistoryResponse)) {
          setCallHistory(callHistoryResponse);
          console.log('Context: Call history updated with', callHistoryResponse.length, 'calls');
        } else {
          console.warn('Context: Invalid call history response:', callHistoryResponse);
          setCallHistory([]);
        }
        setTriggerCallHistory(false); // Reset the trigger after fetching
      } catch (error) {
        console.error('Context: Error fetching call history:', error);
        setCallHistory([]);
        setTriggerCallHistory(false);
      }
    } else {
      console.log('Context: No extension ID available for call history');
    }
  };

  // Effect to fetch call history when trigger changes
  useEffect(() => {
    if (triggerCallHistory) {
      getCallHistory();
    }
  }, [triggerCallHistory]);

  return (
    <DialerContext.Provider value={{ 
      contactData, 
      setContactData,
      callHistory, 
      setCallHistory,
      profileData, 
      extensionData, 
      selectedExtension,
      setSelectedExtension,
      activeTap, 
      setActiveTap, 
      phoneNumber, 
      setPhoneNumber,
      startCall,
      setStartCall,
      triggerCallHistory,
      setTriggerCallHistory,
      callId,
      setCallId,
      recordingData,
      sessionStatus,
      setSessionStatus
    }}>
      {children}
    </DialerContext.Provider>
  );
}

export function useDialer() {
  const context = useContext(DialerContext);
  if (context === undefined) {
    throw new Error('useDialer must be used within a DialerProvider');
  }
  return context;
}