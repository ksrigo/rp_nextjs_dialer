'use client';

import React, { useState } from 'react';
import { ArrowLeft, Phone, X } from 'lucide-react';
import { IoIosBackspace } from "react-icons/io";
import DialerTopBar from '@/components/shared/DialerTopBar';
import { handleAddCall } from '@/lib/calls/core';
import { useDialer } from '@/app/context/DialerContext';

const AddCallDialPad = ({ 
    onAddCall,
    session,
    secondCallNumber,
    setSecondCallNumber,
    onSecondSession 
}) => {
    const [isDialing, setIsDialing] = useState(false);
    const [secondSession, setSecondSession] = useState(null);

    const { setActiveTap, extensionData } = useDialer();

    const handleKeyPress = (key) => {
        setSecondCallNumber(prev => prev + key);
    };

    const handleMakeSecondCall = async () => {
        try {
            setIsDialing(true);
            console.log('Making second call with:', {
                sessionState: session?.state,
                sessionId: session?.id,
                number: secondCallNumber
            });
            
            if (!session) {
                throw new Error('No active session available');
            }

            if (!secondCallNumber) {
                throw new Error('Please enter a phone number');
            }

            // Clean the number before passing it
            const cleanNumber = secondCallNumber.replace(/[^\d]/g, '');
            if (!cleanNumber) {
                throw new Error('Invalid phone number');
            }

            const newSession = await handleAddCall(session, cleanNumber, extensionData);
            setSecondSession(newSession);
            try { onSecondSession?.(newSession); } catch (_) {}
            setActiveTap(3); // Return to call view
        } catch (error) {
            console.error('Error making second call:', error);
            alert('Failed to make second call: ' + error.message);
        } finally {
            setIsDialing(false);
        }
    };

    const handleBackspace = () => {
        setSecondCallNumber(prev => prev.slice(0, -1));
    };

    return (
        <>
            <DialerTopBar />
            <div className="p-4 chat-message-list chat-group-list" >
                <div className="dialer">
                    <div className="d-flex justify-content-between align-items-center">
                        <h3>Add Call</h3>
                    </div>
                    <div className="phone-display">
                        <div className="position-relative">
                            <input type="text" placeholder="Phone number" id="phoneNumber"
                                className="form-control text-center phone-input" value={secondCallNumber} onChange={(e) => setSecondCallNumber(e.target.value)}  />
                            
                            {secondCallNumber && (
                                <div className="clear-button position-absolute top-50 end-0 translate-middle-y me-2">
                                    <div className="rounded-lg bg-gray-600 p-2 cursor-pointer hover:bg-gray-700">
                                        <IoIosBackspace 
                                            size={30} 
                                            className="text-danger" 
                                            onClick={handleBackspace}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="keypad">
                        <button  onClick={() => handleKeyPress('1')}>1</button>
                        <button  onClick={() => handleKeyPress('2')}>2<br /><small>ABC</small></button>
                        <button  onClick={() => handleKeyPress('3')}>3<br /><small>DEF</small></button>
                        <button  onClick={() => handleKeyPress('4')}>4<br /><small>GHI</small></button>
                        <button  onClick={() => handleKeyPress('5')}>5<br /><small>JKL</small></button>
                        <button  onClick={() => handleKeyPress('6')}>6<br /><small>MNO</small></button>
                        <button  onClick={() => handleKeyPress('7')}>7<br /><small>PQRS</small></button>
                        <button  onClick={() => handleKeyPress('8')}>8<br /><small>TUV</small></button>
                        <button  onClick={() => handleKeyPress('9')}>9<br /><small>WXYZ</small></button>
                        <button  onClick={() => handleKeyPress('*')}>*</button>
                        <button  onClick={() => handleKeyPress('0')}>0<br /><small>+</small></button>
                        <button  onClick={() => handleKeyPress('#')}>#</button>
                    </div>
                    <div className="call-buttons">
                        <button className="action-button btn-back" title="Back" id="action-back" onClick={() => setActiveTap(3)}>
                            <ArrowLeft size={20} />
                        </button>
                        <button 
                            className={`action-button btn-call ${isDialing ? 'dialing' : ''}`}
                            title="Add Call" 
                            onClick={handleMakeSecondCall}
                            disabled={isDialing || !secondCallNumber}
                        >
                            <Phone size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AddCallDialPad;