import { customFetch } from '@/api/customFetch';
import React from 'react'
import toast from 'react-hot-toast';
const ResetPasswordForm = ({register, handleSubmit, errors, isEditing}) => {

    const onSubmit = async (data) => {
        console.log("Submitted data:", data);
        // Perform any additional actions here
        const response = await customFetch(`password`, "PUT", data);
        console.log("response", response);
        if(!response.success) {
            toast.error(response.message || response.detail);
        }
        else {
            toast.success(response.message);
        }
    }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
        <div className="accordion-body">

            <div className="py-3 forward-phone">
                <div className="d-flex align-items-center">
                    <div className="flex-grow-1 overflow-hidden">
                        <label htmlFor="current_password" className="profile-label">Current Password</label>
                        <input type="password" className="form-control" id="current_password" {...register("current_password")}
                            placeholder="Enter Current Password" name="current_password"   disabled={!isEditing} />
                    </div>
                </div>
                {errors.current_password && <p className="text-danger">{errors.current_password.message}</p>}
            </div>

            <div className="py-3 forward-phone">
                <div className="d-flex align-items-center">
                    <div className="flex-grow-1 overflow-hidden">
                        <label htmlFor="new_password" className="profile-label">New Password</label>
                        <input type="password" className="form-control" id="new_password" {...register("new_password")}
                            placeholder="Enter New Password" name="new_password"  disabled={!isEditing} />
                    </div>
                </div>
                {errors.new_password && <p className="text-danger">{errors.new_password.message}</p>}
            </div>
        


            <div className="py-3 forward-phone">
                <div className="d-flex align-items-center">
                    <div className="flex-grow-1 overflow-hidden">
                        <label htmlFor="confirm_password" className="profile-label">Confirm Password</label>
                        <input type="password" className="form-control" id="confirm_password" {...register("confirm_password")}
                            placeholder="Enter Confirm Password" name="confirm_password"  disabled={!isEditing} />
                    </div>
                </div>
                {errors.confirm_password && <p className="text-danger">{errors.confirm_password.message}</p>}
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

export default ResetPasswordForm