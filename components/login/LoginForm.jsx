"use client"
import { useRouter } from 'next/navigation';
import React, { useState } from 'react'
import toast from 'react-hot-toast';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const LoginForm = () => {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Zod schema: username (email field) and password are required
  const schema = z.object({
    email: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required'),
  });

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' }
  });

  // const signIn = async (data) => {
  //   const response = await customFetch("signin","POST",data, true);
  //   return response;
  // }

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn('credentials', { redirect: true, callbackUrl: '/', email: data.email, password: data.password });
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
    <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-3">
            <div className="input-group">
                <span className="input-group-text">
                    <i className="ri-mail-line"></i>
                </span>
                <input
                  type="text"
                  id="email"
                  className="form-control"
                  placeholder="Username"
                  aria-invalid={!!errors.email}
                  {...register('email')}
                />
            </div>
            {errors.email?.message && (
              <div className="text-danger mt-1">{errors.email.message}</div>
            )}
        </div>

        <div className="mb-3">
            <div className="input-group">
                <span className="input-group-text">
                    <i className="ri-lock-2-line"></i>
                </span>
                <input
                  type="password"
                  id="password"
                  className="form-control"
                  placeholder="Password"
                  aria-invalid={!!errors.password}
                  {...register('password')}
                />
            </div>
            {errors.password?.message && (
              <div className="text-danger mt-1">{errors.password.message}</div>
            )}
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
            <button type="submit" className="btn btn-primary w-100" disabled={isLoading}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
        </div>
    </form>
  )
}

export default LoginForm