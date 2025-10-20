"use client"
import { useRouter } from 'next/navigation';
import { customFetch } from '@/api/customFetch';
import React, { useState } from 'react'
import toast from 'react-hot-toast';
import { setLoginCookie } from '@/lib/handleCookie';
import Link from 'next/link';


const LoginForm = () => {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);


  const [data, setData] = useState({
    username: 'ksrigo@gmail.com',
    password: 'toto1234'
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
      const response = await customFetch("signin","POST",data, true);
      console.log("response22", response);
      if(response.access_token && response.refresh_token) {
        await setLoginCookie(response.access_token, response.refresh_token);
      }
      // const response = await signIn(data);
      
      // if (response.error || response.message === 'Unauthorized') {
      //   const errorMessage = response.message || 'Login failed. Please try again.';
      //   toast.error(errorMessage);
      //   setIsLoading(false);
      //   setError(errorMessage);
      //   return;
      // }

      // // Extract tokens directly from response since customFetch now returns parsed data
      // const { access_token, refresh_token } = response;
      
      // await setUserActiveCookies(access_token, refresh_token);

      toast.success('Login successful!');
      setIsLoading(false);
      setIsSuccess(true);
      setError(null);
      router.push('/');
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An error occurred. Please try again later.');
      setIsLoading(false);
      setError('An unexpected error occurred');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
        <div className="mb-3">
            <div className="input-group">
                <span className="input-group-text">
                    <i className="ri-mail-line"></i>
                </span>
                <input type="email" id="email" name='username' className="form-control" placeholder="Username" onChange={e=>handleChange(e)} />
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