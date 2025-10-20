"use server"
import LoginForm from "@/components/login/LoginForm"
import Link from "next/link"

const Login = () => {
    return (
        <>
            {/* <Copyright /> */}

            {/* <div className="login-container d-flex align-items-center justify-content-center vh-100">
                <div className="login-card d-flex flex-column flex-md-row">
                    <div className="left-section p-3">
                        <h2 className='left-title'>Welcome back!</h2>
                        <p>You can sign in to access your existing account.</p>
                    </div>

                    <div className="right-section p-3">
                        <h3 className="mb-4 right-title">Sign In</h3>
                        <LoginForm />
                    </div>
                </div>
            </div> */}
            <div className="login-wrapper">

            <div className="login-container">
                <div className="left-section">
                    <h2>Welcome back!</h2>
                    <p>You can sign in to access your existing account.</p>
                </div>

                <div className="right-section">
                    <h3 className="mb-4 text-center">Sign In</h3>
                    <LoginForm />
                    <div className="text-center mt-3">
                        <p>New here? <Link href="/login" className="text-decoration-none">Create an Account</Link></p>
                    </div>
                </div>
            </div>
            </div>

            {/* <div className="login-container">
                <div className="row">
                   <LeftSidePanel />
                    <div className="col-12 pb-2">
                       <LoginForm />
                    </div>
                    <div className="col-12 pb-2 text-center">
                        <div className="p-2">
                            <p><Link href="/forgot-password">Forgot Password</Link></p>
                        </div>  
                    </div>
                    <div className="col-12">
                        <QRLogin />
                    </div>
                </div>
            </div> */}
        </>
    )
}

export default Login