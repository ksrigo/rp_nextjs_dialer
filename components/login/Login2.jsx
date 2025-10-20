"use client"
import { Eye } from 'lucide-react';
import Head from 'next/head';
import Link from 'next/link';

export default function Login2() {
  return (
    <>
      <Head>
        <title>Login - MyApp</title>
      </Head>

      <div className="login-container d-flex align-items-center justify-content-center vh-100">
        <div className="login-card d-flex">
          {/* Left Section */}
          <div className="left-section">
            <h2 className='left-title'>Welcome back!</h2>
            <p>You can sign in to access your existing account.</p>
          </div>

          {/* Right Section */}
          <div className="right-section">
            <h3 className="mb-4 right-title">Sign In</h3>
            <form>
              {/* <div className="mb-3">
                <input type="text" className="form-control" placeholder="Username or email" />
              </div> */}
              <div className="mb-3">
                <div className="input-group">
                    <span className="input-group-text">
                        < i className="ri-mail-line"></i>
                    </span>
                    <input type="email" className="form-control" placeholder="Username" />
                </div>
            </div>
              <div className="mb-3">
                <div className="input-group">
                    <span className="input-group-text">
                        <i className="ri-lock-fill"></i> 
                    </span>
                    <input type="password" className="form-control" placeholder="Password" />
                </div>
            </div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                {/* <div>
                  <input type="checkbox" id="rememberMe" />
                  <label htmlFor="rememberMe" className="ms-2">Remember me</label>
                </div> */}
                <Link href="#">Forgot password?</Link>
              </div>
              <button type="submit" className="btn btn-primary w-100">Sign In</button>
            </form>
            {/* <p className="mt-3 text-center">
              New here? <Link href="#">Create an Account</Link>
            </p> */}
          </div>
        </div>
      </div>

    </>
  );
}
