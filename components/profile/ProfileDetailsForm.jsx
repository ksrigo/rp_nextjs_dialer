import toast from 'react-hot-toast';
import { customFetch } from '@/api/customFetch';
import React from 'react'
import { updateProfile } from '@/services/profile';

const ProfileDetailsForm = ({register, handleSubmit, errors, isEditing, setIsEditing}) => {

    const onSubmit = async (data) => {
        const response = await updateProfile(data);
        if(response.success) {
            toast.success(response.message);
        }
        else {
            toast.error(response.message);
        }
        setIsEditing(false);

    }
    
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
        <div className="accordion-body">

            <div className="py-3 forward-phone">
                <div className="d-flex align-items-center">
                    <div className="flex-grow-1 overflow-hidden">
                        <label htmlFor="firstName" className="profile-label">First Name</label>
                        <input type="text" className="form-control" id="firstName" {...register("first_name")}
                            placeholder="Enter First Name" name="first_name"   disabled={!isEditing} />
                    </div>
                </div>
                {errors.first_name && <p className="text-danger">{errors.first_name.message}</p>}
            </div>

            <div className="py-3 forward-phone">
                <div className="d-flex align-items-center">
                    <div className="flex-grow-1 overflow-hidden">
                        <label htmlFor="lastName" className="profile-label">Last Name</label>
                        <input type="text" className="form-control" id="lastName" {...register("last_name")}
                            placeholder="Enter Last Name" name="last_name"  disabled={!isEditing} />
                    </div>
                </div>
                {errors.last_name && <p className="text-danger">{errors.last_name.message}</p>}
            </div>
        


            <div className="py-3 forward-phone">
                <div className="d-flex align-items-center">
                    <div className="flex-grow-1 overflow-hidden">
                        <label htmlFor="phone_nb" className="profile-label">Phone Number</label>
                        <input type="text" className="form-control" id="phone_nb" {...register("phone_nb")}
                            placeholder="Enter Phone Number" name="phone_nb"  disabled={!isEditing} />
                    </div>
                </div>
                {errors.phone_nb && <p className="text-danger">{errors.phone_nb.message}</p>}
            </div>
            <div className="py-3 forward-voicemail">
                <div className="d-flex align-items-center">
                    <div className="flex-grow-1 overflow-hidden">
                        <label htmlFor="email" className="profile-label">Email Address</label>
                        <input type="text" className="form-control" id="email" {...register("email")}
                            placeholder="Enter Email Address" name="email"  disabled={!isEditing} />
                    </div>
                </div>
                {errors.email && <p className="text-danger">{errors.email.message}</p>}
            </div>

            {isEditing && (
            <div className="py-3 forward-voicemail">
                <div className="d-flex align-items-center">
                    <div className="flex-grow-1 overflow-hidden">
                        <button className="btn btn-primary" type="submit">Save</button>
                    </div>
                </div>
            </div>
            )}


        </div>
    </form>
  )
}

export default ProfileDetailsForm