'use client';

import DialerTopBar from "@/components/shared/DialerTopBar";
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import ProfileDetailsForm from "@/components/profile/ProfileDetailsForm";
import ResetPassword from "@/components/profile/ResetPassword";
import { useDialer } from "@/app/context/DialerContext";

const Profile = () => {

    const {extensionData, profileData} = useDialer();
 

    const [isEditing, setIsEditing] = useState(false);

    const schema = z.object({
        first_name: z.string().min(1, "First name is required"),
        last_name: z.string().min(1, "Last name is required"),
        phone_nb: z.string().min(10, "Phone number must be at least 10 characters"),
        email: z.string().email("Invalid email format").min(5, "Email must be at least 5 characters"),
    });

    const {register, handleSubmit, formState: {errors}} = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            first_name: profileData?.first_name || '',
            last_name: profileData?.last_name || '',
            phone_nb: profileData?.phone_nb || '',
            email: profileData?.email || ''
        }
    });

    
    // const handleInputChange = (e) => {
    //     setProfileData({
    //         ...profileData,
    //         [e.target.name]: e.target.value
    //     });
    // }

   

    // useEffect(() => {
    //     console.log("profileData", profileData);
    //     setProfileData({
    //         firstName: profileData?.first_name || '',
    //         lastName: profileData?.last_name || '',
    //         phoneNumber: profileData?.phone_nb || '',
    //         email: profileData?.email || ''
    //     });
    // }, []);
    return (
        <>

            <div className="tab-pane h-100" id="pills-setting" role="tabpanel" aria-labelledby="pills-setting-tab">
                    <div>
                      <DialerTopBar />
                        <div className="text-center border-bottom p-2">
                            <div className="mb-4 profile-user">
                                <img src={profileData.avatar || "assets/images/users/avatar-1.jpg"}
                                    className="rounded-circle avatar-lg img-thumbnail" alt="" />
                                <button type="button"
                                    className="btn btn-light bg-light avatar-xs p-0 rounded-circle profile-photo-edit">
                                    <i className="ri-pencil-fill"></i>
                                </button>
                            </div>
                            <h5 className="font-size-16 mb-1 text-truncate">{extensionData?.[0]?.name}</h5>
                            <div className="dropdown d-inline-block mb-1">
                                <a className="text-muted dropdown-toggle pb-1 d-block" href="#" role="button"
                                    data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                    Available <i className="mdi mdi-chevron-down"></i>
                                </a>

                                <div className="dropdown-menu">
                                    <a className="dropdown-item" href="#">Available</a>
                                    <a className="dropdown-item" href="#">Busy</a>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 user-profile-desc overflow-auto" style={{maxHeight: 'calc(100vh - 220px)'}} data-simplebar>
                            <div id="settingprofile" className="accordion">


                                <div className="accordion-item card border mb-2">
                                    <div className="accordion-header" id="privacy1">
                                        <div className="d-flex justify-content-between profile-details-header">
                                            <span className="ms-2 ">Profile Details</span>
                                            <button className="btn btn-primary btn-sm" type="button" onClick={() => setIsEditing(!isEditing)}>
                                                <i className="ri-pencil-fill justify-content-end"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div id="privacy" className="accordion-collapse collapse show"
                                        aria-labelledby="privacy1" data-bs-parent="#settingprofile">
                                           <ProfileDetailsForm register={register} errors={errors} isEditing={isEditing} handleSubmit={handleSubmit} setIsEditing={setIsEditing} />
                                    </div>
                                </div>

                                <ResetPassword />
                              
                            </div>
                        </div>
                    </div>
                </div>
        </>
    );
}

export default Profile;