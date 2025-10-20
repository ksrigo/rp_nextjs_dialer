"use server"
import Copyright from "../shared/Copyright"
import LeftSidePanel from "../shared/LeftSidePanel"
import Link from "next/link"
import ForgotPasswordForm from "./ForgotPasswordForm"

const ForgotPassword = () => {
    return (
        <>
            <Copyright />
            <div className="login-container">
                <div className="row">
                   <LeftSidePanel />
                    <div className="col-12 pb-2">
                       <ForgotPasswordForm />
                    </div>
                    <div className="col-12 pb-2 text-center">
                        <div className="p-2">
                            <p><Link href="/login">Login Here</Link></p>
                        </div>  
                    </div>
                   
                </div>
            </div>
        </>
    )
}

export default ForgotPassword