import React, { useEffect, useState } from 'react'

import { AudioLines, KeyboardIcon, Mic, Pause, Phone, PhoneForwarded, UserPlus, Merge } from "lucide-react";
import Image from "next/image";
import DialerTopBar from '@/components/shared/DialerTopBar';
import { useDialer } from '@/app/context/DialerContext';
import { customFetch } from '@/api/customFetch';
import toast from 'react-hot-toast';
import { recordCall } from '@/services/call';

const OnCallPad = ({
    callerInfo, 
    startTime, 
    onEndCall,
    onMute,
    onHold,      // New prop for hold functionality
    onAddCall,   // New prop for adding call
    onTransfer,   // New prop for blind transfer / open transfer pad
    onCompleteTransfer, // New prop for attended transfer completion
    secondCall,
    isHolding,
    secondSession,
    onMergeCalls
}) => {
    const [callDuration, setCallDuration] = useState('00:00');
    const [isMuted, setIsMuted] = useState(false);
    const [isHold, setIsHold] = useState(false);
    const [isRecording, setIsRecording] = useState(false);

    const { setActiveTap, callId, extensionData } = useDialer();



    useEffect(() => {
        const timer = setInterval(() => {
            const duration = Math.floor((Date.now() - startTime) / 1000);
            const hours = Math.floor(duration / 3600);
            const minutes = Math.floor((duration % 3600) / 60);     
            const seconds = duration % 60;
            setCallDuration(
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            );
        }, 1000);


        return () => clearInterval(timer);
    }, [startTime]);

    useEffect(() => {
        console.log('OnCallPad mounted with callerInfo:', callerInfo);
    }, [callerInfo]);

    useEffect(() => {
        console.log('isMuted', isMuted);
        if (startTime) {
            onMute(isMuted);
        }
    }, [isMuted, startTime]);

    const handleMuteToggle = async () => {
        const success = await onMute(!isMuted);
        if (success) {
            setIsMuted(!isMuted);
            console.log(`Microphone ${!isMuted ? 'muted' : 'unmuted'}`);
        }
    };

    const handleHoldToggle = async () => {
        try {
            const success = await onHold(!isHold);
            if (success) {
                setIsHold(!isHold);
                console.log(`Call ${!isHold ? 'held' : 'resumed'}`);
            }
        } catch (error) {
            console.error('Error toggling hold:', error);
        }
    };

    const recordCall = async () => {
        // console.log('callId', callId);/v1/extension/{extension_id}/record
        const extensionId = extensionData?.[0]?.id;
        if(extensionId){
            const data = {
                call_id: callId,
                action: isRecording ? 'stop' : 'start'
            }
            try {
                const response = await recordCall(extensionId, data); 
                if(response.success){
                    toast.success("Your call recording has been "+isRecording ? 'started' : 'stopped');
                }
            } catch (error) {
                console.error('Error recording call:', error);
            }
             
            // console.log('response', response);
        }
        
    }

    const handleRecordToggle = async () => {
        console.log('callId', callId);
        try {   
            setIsRecording(!isRecording);
            recordCall();
            // const success = await onRecord(!isRecording);
            // if (success) {
            //     setIsRecording(!isRecording);
            //     console.log(`Recording ${!isRecording ? 'started' : 'stopped'}`);
            // }
        } catch (error) {
            console.error('Error toggling recording:', error);
        }
    };

    const handleEndCall = async () => {
        try {
            await onEndCall();
        } catch (error) {
            console.error('Error ending call:', error);
        }
    };

    const handleTransfer = async () => {
        try {
            await onTransfer();
            setActiveTap(6);
        } catch (error) {
            console.error('Error transferring call:', error);
        }
    };

    const handleAddCallClick = async () => {
        try {
            setActiveTap(7); // Assuming 7 is your dialer pad view for making new calls
        } catch (error) {
            console.error('Error initiating additional call:', error);
        }
    };

    const handleMergeCalls = async () => {
        try {
            if (!session || !secondSession) {
                throw new Error('Both calls must be active to merge');
            }
            await onMergeCalls(session, secondSession);
        } catch (error) {
            console.error('Error merging calls:', error);
            alert('Failed to merge calls: ' + error.message);
        }
    };

  return (
    <>
   


    <DialerTopBar />


    <div className="p-4">
      
        <div >
            <div className="call-container">
                {/* Show both calls if there's a second call */}
                {secondCall && (
                    <div className="multiple-calls-container">
                        <div className={`call-info ${isHolding ? 'on-hold' : ''}`}>
                            <div className="status">On Hold</div>
                            <div className="number-display">{callerInfo?.phoneNumber || ''}</div>
                        </div>
                        <div className="call-info active">
                            <div className="status">Active Call</div>
                            <div className="number-display">{secondCall?.data?.phoneNumber || ''}</div>
                        </div>
                    </div>
                )}
                
                {/* Rest of your existing JSX */}
                <div className="status">Ongoing call...</div>
                <div className="inbound-info">
                    <strong>Inbound number</strong><br/>
                    Caller ID: {callerInfo?.displayName || 'Unknown Caller'}
                </div>
                 {/* Call Status and Duration */}
                 <div className="mt-4">
                    <h5 className="font-size-16 text-white">{callDuration}</h5>
                </div>
                <div className="caller-image">
                    <Image 

                        src="/assets/images/users/avatar-1.jpg" 
                        className="caller-image" 
                        alt="Caller" 
                        width={100} 
                        height={100}
                        priority
                    />
                </div>
                <div className="number-display">   {callerInfo?.phoneNumber || ''}</div>
                <div className="call-options">
                    <div 
                        className={`option ${isMuted ? 'option-active' : ''}`} 
                        onClick={() => setIsMuted(!isMuted)}
                        title={isMuted ? 'Unmute' : 'Mute'}
                    >
                        <Mic size={40} style={{ color: isMuted ? 'option-active' : '' }} />
                        {isMuted ? 'Unmute' : 'Mute'}
                    </div>
                    <div 
                        className={`option ${isHold ? 'option-active' : ''}`}
                        onClick={handleHoldToggle}
                        title={isHold ? 'Resume' : 'Hold'}
                    >
                        <Pause 
                            size={40} 
                            style={{ color: isHold ? 'option-active' : '' }} 
                        />
                        {isHold ? 'Resume' : 'Hold'}
                    </div>
                    <div 
                        className="option"
                        onClick={handleAddCallClick}
                        title="Add Call"
                    >
                        <UserPlus size={40} />
                        Add call
                    </div>
                    <div 
                        className="option"
                        onClick={() => {}} // Implement keypad toggle
                        title="Keypad"
                    >
                        <KeyboardIcon size={40} />
                        Keypad
                    </div>
                    <div 
                        className={`option ${isRecording ? 'option-active' : ''}`}
                        onClick={handleRecordToggle}
                        title={isRecording ? 'Stop Recording' : 'Start Recording'}
                    >
                        <AudioLines 
                            size={40} 
                            style={{ color: isRecording ? 'red' : 'inherit' }} 
                        />
                        {isRecording ? 'Stop' : 'Record'}
                    </div>
                    <div 
                        className="option"
                        onClick={secondSession ? onCompleteTransfer : handleTransfer}
                        title={secondSession ? 'Complete Transfer' : 'Transfer'}
                    >
                        <PhoneForwarded size={40} />
                        {secondSession ? 'Complete' : 'Transfer'}
                    </div>
                    {false && secondSession && (
                        <div className="option" onClick={handleMergeCalls} title="Merge Calls">
                            <Merge size={40} />
                            Merge
                        </div>
                    )}
                </div>
                <div className="end-call-button" onClick={handleEndCall}>
                    <Phone 
                        size={40} 
                        className="text-white text-center" 
                        style={{ transform: 'rotate(135deg)' }} 
                    />
                </div>
            </div>
        </div>
    </div>
</>
  )
}

export default OnCallPad