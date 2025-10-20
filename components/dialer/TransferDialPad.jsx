'use client';

import { ArrowLeft, Phone} from 'lucide-react';
import { useState } from 'react';
import { IoIosBackspace } from "react-icons/io";
import DialerTopBar from '@/components/shared/DialerTopBar';

const TransferDialPad = ({ onTransfer, transferNumber, setTransferNumber, session }) => {
   
    const [isTransferring, setIsTransferring] = useState(false);

    const handleKeyPress = (key) => {
        setTransferNumber(prev => prev + key);
    };
    
    const handleBackspace = () => {
        setTransferNumber(prev => prev.slice(0, -1));
    };

    const handleTransfer = async () => {
        if (transferNumber && !isTransferring) {
            setIsTransferring(true);
            try {
                // console.log('Transfer number:', session); // For debugging
                // console.log('Transfer number:', transferNumber); // For debugging
                await onTransfer();
                console.log('Transfer initiated for number:', transferNumber);
            } catch (error) {
                console.error('Error transferring call:', error);
            } finally {
                setIsTransferring(false);
            }
        }
    };

    return (
        <>
            <DialerTopBar />
            <div className="p-4 chat-message-list chat-group-list" >
                <div className="dialer">
                    <div className="d-flex justify-content-between align-items-center">
                        <h3>Transfer Call</h3>
                    </div>
                    <div className="phone-display">
                        <div className="position-relative">
                            <input type="text" placeholder="Phone number" id="phoneNumber"
                                className="form-control text-center phone-input" value={transferNumber} onChange={(e) => setTransferNumber(e.target.value)}  />
                            
                            {transferNumber && (
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
                        <button className="action-button btn-back" title="Back" id="action-back">
                            <ArrowLeft size={20} />
                        </button>
                        <button 
                            className={`action-button btn-call ${isTransferring ? 'dialing' : ''}`}
                            title="Transfer" 
                            onClick={handleTransfer}
                            disabled={isTransferring || !transferNumber}
                        >
                            <Phone size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default TransferDialPad;