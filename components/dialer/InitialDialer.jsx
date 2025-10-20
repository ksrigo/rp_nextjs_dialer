'use client';
import { Phone } from 'lucide-react';
import {  useEffect, useState } from 'react';
import { IoIosBackspace } from "react-icons/io";
import DialerTopBar from '@/components/shared/DialerTopBar';
import { useDialer } from '@/app/context/DialerContext';
import { customFetch } from '@/api/customFetch';

const InitialDialer = ({onMakeCall, setStartCall, startCall}) => {
    const [isDialing, setIsDialing] = useState(false);

    const { phoneNumber, setPhoneNumber, extensionData, triggerCallHistory, setTriggerCallHistory } = useDialer();


    const handleKeyPress = (key) => {
        setPhoneNumber(prev => prev + key);
    };
    
    const handleBackspace = () => {
        setPhoneNumber(prev => prev.slice(0, -1));
    };

    const handleCall = async () => {
        if (phoneNumber && !isDialing) {
            setIsDialing(true);
            try {
                await onMakeCall(phoneNumber);
                setTriggerCallHistory(!triggerCallHistory);
                // getCallHistory();
                // The state changes will be handled by the parent component
            } catch (error) {
                console.error('Error making call:', error);
                setIsDialing(false);
            }
        }

    };

   

    useEffect(() => {
        if (startCall) {
            handleCall();
        }
    }, [startCall]);

    return (
        <>
        <DialerTopBar />

        <div className="p-4 chat-message-list chat-group-list" >


        <div className="dialer">

            <div className="phone-display">
                <div className="position-relative">
                    <input type="text" placeholder="Phone number" id="phoneNumber"
                        className="form-control text-center phone-input" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}  />
                        
                    {phoneNumber && (
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
                {/* <button className="action-button btn-back" title="Back" id="action-back">
                    <ArrowLeft size={20} />
                </button> */}
                <button 
                    className={`action-button btn-call ${isDialing ? 'dialing' : ''}`}
                    title="Call" 
                    onClick={handleCall}
                    disabled={isDialing || !phoneNumber}
                >
                    <Phone size={20} />
                </button>
            </div>

            </div>

        </div>

       
    </>
    );
}

export default InitialDialer;