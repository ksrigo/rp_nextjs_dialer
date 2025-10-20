'use client';

import {  PhoneOff } from "lucide-react";
import Image from "next/image";
import DialerTopBar from "@/components/shared/DialerTopBar";



const OutgoingCallPad = ({ 
    callerInfo,
    onEndCall

}) => {
    return (
        <>

            <DialerTopBar />
            <div className="p-4">
                <div>
                    <div className="call-container incoming-call-container" style={{minHeight: '650px'}}>
                        <div className="status">Outgoing call...</div>
                        <div className="inbound-info">
                            <strong>Outbound number</strong><br/>
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
                            <div className="end-call-button">
                                <PhoneOff 
                                    size={40} 
                                    className="text-white text-center" 
                                    onClick={onEndCall}
                                />
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default OutgoingCallPad;