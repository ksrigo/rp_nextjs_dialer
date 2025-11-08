"use client"
import { useRouter } from 'next/navigation';
import React, { useState } from 'react'
import toast from 'react-hot-toast';
import Link from 'next/link';
import { signIn } from 'next-auth/react';

const LoginForm = () => {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);


  const [data, setData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData({ ...data, [name]: value });
  };

  // const signIn = async (data) => {
  //   const response = await customFetch("signin","POST",data, true);
  //   return response;
  // }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn('credentials', { redirect: true, callbackUrl: '/', username: data.email, password: data.password });
      setIsLoading(false);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Logged in successfully');
      setIsSuccess(true);
      setError(null);
      // Redirect handled by NextAuth

    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.message || 'An error occurred. Please try again later.');
      setIsLoading(false);
      setError(error.message || 'An unexpected error occurred');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
        <div className="mb-3">
            <div className="input-group">
                <span className="input-group-text">
                    <i className="ri-mail-line"></i>
                </span>
                <input type="email" id="email" name='email' className="form-control" placeholder="Email" onChange={e=>handleChange(e)} />
            </div>
        </div>

        <div className="mb-3">
            <div className="input-group">
                <span className="input-group-text">
                    <i className="ri-lock-2-line"></i>
                </span>
                <input type="password" id="password" name='password' className="form-control" placeholder="Password" onChange={e=>handleChange(e)} />
            </div>
        </div>

        {/* <div className="input-group mb-2">
            <input id="email" type="text" className="form-control form-control-lg border-light bg-light-subtle email" placeholder="Enter Your Email Address" aria-label="Enter Your Email Address" aria-describedby="basic-addon3" name='username' onChange={e=>handleChange(e)} />
        </div>
        <div className="input-group mb-4">
            <input id="password" type="password" className="form-control form-control-lg border-light bg-light-subtle password" placeholder="Enter Your Password" aria-label="Enter Your Password" aria-describedby="basic-addon3" name='password' onChange={e=>handleChange(e)} />
        </div> */}
        <div className="d-flex justify-content-between align-items-center mb-3">
            {/* <div>
              <input type="checkbox" id="rememberMe" />
              <label htmlFor="rememberMe" className="ms-2">Remember me</label>
            </div> */}
            <Link href="/forgot-password">Forgot password?</Link>
          </div>
        <div className="input-group mb-2">
            {/* <button className="btn btn-primary waves-effect waves-light" type="submit">Sign in</button> */}
            <button type="submit" className="btn btn-primary w-100">Sign In</button>
        </div>
    </form>
  )
}

export default LoginForm