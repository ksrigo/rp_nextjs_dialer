"use client";

import { Web } from 'sip.js';
const { SessionDescriptionHandler } = Web;
import Contact from "@/components/contact/Contact";
import IncomingCallPad from "@/components/dialer/IncomingCallPad";
import InitialDialer from "@/components/dialer/InitialDialer";
import OnCallPad from "@/components/dialer/OnCallPad";
import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useSip } from "@/hooks/useSip";
import { handleIncomingCall, sessionEstablishedHandler } from "@/lib/calls/core";
import { SessionState } from 'sip.js';
import { handleRejectCall, handleAnswerCall, handleEndCall } from "@/lib/calls/actions";
import OutgoingCallPad from "@/components/dialer/OutgoingCallPad";
import TransferDialPad from "@/components/dialer/TransferDialPad";
import AddCallDialPad from "@/components/dialer/AddCallDialPad";
import { handleAddCall, handleMakeCall } from "@/lib/calls/core";
import { handleMute, handleRecord } from "@/lib/calls/media";
import { handleHoldCall, handleTransferCall, handleForceTerminateCall, handleCompleteAttendedTransfer } from "@/lib/calls/advanced";
import Profile from "@/components/profile/Profile";
import { useDialer } from "@/app/context/DialerContext";
import toast from 'react-hot-toast';
import { customFetch } from '@/api/customFetch';
import { createAudioContext } from "@/hooks/useSip";
import { fetchCallHistory } from '@/services/call';


function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

