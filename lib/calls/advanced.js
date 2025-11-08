// Advanced call features (transfer, hold, merge, etc.)
import { SessionState, UserAgent } from "sip.js";

const parseSipfragStatusCode = (body) => {
    try {
        if (!body || typeof body !== 'string') return null;
        const match = body.match(/SIP\/2\.0\s+(\d{3})/);
        return match ? parseInt(match[1], 10) : null;
    } catch (_) {
        return null;
    }
};
import { holdCall, resumeCall } from "@/hooks/useSip";

export const handleTransferCall = async (session, transferNumber, domain) => {
    try {
        if (!session) {
            throw new Error('Invalid session');
        }

        if (!transferNumber) {
            throw new Error('Transfer number is required');
        }

        if (session.state === SessionState.Established) {
            // Clean and format transfer number
            const cleanNumber = String(transferNumber).replace(/[^\d]/g, '');
            if (!cleanNumber) {
                throw new Error('Invalid transfer number format');
            }

            const targetUri = UserAgent.makeURI(`sip:${cleanNumber}@${domain}`);
            const referToTarget = `sip:${cleanNumber}@${domain}?method=INVITE`;
            if (!targetUri) {
                throw new Error(`Failed to create target URI for ${transferNumber}`);
            }

            const ua = session.userAgent || session._userAgent;
            const referredBy = ua?.configuration?.uri || '';

            const extraHeaders = [
                `Refer-To: <${referToTarget}>`,
                referredBy ? `Referred-By: <${referredBy}>` : undefined,
                referredBy ? `Contact: <${referredBy}>` : undefined,
                'Supported: replaces'
            ].filter(Boolean);

            // Prefer public API refer if available
            if (typeof session.refer === 'function') {
                let byeSent = false;
                const maybeBye = () => {
                    if (!byeSent) {
                        byeSent = true;
                        try { session.bye?.(); } catch (_) {}
                        // Force local cleanup to avoid lingering media/UI
                        try { handleForceTerminateCall(session); } catch (_) {}
                    }
                };
                // Put current call on hold during transfer attempt
                try { await holdCall(session); } catch (_) {}

                const ok = await new Promise(async (resolve) => {
                    await session.refer(targetUri, {
                        extraHeaders,
                        requestDelegate: {
                            onAccept: () => {
                                console.log('Transfer REFER accepted (202)');
                                // wait for NOTIFY to confirm connected
                            },
                            onReject: () => { console.error('Transfer REFER rejected'); resolve(false); },
                            onNotify: (notification) => {
                                const body = notification?.message?.body || notification?.request?.message?.body || notification?.request?.body;
                                const code = parseSipfragStatusCode(body);
                                if (code != null) {
                                    console.log(`Transfer NOTIFY status: ${code}`);
                                    if (code >= 200 && code < 300) {
                                        console.log('Transfer completed successfully, sending BYE to clear original leg');
                                        maybeBye();
                                        resolve(true);
                                    } else if (code >= 300) {
                                        console.warn('Transfer failed according to NOTIFY');
                                        resolve(false);
                                    }
                                }
                            }
                        }
                    });
                    // Fallback: if NOTIFY never arrives, resolve after 60s without dropping early
                    setTimeout(() => resolve(false), 60000);
                });
                if (!ok) { try { await resumeCall(session); } catch (_) {} }
                return ok;
            } else if (session._dialog && typeof session._dialog.refer === 'function') {
                let byeSent = false;
                const maybeBye = () => {
                    if (!byeSent) {
                        byeSent = true;
                        try { session.bye?.(); } catch (_) {}
                        try { handleForceTerminateCall(session); } catch (_) {}
                    }
                };
                const ok = await new Promise(async (resolve) => {
                    await session._dialog.refer(targetUri, {
                        extraHeaders,
                        requestDelegate: {
                            onAccept: () => {
                                console.log('Transfer REFER accepted (202)');
                                // wait for NOTIFY
                            },
                            onReject: () => { console.error('Transfer REFER rejected'); resolve(false); },
                            onNotify: (notification) => {
                                const body = notification?.message?.body || notification?.request?.message?.body || notification?.request?.body;
                                const code = parseSipfragStatusCode(body);
                                if (code != null) {
                                    console.log(`Transfer NOTIFY status: ${code}`);
                                    if (code >= 200 && code < 300) {
                                        console.log('Transfer completed successfully, sending BYE to clear original leg');
                                        maybeBye();
                                        resolve(true);
                                    } else if (code >= 300) {
                                        console.warn('Transfer failed according to NOTIFY');
                                        resolve(false);
                                    }
                                }
                            }
                        }
                    });
                    setTimeout(() => resolve(false), 60000);
                });
                return ok;
            } else {
                throw new Error('No refer capability available on session');
            }
            return true;
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
        if (!session) {
            console.warn('No session provided');
            return false;
        }

        if (hold) {
            await holdCall(session);
            session.isHolding = true;
            if (session.data) session.data.status = 'Hold';
        } else {
            await resumeCall(session);
            session.isHolding = false;
            if (session.data) session.data.status = 'Answered';
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

// Attended transfer: originalSession (1005-1003) + consultSession (1005-1006)
// On completion, REFER is sent on originalSession pointing to consult target; we
// wait for NOTIFY 200 before clearing both local legs. If it fails, we resume original.
export const handleCompleteAttendedTransfer = async (originalSession, consultSession, domain) => {
    try {
        if (!originalSession || !consultSession) {
            throw new Error('Both original and consult sessions are required');
        }

        // Hold original while completing transfer
        try { await holdCall(originalSession); } catch (_) {}

        // Prefer SIP.js attended transfer helper to add Replaces automatically

        const byeBoth = () => {
            try { originalSession.bye?.(); } catch (_) {}
            try { consultSession.bye?.(); } catch (_) {}
        };

        const sendRefer = async () => {
            if (typeof originalSession.refer === 'function' && consultSession) {
                return new Promise(async (resolve) => {
                    await originalSession.refer(consultSession, {
                        requestDelegate: {
                            onAccept: () => {},
                            onReject: () => resolve(false),
                            onNotify: (notification) => {
                                const body = notification?.message?.body || notification?.request?.message?.body || notification?.request?.body;
                                const code = parseSipfragStatusCode(body);
                                if (code != null) {
                                    if (code >= 200 && code < 300) { byeBoth(); resolve(true); }
                                    else if (code >= 300) { resolve(false); }
                                }
                            }
                        }
                    });
                    setTimeout(() => resolve(false), 60000);
                });
            }
            throw new Error('No attended refer capability available');
        };

        const ok = await sendRefer();
        if (!ok) {
            // Resume original if transfer failed
            try { await resumeCall(originalSession); } catch (_) {}
        }
        return ok;
    } catch (error) {
        console.error('Error in attended transfer:', error);
        return false;
    }
};

// Add this new function to handle forced call termination
export const handleForceTerminateCall = (session) => {
    try {
        if (!session) return;

        // Attempt BYE if supported
        try {
            if (session._dialog && typeof session._dialog.bye === 'function') {
                session._dialog.bye({
                    extraHeaders: ['X-Reason: Forced Termination'],
                    onSuccess: () => console.log('Call ended successfully'),
                    onFailure: () => console.error('Failed to end call')
                });
            } else if (typeof session.bye === 'function') {
                session.bye({
                    extraHeaders: ['X-Reason: Forced Termination']
                });
            }
        } catch (_) {}

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

        // Best-effort dispose without assuming terminate() exists
        if (typeof session.dispose === 'function') {
            try { session.dispose(); } catch (_) {}
        }
    } catch (error) {
        console.error('Error in handleForceTerminateCall:', error);
    }
}; 