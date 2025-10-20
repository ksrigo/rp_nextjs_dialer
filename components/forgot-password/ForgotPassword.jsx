"use server"
import Link from "next/link"
import ForgotPasswordForm from "@/components/forgot-password/ForgotPasswordForm"

const ForgotPassword = () => {
    return (

        <div className="login-wrapper">
            <div className="login-container">
                <div className="left-section">
                    <h2>Forgot Password</h2>
                    <p>Enter your email to reset your password.</p>
                </div>

                <div className="right-section">
                    <h3 className="mb-4 text-center">Forgot Password</h3>
                    <ForgotPasswordForm />
                    <div className="text-center mt-3">
                        <p>Have an account? <Link href="/login" className="text-decoration-none">Back to Login</Link></p>
                    </div>
                </div>
            </div>
        </div>
        // <>

        
        //     <div className="login-container d-flex align-items-center justify-content-center ">
        //         <div className="login-card d-flex flex-column flex-md-row container-forgot-password">
        //             <div className="left-section p-3">
        //                 <h2 className='left-title'>Forgot Password</h2>
        //                 <p>Enter your email to reset your password.</p>
        //             </div>

        //             <div className="right-section p-3">
        //                 <h3 className="mb-4 right-title-long">Forgot Password</h3>
        //                 <ForgotPasswordForm />
        //             </div>
        //         </div>
        //     </div>
            
        // </>
    )
}

export default ForgotPassword