const DialerSidebar = () => {
    const [transferNumber, setTransferNumber] = useState('07902416367');
    const [incomingCall, setIncomingCall] = useState(false);
    const [connected, setConnected] = useState(false);
    const [sipUserAgent, setSipUserAgent] = useState(null);
    const [callerInfo, setCallerInfo] = useState(null);
    const [session, setSession] = useState({});
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [recordedChunks, setRecordedChunks] = useState([]);
    const [isRecording, setIsRecording] = useState(false);
    const chunksRef = useRef([]);
    const audioContextRef = useRef(null);
    const [secondCallNumber, setSecondCallNumber] = useState('07902416367');
    const [secondSession, setSecondSession] = useState(null);
    const incomingSessionRef = useRef(null);
    const [speakerDeviceId, setSpeakerDeviceId] = useState('default');

    const { activeTap, setActiveTap, phoneNumber, setPhoneNumber, startCall, setStartCall, triggerCallHistory, setTriggerCallHistory, callId, setCallId, callHistory, setCallHistory, extensionData, setSessionStatus } = useDialer();

    const callbacks = useMemo(() => ({
        setActiveTap,
        onInvite: async (invitation) => {
            setIncomingCall(true);
            toast('Incoming call', {
                duration: 5000,
                style: {
                    padding: '16px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    maxWidth: '350px',
                    backgroundColor: '#f7f7ff',
                },
                position: 'top-right',
                icon: '📞',
            });
            setActiveTap(4);
            const session = await handleIncomingCall(invitation, {
                onSessionTerminated: () => {
                    setIncomingCall(false);
                    setCallerInfo(null);
                    setSession(prev => ({ ...prev, status: 'Terminated' }));
                    setActiveTap(1);
                    setTriggerCallHistory(true);
                    incomingSessionRef.current = null;
                },
                onAnsweredCall: () => {
                    setActiveTap(3);
                    setIncomingCall(false);
                    setSession(prev => ({ 
                        ...prev, 
                        status: 'Answered',
                        state: SessionState.Established 
                    }));
                    setTriggerCallHistory(true);
                    sessionEstablishedHandler(session, speakerDeviceId, isMuted);
                },
                
            });
            
            setCallerInfo(session.data);
            setSession(session);
            incomingSessionRef.current = session;
            
            console.log('Session set after incoming call:', session);
            setTriggerCallHistory(true);
        },
        onRegistering: () => {},
        onRegistered: () => {
            setConnected(true);
        },
    }), [setActiveTap]);

    const sipState = useSip(callbacks);
    const lastStatus = useRef(sipState.status);

    const debouncedGetCallHistory = useCallback(
        debounce(async () => {
            if (extensionData?.[0]?.id) {
                try {
                    const callHistoryResponse = await fetchCallHistory(extensionData?.[0]?.id);
                    
                    if (callHistoryResponse.success && Array.isArray(callHistoryResponse.data)) {
                        setCallHistory(callHistoryResponse.data);
                        setTriggerCallHistory(false);
                    } else {
                        console.warn('Invalid call history response:', callHistoryResponse.message);
                        setCallHistory([]);
                        setTriggerCallHistory(false);
                    }
                } catch (error) {
                    setCallHistory([]);
                    setTriggerCallHistory(false);
                }
            } else {
                console.log('DialerSideBar: No extension ID available for call history');
            }
        }, 1000),
        [extensionData, setCallHistory, setTriggerCallHistory]
    );

    useEffect(() => {
        if (
            triggerCallHistory || 
            session?.status !== lastStatus.current || 
            session?.state === SessionState.Terminated
        ) {
            debouncedGetCallHistory();
            lastStatus.current = session?.status;
        }
    }, [
        session?.status, 
        session?.state,
        triggerCallHistory,
        debouncedGetCallHistory
    ]);

    

    const updateSessionStatus = useCallback(
        debounce((newSession) => {
            if (newSession) {
                setSessionStatus({
                    status: newSession.status,
                    state: newSession.state,
                    id: newSession.id,
                    startTime: newSession.startTime,
                    isHolding: newSession.isHolding
                });
            }
        }, 500),
        [setSessionStatus]
    );

    useEffect(() => {
        updateSessionStatus(session);
    }, [session, updateSessionStatus]);

    useEffect(() => {
        if (
            session?.status === 'Terminated' || 
            session?.state === SessionState.Terminated
        ) {
            setIncomingCall(false);
            setCallerInfo(null);
            setSession({});
            setActiveTap(1);
            debouncedGetCallHistory();
        }
    }, [session?.status, session?.state]);

    useEffect(() => {
        if (sipState?.status === 'Terminated') {
            setIncomingCall(false);
            setCallerInfo(null);
            setSession({});
            setActiveTap(1);
            debouncedGetCallHistory();
        }
    }, [sipState?.status]);

    const onRejectCall = async () => {
        try {
            if (session) {
                await handleRejectCall(session);
                setIncomingCall(false);
                setCallerInfo(null);
                setSession(prev => ({ ...prev, status: 'Rejected' }));
                setActiveTap(1);
                setTriggerCallHistory(true);
            }
        } catch (error) {
            console.error('Error in onRejectCall:', error);
        }
    }

    const onAnswerCall = async () => {
        try {
            const currentSession = incomingSessionRef.current || session;
            
            console.log('Answering call with session from ref:', incomingSessionRef.current);
            console.log('Answering call with session from state:', session);
            
            if (!currentSession || Object.keys(currentSession).length === 0) {
                console.error('Session is empty or undefined in both ref and state');
                toast.error('Cannot answer call: Invalid session');
                return;
            }

            await handleAnswerCall(currentSession);
            
            setIncomingCall(false);
            setSession(prev => ({ 
                ...prev,
                status: 'Answered',
                state: SessionState.Established,
                startTime: Date.now(),
                sessionDescriptionHandler: currentSession.sessionDescriptionHandler
            }));
            
            setCallerInfo(prev => prev || currentSession.data);
            setActiveTap(3);
            setTriggerCallHistory(true);
            
            const callId = currentSession.request?.callId || 
                          currentSession.invitation?.request?.callId || 
                          currentSession.id || 'unknown';
            setCallId(callId);
        } catch (error) {
            console.error('Error answering call:', error);
            toast.error('Failed to answer call: ' + (error.message || 'Unknown error'));
        }
    };

    const handleCallEnd = async () => {
        try {
            if (session) {
                await handleEndCall(session, sipState?.userAgent);
                setSession({});
                setCallerInfo(null);
                setIncomingCall(false);
                setPhoneNumber('');
                setActiveTap(1);
                setTriggerCallHistory(true);
            }
        } catch (error) {
            console.error('Error in handleCallEnd:', error);
        }
    };

    useEffect(() => {
        if (session?.invitation?.stateChange) {
            const handleStateChange = (newState) => {
                if (newState === 'Terminated') {
                    setSession({});
                    setCallerInfo(null);
                    setIncomingCall(false);
                    setActiveTap(1);
                    setTriggerCallHistory(true);
                }
            };

            session.invitation.stateChange.addListener(handleStateChange);
            return () => {
                session.invitation.stateChange.removeListener(handleStateChange);
            };
        }
    }, [session, setActiveTap]);
    const [isMuted, setIsMuted] = useState(false);
    const handleMuteClick = async () => {
        const success = await handleMute(session);
        if (success) {
            console.log('Mute successful');
            setIsMuted(!isMuted);
        }
    };

    // const handleRecordClick = async (startRecording) => {
    //     try {
    //         const { success, recorder } = await handleRecord(session, startRecording, {
    //             onDataAvailable: (data) => {
    //                 chunksRef.current.push(data);
    //             },
    //             onRecordingStop: () => {
    //                 if (chunksRef.current.length > 0) {
    //                     const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
    //                     const url = URL.createObjectURL(blob);
    //                     const a = document.createElement('a');
    //                     document.body.appendChild(a);
    //                     a.style = 'display: none';
    //                     a.href = url;
    //                     a.download = `call-recording-${new Date().toISOString()}.webm`;
    //                     a.click();
    //                     setTimeout(() => {
    //                         document.body.removeChild(a);
    //                         URL.revokeObjectURL(url);
    //                     }, 100);
    //                 }
    //             }
    //         });

    //         if (success) {
    //             if (startRecording) {
    //                 setMediaRecorder(recorder);
    //                 setIsRecording(true);
    //             } else if (mediaRecorder) {
    //                 mediaRecorder.requestData();
    //                 setTimeout(() => {
    //                     mediaRecorder.stop();
    //                     setMediaRecorder(null);
    //                     setIsRecording(false);
    //                 }, 100);
    //             }
    //         }
    //     } catch (error) {
    //         console.error('Error handling record:', error);
    //         setIsRecording(false);
    //         if (mediaRecorder) {
    //             try {
    //                 mediaRecorder.stop();
    //             } catch (e) {
    //                 console.error('Error stopping recorder:', e);
    //             }
    //         }
    //     }
    // };

    const onMakeCall = async (number) => {
        try {
            if (!sipState.userAgent) {
                throw new Error('SIP User Agent not initialized');
            }

            const session = await handleMakeCall(sipState.userAgent, number, extensionData, {
                setSession,
                setCallerInfo,
                setPhoneNumber,
                setActiveTap
            });
            const callId = session.request?.callId || 
            (session.id || '') || 
            (session.invitation?.request?.callId || '') ||
            'unknown';

            setCallId(callId);
            setTriggerCallHistory(true);
            sessionEstablishedHandler(session, speakerDeviceId, isMuted);
        } catch (error) {
            console.error('Error in handleMakeCallWrapper:', error);
            throw error;
        }
    };

    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (session?.state === SessionState.Established || 
                activeTap === 3 || 
                activeTap === 4 || 
                activeTap === 5 || 
                activeTap === 6 || 
                activeTap === 7) {
                e.preventDefault();
                e.returnValue = 'You have an active call. Are you sure you want to leave?';
                return e.returnValue;
            }
        };

        const handleUnload = () => {
            if (session?.state === SessionState.Established) {
                handleForceTerminateCall(session);
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('unload', handleUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('unload', handleUnload);
        };
    }, [session?.state, activeTap]);

    const handleHold = async (hold) => {
        try {
            const success = await handleHoldCall(session, hold);
            if (success) {
                setTriggerCallHistory(true);
            }
            return success;
        } catch (error) {
            console.error('Error in handleHold:', error);
            return false;
        }
    };

    const onTransfer = async () => {
        setActiveTap(6);
    };

    const onConfirmTransfer = async () => {
        try {
            if (!transferNumber) {
                console.error('No transfer number provided');
                return;
            }
            const ok = await handleTransferCall(session, transferNumber, extensionData?.[0]?.domain);
            // Only clear when transfer confirmed (NOTIFY 200)
            if (ok === true) {
                setSession({});
                setCallerInfo(null);
                setIncomingCall(false);
                setActiveTap(1);
            } else {
                // Transfer failed or no answer: return to active call view
                setActiveTap(3);
            }
            setTransferNumber('');
            setTriggerCallHistory(true);
        } catch (error) {
            console.error('Error in transfer:', error);
        }
    };

    const onAddCall = async () => {
        setActiveTap(7);
        setTriggerCallHistory(true);
    };

    const onCompleteTransfer = async () => {
        try {
            const ok = await handleCompleteAttendedTransfer(session, secondSession, extensionData?.[0]?.domain);
            if (ok) {
                setSession({});
                setSecondSession(null);
                setCallerInfo(null);
                setIncomingCall(false);
                setActiveTap(1);
            } else {
                setActiveTap(3);
            }
            setTriggerCallHistory(true);
        } catch (e) {
            console.error('Error completing attended transfer:', e);
        }
    };

    console.log('activeTap', activeTap);

    return (
        <>
            <div className="chat-leftsidebar me-lg-1 ms-lg-0" 
                style={activeTap === 2 ? {
                    height: '100vh',
                    overflowY: 'auto',
                    scrollbarWidth: 'thin',
                } : {}}
            >
                {activeTap === 1 && (
                    <InitialDialer 
                        onMakeCall={onMakeCall}
                        setStartCall={setStartCall}
                        startCall={startCall}
                    />
                )}
                {activeTap === 2 && <Contact
                    setStartCall={setStartCall}
                    startCall={startCall}
                />}
                {activeTap === 3 && (
                    <></>
                    // <OnCallPad 
                    //     callerInfo={callerInfo}
                    //     startTime={session.startTime}
                    //     onEndCall={handleCallEnd}
                    //     onMute={handleMuteClick}
                    //     onHold={handleHold}
                    //     onAddCall={handleAddCall}
                    //     onTransfer={onTransfer}
                    //     onCompleteTransfer={onCompleteTransfer}
                    //     isRecording={isRecording}
                    //     secondCall={secondSession}
                    //     isHolding={session.isHolding}
                    //     secondSession={secondSession}
                    // />
                )}
                {activeTap === 4 && (
                    <IncomingCallPad 
                        callerInfo={callerInfo}
                        onAnswerCall={onAnswerCall}
                        onRejectCall={onRejectCall}
                    />
                )}
                {activeTap === 5 && (
                    <OutgoingCallPad 
                        callerInfo={callerInfo}
                        onEndCall={handleCallEnd}
                    />
                )}
                {activeTap === 6 && (
                    <TransferDialPad 
                        onTransfer={onConfirmTransfer}
                        transferNumber={transferNumber}
                        setTransferNumber={setTransferNumber}
                        session={session}
                    />
                )}
                {activeTap === 7 && (
                    <AddCallDialPad 
                        onAddCall={onAddCall}
                        secondCallNumber={secondCallNumber}
                        setSecondCallNumber={setSecondCallNumber}
                        session={session}
                        onSecondSession={setSecondSession}
                    />
                )}
                {activeTap === 8 && (
                    <Profile  />
                )}
            </div>
        </>
    );
}

export default DialerSidebar;