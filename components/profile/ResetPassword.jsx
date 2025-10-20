import { zodResolver } from '@hookform/resolvers/zod';
import React, { useState } from 'react'
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import ResetPasswordForm from '@/components/profile/ResetPasswordForm';

const ResetPassword = () => {

    const [isEditing, setIsEditing] = useState(false);

    const schema = z.object({
        current_password: z.string().min(1, "Current Password is required"),
        new_password: z.string().min(8, "Password must be at least 8 characters"),
        confirm_password: z.string().min(8, "Password must be at least 8 characters"),
    });

    const {register, handleSubmit, formState: {errors}} = useForm({
        resolver: zodResolver(schema),
    });

  


  return (
    <div className="accordion-item card border mb-2">
        <div className="accordion-header" id="privacy1">
            <div className="d-flex justify-content-between profile-details-header">
                <span className="ms-2 ">Reset Password</span>
                <button className="btn btn-primary btn-sm" type="button" onClick={() => setIsEditing(!isEditing)}>
                    <i className="ri-pencil-fill justify-content-end"></i>
                </button>
            </div>
        </div>
        <div id="privacy" className="accordion-collapse collapse show"
            aria-labelledby="privacy1" data-bs-parent="#settingprofile">
            <ResetPasswordForm register={register} handleSubmit={handleSubmit} errors={errors} isEditing={isEditing} />
        </div>
    </div>

  )
}

export default ResetPassword