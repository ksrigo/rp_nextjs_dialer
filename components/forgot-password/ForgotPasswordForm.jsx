"use client"
import { useRouter } from 'next/navigation';
import React, { useState } from 'react'
import toast from 'react-hot-toast';
import { forgotPassword } from '@/services/auth';
import { z } from 'zod';


const ForgotPasswordForm = () => {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});


  const [data, setData] = useState({ email: '' });

  // Yod (Zod) validation schema
  const schema = z.object({
    email: z.string({ required_error: 'Email is required' })
            .min(1, 'Email is required')
            .email('Please enter a valid email'),
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData({ ...data, [name]: value });
    if (fieldErrors[name]) {
      const clone = { ...fieldErrors };
      delete clone[name];
      setFieldErrors(clone);
    }
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
      // Validate with Zod before API call
      const parsed = schema.safeParse(data);
      if (!parsed.success) {
        const errs = {};
        parsed.error.issues.forEach(i => {
          if (i.path?.[0]) errs[i.path[0]] = i.message;
        });
        setFieldErrors(errs);
        setIsLoading(false);
        toast.error(Object.values(errs)[0] || 'Invalid form');
        return;
      }

      const response = await forgotPassword(data);
      if(response.success) {
        toast.success(response.message)
      }
      else {
        // console.log("response.detail", response.detail?.[0]);
        toast.error(response.message);
      }
     

    } catch (error) {
      console.error('Login error:', error);
      toast.error('An error occurred. Please try again later.');
      setIsLoading(false);
      setError('An unexpected error occurred');
    }
    finally {
      setIsLoading(false);
      setError(null);
      setData({ email: '' });
    }
  };

  return (
    <>
        {/* <h4 className="login-mobile-title">Forgot Password</h4> */}
        {/* <p className="login-mobile-title"><b>To reset your password please provide your email</b></p> */}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
              <div className="input-group">
                  <span className="input-group-text">
                      <i className="ri-mail-line"></i>
                  </span>
                  <input
                    type="email"
                    id="email"
                    name='email'
                    className={`form-control ${fieldErrors.email ? 'is-invalid' : ''}`}
                    value={data.email}
                    placeholder="Email"
                    onChange={e=>handleChange(e)}
                  />
              </div>
              {fieldErrors.email && (
                <div className="invalid-feedback d-block">{fieldErrors.email}</div>
              )}
          </div>
            {/* <div className="input-group mb-2">
                <input id="email" type="text" className="form-control form-control-lg border-light bg-light-subtle email" placeholder="Enter Your Email Address" aria-label="Enter Your Email Address" aria-describedby="basic-addon3" name='email' onChange={e=>handleChange(e)} />
            </div> */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              {/* <div>
                <input type="checkbox" id="rememberMe" />
                <label htmlFor="rememberMe" className="ms-2">Remember me</label>
              </div> */}
              {/* <Link href="/login">Back t  o Login</Link> */}
            </div>
          <div className="input-group mb-2">
              {/* <button className="btn btn-primary waves-effect waves-light" type="submit">Sign in</button> */}
              <button type="submit" className="btn btn-primary w-100" disabled={isLoading}>
                {isLoading ? 'Please wait...' : 'Reset Password'}
              </button>
          </div>
        </form>
    </>
  )
}

export default ForgotPasswordForm