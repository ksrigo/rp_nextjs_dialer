// Advanced call features (transfer, hold, merge, etc.)
import { SessionState, UserAgent } from "sip.js";

export const handleTransferCall = async (session, transferNumber, domain) => {
    try {
        if (!session || !session._userAgent) {
            throw new Error('Invalid session');
        }

        if (!transferNumber) {
            throw new Error('Transfer number is required');
        }

        if (session.state === SessionState.Established) {
            if (session._dialog) {
                // Clean and format transfer number
                const cleanNumber = String(transferNumber).replace(/[^\d]/g, '');
                
                if (!cleanNumber) {
                    throw new Error('Invalid transfer number format');
                }

                const targetUri = UserAgent.makeURI(`sip:${cleanNumber}@${domain}`);
                
                if (!targetUri) {
                    throw new Error(`Failed to create target URI for ${transferNumber}`);
                }

                const extraHeaders = [
                    `Refer-To: <sip:${cleanNumber}@${domain}>`,
                    `Referred-By: <${session._userAgent.configuration.uri}>`,
                    `Contact: <${session._userAgent.configuration.uri}>`
                ];

                // Send REFER request
                await session._dialog.refer(targetUri, {
                    extraHeaders,
                    requestDelegate: {
                        onAccept: () => console.log('Transfer accepted'),
                        onReject: (response) => console.error('Transfer rejected:', response.message.reasonPhrase),
                        onNotify: (notification) => {
                            if (notification.message.statusCode === 200) {
                                console.log('Transfer completed successfully');
                                session.bye();
                            }
                        }
                    }
                });
            } else {
                throw new Error('No dialog available for transfer');
            }
        } else {
            throw new Error(`Cannot transfer call in state: ${session.state}`);
        }
    } catch (error) {
        console.error('Error in transfer:', error);
        throw error;
    }
}

export const handleHoldCall = async (session, hold) => {
    try {
        if (!session?.sessionDescriptionHandler) {
            console.warn('No session description handler found');
            return false;
        }

        const peerConnection = session.sessionDescriptionHandler.peerConnection;
        if (!peerConnection) {
            console.warn('No peer connection found');
            return false;
        }

        // Toggle tracks
        peerConnection.getSenders().forEach(sender => {
            if (sender.track) {
                sender.track.enabled = !hold;
            }
        });

        // Send hold/unhold SDP if session is active
        if (session.state === SessionState.Established) {
            try {
                await session.sessionDescriptionHandler.sendReinvite({
                    sessionDescriptionHandlerOptions: {
                        hold: hold
                    }
                });
            } catch (e) {
                console.warn('Error sending hold/unhold SDP:', e);
            }
        }

        return true;
    } catch (error) {
        console.error('Error in handleHold:', error);
        return false;
    }
}

export const handleMergeCalls = async (firstSession, secondSession, domain) => {
    try {
        if (!firstSession || !secondSession) {
            throw new Error('Both sessions are required for merging calls');
        }

        if (firstSession.state !== SessionState.Established || 
            secondSession.state !== SessionState.Established) {
            throw new Error('Both calls must be established to merge');
        }

        const conferenceUri = UserAgent.makeURI(`sip:conference@${domain}`);
        if (!conferenceUri) {
            throw new Error('Failed to create conference URI');
        }

        // Send REFER to both sessions
        await Promise.all([
            firstSession.refer(conferenceUri, {
                extraHeaders: [
                    `Referred-By: <sip:conference@${domain}>`,
                    'Require: replaces'
                ]
            }),
            secondSession.refer(conferenceUri, {
                extraHeaders: [
                    `Referred-By: <sip:conference@${domain}>`,
                    'Require: replaces'
                ]
            })
        ]);

        firstSession.data.isInConference = true;
        secondSession.data.isInConference = true;

        return {
            conferenceUri,
            participants: [firstSession, secondSession]
        };
    } catch (error) {
        console.error('Error merging calls:', error);
        throw error;
    }
}

// Add this new function to handle forced call termination
export const handleForceTerminateCall = (session) => {
    try {
        if (!session || session.state !== SessionState.Established) {
            return;
        }

        // Send BYE message synchronously
        if (session._dialog) {
            session._dialog.bye({
                extraHeaders: ['X-Reason: Page Unload'],
                onSuccess: () => console.log('Call ended successfully'),
                onFailure: () => console.error('Failed to end call')
            });
        } else if (session.bye) {
            session.bye({
                extraHeaders: ['X-Reason: Page Unload']
            });
        }

        // Force close media streams
        if (session.sessionDescriptionHandler?.peerConnection) {
            const pc = session.sessionDescriptionHandler.peerConnection;
            pc.getSenders().forEach(sender => {
                if (sender.track) {
                    sender.track.stop();
                }
            });
            pc.getReceivers().forEach(receiver => {
                if (receiver.track) {
                    receiver.track.stop();
                }
            });
            pc.close();
        }

        // Terminate the session immediately
        session.terminate();
    } catch (error) {
        console.error('Error in handleForceTerminateCall:', error);
    }
}; 