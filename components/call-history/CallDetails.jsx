import Image from "next/image";
import { useDialer } from "@/app/context/DialerContext";
import { customFetch } from "@/api/customFetch";
import { useEffect, useCallback } from "react";

const CallDetails = () => {
    const handleRedial = (number) => {
        setPhoneNumber(number);
        setStartCall(true);
    }
    
    const { 
        callHistory, 
        phoneNumber, 
        setPhoneNumber, 
        startCall, 
        setStartCall, 
        triggerCallHistory, 
        extensionData, 
        callId, 
        recordingData, 
        setCallHistory, 
        sessionStatus,
        activeTap,
        selectedExtension
    } = useDialer();

    const getCallHistory = useCallback(async () => {
        const extId = selectedExtension?.id || extensionData?.[0]?.id;
        if (extId) {
            try {
                console.log('Fetching call history for extension:', extId);
                const callHistoryResponse = await customFetch(`extension/${extId}/calls`, "GET");
                console.log('Call history response:', callHistoryResponse);
                
                if (callHistoryResponse && Array.isArray(callHistoryResponse)) {
                    setCallHistory(callHistoryResponse);
                    console.log('Call history updated with', callHistoryResponse.length, 'calls');
                } else {
                    console.warn('Invalid call history response:', callHistoryResponse);
                    setCallHistory([]);
                }
            } catch (error) {
                console.error('Error fetching call history:', error);
                setCallHistory([]);
            }
        } else {
            console.log('No extension ID available for call history');
        }
    }, [selectedExtension, extensionData, setCallHistory]);

    useEffect(() => {
        // Only fetch when there's a meaningful trigger and we're on the call history tab
        if ((triggerCallHistory || 
            sessionStatus?.status === 'Terminated' || 
            sessionStatus?.status === 'Established' ||
            sessionStatus?.status === 'Answered') && 
            activeTap === 1  // Only fetch when we're on the main call history tab
        ) {
            getCallHistory();
        }
    }, [
        sessionStatus?.status,
        triggerCallHistory,
        callId,
        recordingData,
        getCallHistory,
        activeTap  // Add activeTap to dependencies
    ]);

    return (
        <div className="user-chat w-100 overflow-hidden">
            <div className="d-lg-flex">

                <div className="w-100 overflow-hidden position-relative" style={{display:'flex', flexDirection:'column', height:'100%'}}>
                    <div className="p-3 p-lg-4 border-bottom user-chat-topbar">
                        <div className="row align-items-center">
                            <div className="col-sm-8 col-8">
                                <div className="d-flex align-items-center">
                                    <div className="d-block d-lg-none me-2 ms-0">
                                        <a href="javascript: void(0);" className="user-chat-remove text-muted font-size-16 p-2">
                                            <i className="ri-arrow-left-s-line"></i>
                                        </a>
                                    </div>

                                    <div>
                                        <ul className="nav nav-tabs" id="callDetailsTabs" role="tablist">
                                            <li className="nav-item" role="presentation">
                                                <a className="nav-link active" id="call-history-tab" data-bs-toggle="tab" href="#call-history" role="tab" aria-controls="call-history" aria-selected="true">
                                                    <img src="assets/images/call/call-history.svg" className="img-call-history" alt="Call History Icon" /> Call History
                                                </a>
                                            </li>
                                            <li className="nav-item" role="presentation">
                                                <a className="nav-link" id="missed-calls-tab" data-bs-toggle="tab" href="#missed-calls" role="tab" aria-controls="missed-calls" aria-selected="false" tabIndex="-1">
                                                    <img src="assets/images/call/call-missed.svg" className="img-call-history" alt="Missed Calls Icon" /> Missed Calls
                                                </a>
                                            </li>
                                            <li className="nav-item" role="presentation">
                                                <a className="nav-link" id="incoming-calls-tab" data-bs-toggle="tab" href="#incoming-calls" role="tab" aria-controls="incoming-calls" aria-selected="false" tabIndex="-1">
                                                    <img src="assets/images/call/call-incoming.svg" className="img-call-history" alt="Incoming Calls Icon" /> Incoming
                                                    Calls
                                                </a>
                                            </li>
                                            <li className="nav-item" role="presentation">
                                                <a className="nav-link" id="outgoing-calls-tab" data-bs-toggle="tab" href="#outgoing-calls" role="tab" aria-controls="outgoing-calls" aria-selected="false" tabIndex="-1">
                                                    <img src="assets/images/call/call-outgoing.svg" className="img-call-history" alt="Outgoing Calls Icon" />  Outgoing
                                                    Calls
                                                </a>
                                            </li>
                                            <li className="nav-item" role="presentation">
                                                <a className="nav-link" id="voicemail-tab" data-bs-toggle="tab" href="#voicemail" role="tab" aria-controls="voicemail" aria-selected="false" tabIndex="-1">
                                                    <img src="assets/images/call/voicemail.svg" className="img-call-history" alt="Voicemail Icon" /> Voicemail
                                                </a>
                                            </li>
                                            <li className="nav-item" role="presentation">
                                                <a className="nav-link" id="recordings-tab" data-bs-toggle="tab" href="#recordings" role="tab" aria-controls="recordings" aria-selected="false" tabIndex="-1">
                                                    <img src="assets/images/call/call-recording.svg" className="img-call-history" alt="Recordings Icon" /> Recordings
                                                </a>
                                            </li>
                                        </ul>
                                    </div>
                                    <div className="flex-grow-1 overflow-hidden">

                                    </div>
                                </div>
                            </div>
                            <div className="col-sm-4 col-4">
                                <ul className="list-inline user-chat-nav text-end mb-0">
                                    <li className="list-inline-item">
                                        <div className="dropdown">
                                            <button className="btn nav-btn dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                                <i className="ri-search-line"></i>
                                            </button>
                                            <div className="dropdown-menu p-0 dropdown-menu-end dropdown-menu-md">
                                                <div className="search-box p-2">
                                                    <input type="text" className="form-control bg-light border-0" placeholder="Search.." />
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                    <li className="list-inline-item d-none d-lg-inline-block me-2 ms-0">
                                        <button type="button" className="btn nav-btn" data-bs-toggle="modal" data-bs-target="#audiocallModal">
                                            <i className="ri-phone-line"></i>
                                        </button>
                                    </li>


                                    <li className="list-inline-item">
                                        <div className="dropdown">
                                            <button className="btn nav-btn dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                                <i className="ri-more-fill"></i>
                                            </button>
                                            <div className="dropdown-menu dropdown-menu-end">
                                                <a className="dropdown-item" href="#">Archive <i className="ri-archive-line float-end text-muted"></i></a>
                                                <a className="dropdown-item" href="#">Muted <i className="ri-volume-mute-line float-end text-muted"></i></a>
                                                <a className="dropdown-item" href="#">Delete <i className="ri-delete-bin-line float-end text-muted"></i></a>
                                            </div>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="call-history p-3 p-lg-4" style={{flex:1, minHeight:0, overflowY:'auto', paddingBottom:'80px'}}>


                        <div className="tab-content" id="callHistoryTabsContent">

                            <div className="tab-pane fade show active" id="call-history" role="tabpanel" aria-labelledby="call-history-tab">
                                {Array.isArray(callHistory) ? callHistory.map((call, index) => {
                                    const callDate = new Date(call.time);
                                    const formattedDate = callDate.toLocaleDateString('en-US', {
                                        year: 'numeric', month: 'short', day: 'numeric'
                                    });
                                    const formattedTime = callDate.toLocaleTimeString('en-US', {
                                        hour: '2-digit', minute: '2-digit', hour12: true
                                    });

                                    const duration = call.duration; 
                                    const minutes = Math.floor(duration / 60);
                                    const seconds = duration % 60;

                                    return (
                                        <div className="call-entry" key={index}>
                                            <img src="assets/images/users/avatar-1.jpg" alt="" />
                                            <div className="call-details">
                                                <h6>{call.to_user}</h6>
                                                <small>{formattedDate} {formattedTime}</small>
                                            </div>
                                            <div className="call-time">
                                                <p>{minutes}m {seconds}s</p>
                                                <p>
                                                    <button type="button" className="btn nav-btn" onClick={() => {
                                                        handleRedial(call.to_user);
                                                    }}>
                                                        {
                                                            call.type === 'outgoing' ? 
                                                                <Image src="assets/images/call/call-outgoing.svg" className="call-history-icon" alt="Outgoing Calls Icon" width={18} height={18} /> 
                                                            : call.type === 'incoming' ?
                                                                call.is_missed_call ?
                                                                    <Image src="assets/images/call/call-missed.svg" className="call-history-icon" alt="Missed Calls Icon" width={18} height={18} />
                                                                : <Image src="assets/images/call/call-incoming.svg" className="call-history-icon" alt="Incoming Calls Icon" width={18} height={18} />
                                                            : <Image src="assets/images/call/call-voicemail.svg" className="call-history-icon" alt="Voicemail Icon" width={18} height={18} />
                                                        }
                                                    </button>
                                                </p>
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <div className="text-center p-4">
                                        <p className="text-muted">No call history available</p>
                                    </div>
                                )}

                                {/* <div className="call-entry">
                                    <img src="assets/images/users/avatar-3.jpg" alt="" />
                                    <div className="call-details">
                                        <h6>Michael Brown</h6>
                                        <small> <iconify-icon icon="bi:telephone-inbound" className="color-green"></iconify-icon> 20 Jun 2023 10:20 AM</small>
                                    </div>
                                    <div className="call-time">
                                        <p>15m 24s</p>
                                        <p>
                                            <button type="button" className="btn nav-btn" data-bs-toggle="modal" data-bs-target="#audiocallModal">
                                                <i className="ri-phone-fill"></i>
                                            </button>
                                        </p>
                                    </div>
                                </div>
                                <div className="call-entry">
                                    <img src="assets/images/users/avatar-4.jpg" alt="" />
                                    <div className="call-details">
                                        <h6>Emily Davis</h6>
                                        <small> <iconify-icon icon="bi:telephone-inbound" className="color-green"></iconify-icon> 20 Jun 2023 10:20 AM</small>
                                    </div>
                                    <div className="call-time">
                                        <p>15m 24s</p>
                                        <p>
                                            <button type="button" className="btn nav-btn" data-bs-toggle="modal" data-bs-target="#audiocallModal">
                                                <i className="ri-phone-fill"></i>
                                            </button>
                                        </p>
                                    </div>
                                </div>

                                <div className="call-entry">
                                    <img src="assets/images/users/avatar-7.jpg" alt="" />
                                    <div className="call-details">
                                        <h6>Susan Wilson</h6>
                                        <small> <iconify-icon icon="bi:voicemail" className="color-red"></iconify-icon> 20
                                            Jun 2023 10:20 AM</small>

                                    </div>
                                    <div className="call-time">
                                        <p>15m 24s</p>
                                        <p>
                                            <button type="button" className="btn nav-btn" data-bs-toggle="modal" data-bs-target="#audiocallModal">
                                                <i className="ri-phone-fill"></i>
                                            </button>
                                        </p>
                                    </div>
                                </div> */}

                            </div>

                            <div className="tab-pane fade" id="missed-calls" role="tabpanel" aria-labelledby="missed-calls-tab">
                                {Array.isArray(callHistory) ? callHistory.filter(call => call.type === 'incoming' && call.is_missed_call).map((call, index) => {
                                    const callDate = new Date(call.time);
                                    const formattedDate = callDate.toLocaleDateString('en-US', {
                                        year: 'numeric', month: 'short', day: 'numeric'
                                    });
                                    const formattedTime = callDate.toLocaleTimeString('en-US', {
                                        hour: '2-digit', minute: '2-digit', hour12: true
                                    });

                                    const duration = call.duration; 
                                    const minutes = Math.floor(duration / 60);
                                    const seconds = duration % 60;

                                    return (
                                        <div className="call-entry" key={index}>
                                            <img src="assets/images/users/avatar-1.jpg" alt="" />
                                            <div className="call-details">
                                                <h6>{call.to_user}</h6>
                                                <small>{formattedDate} {formattedTime}</small>
                                            </div>
                                            <div className="call-time">
                                                <p>{minutes}m {seconds}s</p>
                                                <p>
                                                    <button type="button" className="btn nav-btn" onClick={() => {
                                                        handleRedial(call.to_user);
                                                    }}>
                                                       
                                                        <Image src="assets/images/call/call-missed.svg" className="call-history-icon" alt="Missed Calls Icon" width={18} height={18} /> 
                                                                
                                                    </button>
                                                </p>
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <div className="text-center p-4">
                                        <p className="text-muted">No missed calls available</p>
                                    </div>
                                )}
                            </div>

                            <div className="tab-pane fade" id="incoming-calls" role="tabpanel" aria-labelledby="incoming-calls-tab">

                                {Array.isArray(callHistory) ? callHistory.filter(call => call.type === 'incoming' && !call.is_missed_call).map((call, index) => {
                                    const callDate = new Date(call.time);
                                    const formattedDate = callDate.toLocaleDateString('en-US', {
                                        year: 'numeric', month: 'short', day: 'numeric'
                                    });
                                    const formattedTime = callDate.toLocaleTimeString('en-US', {
                                        hour: '2-digit', minute: '2-digit', hour12: true
                                    });

                                    const duration = call.duration; 
                                    const minutes = Math.floor(duration / 60);
                                    const seconds = duration % 60;

                                    return (
                                        <div className="call-entry" key={index}>
                                            <img src="assets/images/users/avatar-1.jpg" alt="" />
                                            <div className="call-details">
                                                <h6>{call.to_user}</h6>
                                                <small>{formattedDate} {formattedTime}</small>
                                            </div>
                                            <div className="call-time">
                                                <p>{minutes}m {seconds}s</p>
                                                <p>
                                                    <button type="button" className="btn nav-btn" onClick={() => {
                                                        handleRedial(call.to_user);
                                                    }}>
                                                       
                                                        <Image src="assets/images/call/call-incoming.svg" className="call-history-icon" alt="Incoming Calls Icon" width={18} height={18} /> 
                                                                
                                                    </button>
                                                </p>
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <div className="text-center p-4">
                                        <p className="text-muted">No incoming calls available</p>
                                    </div>
                                )}
                              
                            </div>

                            <div className="tab-pane fade" id="outgoing-calls" role="tabpanel" aria-labelledby="outgoing-calls-tab">
                                {Array.isArray(callHistory) ? callHistory.filter(call => call.type === 'outgoing').map((call, index) => {
                                    const callDate = new Date(call.time);
                                    const formattedDate = callDate.toLocaleDateString('en-US', {
                                        year: 'numeric', month: 'short', day: 'numeric'
                                    });
                                    const formattedTime = callDate.toLocaleTimeString('en-US', {
                                        hour: '2-digit', minute: '2-digit', hour12: true
                                    });

                                    const duration = call.duration; 
                                    const minutes = Math.floor(duration / 60);
                                    const seconds = duration % 60;

                                    return (
                                        <div className="call-entry" key={index}>
                                            <img src="assets/images/users/avatar-1.jpg" alt="" />
                                            <div className="call-details">
                                                <h6>{call.to_user}</h6>
                                                <small>{formattedDate} {formattedTime}</small>
                                            </div>
                                            <div className="call-time">
                                                <p>{minutes}m {seconds}s</p>
                                                <p>
                                                    <button type="button" className="btn nav-btn" onClick={() => {
                                                        handleRedial(call.to_user);
                                                    }}>
                                                       
                                                        <Image src="assets/images/call/call-outgoing.svg" className="call-history-icon" alt="Outgoing Calls Icon" width={18} height={18} /> 
                                                                
                                                    </button>
                                                </p>
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <div className="text-center p-4">
                                        <p className="text-muted">No outgoing calls available</p>
                                    </div>
                                )}
                            </div>

                            <div className="tab-pane fade" id="voicemail" role="tabpanel" aria-labelledby="voicemail-tab">
                                <div className="call-entry">
                                    <img src="assets/images/users/avatar-7.jpg" alt="" />
                                    <div className="call-details">
                                        <h6>Susan Wilson</h6>
                                        <small> <iconify-icon icon="bi:voicemail" className="color-red"></iconify-icon> 20
                                            Jun 2023 10:20 AM</small>

                                    </div>
                                    <div className="call-time">
                                        <p>15m 24s</p>
                                        <p>
                                            <button type="button" className="btn nav-btn" data-bs-toggle="modal" data-bs-target="#audiocallModal">
                                                <i className="ri-phone-fill"></i>
                                            </button>
                                        </p>
                                    </div>
                                </div>
                                <div className="call-entry">
                                    <img src="assets/images/users/avatar-8.jpg" alt="" />
                                    <div className="call-details">
                                        <h6>David Taylor</h6>
                                        <small> <iconify-icon icon="bi:voicemail" className="color-red"></iconify-icon> 20
                                            Jun 2023 10:20 AM</small>

                                    </div>
                                    <div className="call-time">
                                        <p>15m 24s</p>
                                        <p>
                                            <button type="button" className="btn nav-btn" data-bs-toggle="modal" data-bs-target="#audiocallModal">
                                                <i className="ri-phone-fill"></i>
                                            </button>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="tab-pane fade" id="recordings" role="tabpanel" aria-labelledby="recordings-tab">
                                {Array.isArray(recordingData) ? recordingData.map((recording, index) => {

                                    const recordingDate = new Date(recording.time);
                                    const formattedDate = recordingDate.toLocaleDateString('en-US', {
                                        year: 'numeric', month: 'short', day: 'numeric'
                                    });
                                    const formattedTime = recordingDate.toLocaleTimeString('en-US', {
                                        hour: '2-digit', minute: '2-digit', hour12: true
                                    });

                                    const duration = recording.duration; 
                                    const minutes = Math.floor(duration / 60);
                                    const seconds = duration % 60;

                                    return (
                                        <div className="call-entry" key={index}>
                                            <img src="assets/images/users/avatar-7.jpg" alt="" />
                                            <div className="call-details">
                                                <h6>{recording.req_user} - {recording.from_user}</h6>
                                                <small>{formattedDate} {formattedTime}</small>

                                            </div>
                                            <div className="call-time">
                                                <p>{minutes}m {seconds}s</p>
                                                <p>
                                                    <button type="button" className="btn nav-btn" data-bs-toggle="modal" data-bs-target="#audiocallModal">
                                                        <i className="ri-play-fill"></i>
                                                    </button>
                                                </p>
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <div className="text-center p-4">
                                        <p className="text-muted">No recordings available</p>
                                    </div>
                                )}
                                
                            </div>
                        </div>
                    </div>


                </div>



                <div className="user-profile-sidebar">
                    <div className="px-3 px-lg-4 pt-3 pt-lg-4">
                        <div className="user-chat-nav text-end">
                            <button type="button" className="btn nav-btn" id="user-profile-hide">
                                <i className="ri-close-line"></i>
                            </button>
                        </div>
                    </div>

                    <div className="text-center p-4 border-bottom">
                        <div className="mb-4">
                            <img src="assets/images/users/avatar-4.jpg" className="rounded-circle avatar-lg img-thumbnail" alt="" />
                        </div>

                        <h5 className="font-size-16 mb-1 text-truncate">Doris Brown</h5>
                        <p className="text-muted text-truncate mb-1"><i className="ri-record-circle-fill font-size-10 text-success me-1 ms-0"></i> Active</p>
                    </div>

                    <div className="p-4 user-profile-desc" data-simplebar="init">
                        <div className="simplebar-wrapper" style={{ margin: '-24px' }}>
                            <div className="simplebar-height-auto-observer-wrapper">
                                <div className="simplebar-height-auto-observer"></div>
                            </div>
                            <div className="simplebar-mask">
                                <div className="simplebar-offset" style={{ right: '0px', bottom: '0px' }}>
                                    <div className="simplebar-content-wrapper" style={{ height: 'auto', overflow: 'hidden' }}>
                                        <div className="simplebar-content" style={{ padding: '24px' }}>
                                            <div className="text-muted">
                                                <p className="mb-4">If several languages coalesce, the grammar of the resulting language is more
                                                    simple and regular than that of the individual.</p>
                                            </div>

                                            <div className="accordion" id="myprofile">

                                                <div className="accordion-item card border mb-2">
                                                    <div className="accordion-header" id="about3">
                                                        <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#aboutprofile" aria-expanded="true" aria-controls="aboutprofile">
                                                            <h5 className="font-size-14 m-0">
                                                                <i className="ri-user-2-line me-2 ms-0 align-middle d-inline-block"></i> About
                                                            </h5>
                                                        </button>
                                                    </div>
                                                    <div id="aboutprofile" className="accordion-collapse collapse show" aria-labelledby="about3" data-bs-parent="#myprofile">
                                                        <div className="accordion-body">
                                                            <div>
                                                                <p className="text-muted mb-1">Name</p>
                                                                <h5 className="font-size-14">Doris Brown</h5>
                                                            </div>

                                                            <div className="mt-4">
                                                                <p className="text-muted mb-1">Email</p>
                                                                <h5 className="font-size-14">adc@123.com</h5>
                                                            </div>

                                                            <div className="mt-4">
                                                                <p className="text-muted mb-1">Time</p>
                                                                <h5 className="font-size-14">11:40 AM</h5>
                                                            </div>

                                                            <div className="mt-4">
                                                                <p className="text-muted mb-1">Location</p>
                                                                <h5 className="font-size-14 mb-0">California, USA</h5>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="accordion-item card border">
                                                    <div className="accordion-header" id="attachfile3">
                                                        <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#attachprofile" aria-expanded="false" aria-controls="attachprofile">
                                                            <h5 className="font-size-14 m-0">
                                                                <i className="ri-attachment-line me-2 ms-0 align-middle d-inline-block"></i>
                                                                Attached Files
                                                            </h5>
                                                        </button>
                                                    </div>
                                                    <div id="attachprofile" className="accordion-collapse collapse" aria-labelledby="attachfile3" data-bs-parent="#myprofile">
                                                        <div className="accordion-body">
                                                            <div className="card p-2 border mb-2">
                                                                <div className="d-flex align-items-center">
                                                                    <div className="avatar-sm me-3 ms-0">
                                                                        <div className="avatar-title bg-primary-subtle text-primary rounded font-size-20">
                                                                            <i className="ri-file-text-fill"></i>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex-grow-1">
                                                                        <div className="text-start">
                                                                            <h5 className="font-size-14 mb-1">admin_v1.0.zip</h5>
                                                                            <p className="text-muted font-size-13 mb-0">12.5 MB</p>
                                                                        </div>
                                                                    </div>

                                                                    <div className="ms-4 me-0">
                                                                        <ul className="list-inline mb-0 font-size-18">
                                                                            <li className="list-inline-item">
                                                                                <a href="#" className="text-muted px-1">
                                                                                    <i className="ri-download-2-line"></i>
                                                                                </a>
                                                                            </li>
                                                                            <li className="list-inline-item dropdown">
                                                                                <a className="dropdown-toggle text-muted px-1" href="#" role="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                                                                    <i className="ri-more-fill"></i>
                                                                                </a>
                                                                                <div className="dropdown-menu dropdown-menu-end">
                                                                                    <a className="dropdown-item" href="#">Action</a>
                                                                                    <a className="dropdown-item" href="#">Another action</a>
                                                                                    <div className="dropdown-divider"></div>
                                                                                    <a className="dropdown-item" href="#">Delete</a>
                                                                                </div>
                                                                            </li>
                                                                        </ul>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="card p-2 border mb-2">
                                                                <div className="d-flex align-items-center">
                                                                    <div className="avatar-sm me-3 ms-0">
                                                                        <div className="avatar-title bg-primary-subtle text-primary rounded font-size-20">
                                                                            <i className="ri-image-fill"></i>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex-grow-1">
                                                                        <div className="text-start">
                                                                            <h5 className="font-size-14 mb-1">Image-1.jpg</h5>
                                                                            <p className="text-muted font-size-13 mb-0">4.2 MB</p>
                                                                        </div>
                                                                    </div>

                                                                    <div className="ms-4 me-0">
                                                                        <ul className="list-inline mb-0 font-size-18">
                                                                            <li className="list-inline-item">
                                                                                <a href="#" className="text-muted px-1">
                                                                                    <i className="ri-download-2-line"></i>
                                                                                </a>
                                                                            </li>
                                                                            <li className="list-inline-item dropdown">
                                                                                <a className="dropdown-toggle text-muted px-1" href="#" role="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                                                                    <i className="ri-more-fill"></i>
                                                                                </a>
                                                                                <div className="dropdown-menu dropdown-menu-end">
                                                                                    <a className="dropdown-item" href="#">Action</a>
                                                                                    <a className="dropdown-item" href="#">Another action</a>
                                                                                    <div className="dropdown-divider"></div>
                                                                                    <a className="dropdown-item" href="#">Delete</a>
                                                                                </div>
                                                                            </li>
                                                                        </ul>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="card p-2 border mb-2">
                                                                <div className="d-flex align-items-center">
                                                                    <div className="avatar-sm me-3 ms-0">
                                                                        <div className="avatar-title bg-primary-subtle text-primary rounded font-size-20">
                                                                            <i className="ri-image-fill"></i>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex-grow-1">
                                                                        <div className="text-start">
                                                                            <h5 className="font-size-14 mb-1">Image-2.jpg</h5>
                                                                            <p className="text-muted font-size-13 mb-0">3.1 MB</p>
                                                                        </div>
                                                                    </div>

                                                                    <div className="ms-4 me-0">
                                                                        <ul className="list-inline mb-0 font-size-18">
                                                                            <li className="list-inline-item">
                                                                                <a href="#" className="text-muted px-1">
                                                                                    <i className="ri-download-2-line"></i>
                                                                                </a>
                                                                            </li>
                                                                            <li className="list-inline-item dropdown">
                                                                                <a className="dropdown-toggle text-muted px-1" href="#" role="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                                                                    <i className="ri-more-fill"></i>
                                                                                </a>
                                                                                <div className="dropdown-menu dropdown-menu-end">
                                                                                    <a className="dropdown-item" href="#">Action</a>
                                                                                    <a className="dropdown-item" href="#">Another action</a>
                                                                                    <div className="dropdown-divider"></div>
                                                                                    <a className="dropdown-item" href="#">Delete</a>
                                                                                </div>
                                                                            </li>
                                                                        </ul>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="card p-2 border mb-2">
                                                                <div className="d-flex align-items-center">
                                                                    <div className="avatar-sm me-3 ms-0">
                                                                        <div className="avatar-title bg-primary-subtle text-primary rounded font-size-20">
                                                                            <i className="ri-file-text-fill"></i>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex-grow-1">
                                                                        <div className="text-start">
                                                                            <h5 className="font-size-14 mb-1">Landing-A.zip</h5>
                                                                            <p className="text-muted font-size-13 mb-0">6.7 MB</p>
                                                                        </div>
                                                                    </div>

                                                                    <div className="ms-4 me-0">
                                                                        <ul className="list-inline mb-0 font-size-18">
                                                                            <li className="list-inline-item">
                                                                                <a href="#" className="text-muted px-1">
                                                                                    <i className="ri-download-2-line"></i>
                                                                                </a>
                                                                            </li>
                                                                            <li className="list-inline-item dropdown">
                                                                                <a className="dropdown-toggle text-muted px-1" href="#" role="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                                                                    <i className="ri-more-fill"></i>
                                                                                </a>
                                                                                <div className="dropdown-menu dropdown-menu-end">
                                                                                    <a className="dropdown-item" href="#">Action</a>
                                                                                    <a className="dropdown-item" href="#">Another action</a>
                                                                                    <div className="dropdown-divider"></div>
                                                                                    <a className="dropdown-item" href="#">Delete</a>
                                                                                </div>
                                                                            </li>
                                                                        </ul>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            {/* width: 0px; height: 0px; */}
                                        </div></div></div></div><div className="simplebar-placeholder" style={{ width: 0, height: 0 }}></div></div><div className="simplebar-track simplebar-horizontal" style={{ visibility: 'hidden' }}><div className="simplebar-scrollbar" style={{ transform: "translate3d(0px, 0px, 0px)", display: "none" }}></div></div><div className="simplebar-track simplebar-vertical" style={{ visibility: 'hidden' }}><div className="simplebar-scrollbar" style={{ transform: "translate3d(0px, 0px, 0px)", display: "none" }}></div></div></div>
                </div>
            </div>

            

            <div className="modal fade" id="videocallModal" tabIndex="-1" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-body">
                            <div className="text-center p-4">
                                <div className="avatar-lg mx-auto mb-4">
                                    <img src="assets/images/users/avatar-4.jpg" alt="" className="img-thumbnail rounded-circle" />
                                </div>

                                <h5 className="text-truncate">Doris Brown</h5>
                                <p className="text-muted mb-0">Start Video Call</p>

                                <div className="mt-5">
                                    <ul className="list-inline mb-1">
                                        <li className="list-inline-item px-2 me-2 ms-0">
                                            <button type="button" className="btn btn-danger avatar-sm rounded-circle" data-bs-dismiss="modal">
                                                <span className="avatar-title bg-transparent font-size-20">
                                                    <i className="ri-close-fill"></i>
                                                </span>
                                            </button>
                                        </li>
                                        <li className="list-inline-item px-2">
                                            <button type="button" className="btn btn-success avatar-sm rounded-circle">
                                                <span className="avatar-title bg-transparent font-size-20">
                                                    <i className="ri-vidicon-fill"></i>
                                                </span>
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="footer-div">
                <footer className="footer">
                    Copyright © 2024 Ring Plus All rights reserved.
                </footer>
            </div>

        </div>
    )
}

export default CallDetails;