'use client';

import { Phone,  PhoneOff } from "lucide-react";
import Image from "next/image";
import DialerTopBar from "@/components/shared/DialerTopBar";
import { handleAnswerCall } from "@/lib/calls/actions";
import Icon from '@mdi/react';
import { mdiPhone } from '@mdi/js';
import { mdiPhoneOff } from '@mdi/js';

const IncomingCallPad = ({ 
    callerInfo,
    onAnswerCall,
    onRejectCall,
    session
}) => {
    
    const handleAnswerClick = async () => {
        try {
            // If you have access to the invitation object directly
            const invitation = callerInfo?.invitation || session?.invitation;
            
            if (invitation && typeof invitation.accept === 'function') {
                // Answer directly with the invitation
                await handleAnswerCall(invitation);
                onAnswerCall();
            } else {
                // Fall back to the existing onAnswerCall function
                onAnswerCall();
            }
        } catch (error) {
            console.error('Error in handleAnswerClick:', error);
        }
    };

    return (
        <>

            <DialerTopBar />
            <div className="p-4">
                <div>
                    <div className="call-container incoming-call-container" style={{minHeight: '650px'}}>
                        <div className="status">Incoming call...</div>
                        <div className="inbound-info">
                            <strong>Inbound number</strong><br/>
                            {callerInfo ? (
                                <>
                                    <div className="caller-name">{callerInfo.displayName}</div>
                                    <div className="caller-number">
                                        Caller ID: {callerInfo.calledNumber}
                                    </div>
                                </>
                            ) : (
                                <div>Unknown Caller</div>
                            )}
                        </div>
                        <div className="incoming-caller-image">
                            <Image 
                                src="/assets/images/users/avatar-1.jpg" 
                                className="incoming-caller-image" 
                                alt="Caller" 
                                width={150} 
                                height={150}
                                priority
                            />
                        </div>
                        <div className="number-display">
                            {callerInfo?.phoneNumber || 'Unknown Number'}
                        </div>
                        <div className="d-flex justify-content-between flex-row w-100">
                            <div className="answer-call-button">
                                <Icon path={mdiPhone} size={1} color="white" onClick={handleAnswerClick} />
                                {/* <Phone 
                                    size={40} 
                                    className="text-white text-center" 
                                    onClick={handleAnswerClick}
                                /> */}
                            </div>

                            <div className="end-call-button">
                                <Icon path={mdiPhoneOff} size={1} color="white" onClick={onRejectCall} />
                                {/* <PhoneOff 
                                    size={40} 
                                    className="text-white text-center" 
                                    onClick={onRejectCall}
                                /> */}
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default IncomingCallPad;