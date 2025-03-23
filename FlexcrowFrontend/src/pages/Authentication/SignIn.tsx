import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import config from '../../config';

interface FormData {
  email: string;
  password: string;
}

const SignIn = () => {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const authToken = localStorage.getItem('token');
    if (authToken) {
      fetch(`${config.API_URL}/auth/verify`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'token': authToken || ''
        }
      }).then((response) => response.json())
        .then((data) => {
        if (data.user_type === 'USER') {
            navigate('/member');
        } else if (data.user_type === 'ADMIN') {
            navigate('/admin');
        } 
      })
      .catch((error) => {
        console.error('Error fetching user type:', error);
      });
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${config.API_URL}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        if (data.token) {
          localStorage.setItem('token', data.token);

          const responseType = await fetch(`${config.API_URL}/auth/verify`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'token': data.token || ''
            }
          });

          const dataType = await responseType.json();
    
          if (responseType.ok) {
            if (dataType.user_type === 'USER') {
              navigate('/member');
            } else if (dataType.user_type === 'ADMIN') {
              navigate('/admin');
            }
          }
        } else {
          toast.error('Invalid email or password.');
        }
      } else {
        toast.error('Invalid email or password.');
      }
    } catch (err) {
      toast.error('An error occurred during login');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0d6577]/80 to-[#0d6577] p-8 text-white items-center justify-center overflow-hidden h-screen sticky top-0">
        <div className="relative z-10 text-start max-w-lg">
    
          <Link to="/">
            <div className="font-bold text-3xl pb-10 mb-10 text-start border-b border-white/25">
              <span>Flex</span>
              <span className="relative">
                crow
                <span className="absolute -top-0.5 right-0 w-2.5 h-2.5 bg-white rounded-full"></span>
              </span>
            </div>
          </Link>
          
          <h1 className="text-3xl lg:text-4xl font-bold mb-4">Secure Transactions</h1>
          
          <p className="text-lg mb-8 text-white/80">
            Flexcrow provides secure escrow services for buyers and sellers, ensuring safe and seamless transactions every time.
          </p>
          
          <div className="flex flex-col gap-6 mt-8">
            <div className="flex items-center p-4 bg-white/10 rounded-lg backdrop-blur-sm">
              <div className="mr-4 bg-white/20 p-2 rounded-full">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20.25 10.5V6C20.25 5.17157 19.5784 4.5 18.75 4.5H5.25C4.42157 4.5 3.75 5.17157 3.75 6V18C3.75 18.8284 4.42157 19.5 5.25 19.5H9M12 14.25C10.7574 14.25 9.75 13.2426 9.75 12C9.75 10.7574 10.7574 9.75 12 9.75C13.2426 9.75 14.25 10.7574 14.25 12C14.25 13.2426 13.2426 14.25 12 14.25ZM16.5 20.25C17.7426 20.25 18.75 19.2426 18.75 18C18.75 16.7574 17.7426 15.75 16.5 15.75C15.2574 15.75 14.25 16.7574 14.25 18C14.25 19.2426 15.2574 20.25 16.5 20.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="text-left">
                <h3 className="font-medium">Secure Payments</h3>
                <p className="text-sm text-white/70">Funds held safely until delivery</p>
              </div>
            </div>
            
            <div className="flex items-center p-4 bg-white/10 rounded-lg backdrop-blur-sm">
              <div className="mr-4 bg-white/20 p-2 rounded-full">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12.75L11.25 15L15 9.75M12 3V4.5M18.364 5.63604L17.3033 6.6967M21 12H19.5M18.364 18.364L17.3033 17.3033M12 19.5V21M6.6967 17.3033L5.63604 18.364M4.5 12H3M6.6967 6.6967L5.63604 5.63604M15.75 12C15.75 14.0711 14.0711 15.75 12 15.75C9.92893 15.75 8.25 14.0711 8.25 12C8.25 9.92893 9.92893 8.25 12 8.25C14.0711 8.25 15.75 9.92893 15.75 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="text-left">
                <h3 className="font-medium">Transparent Process</h3>
                <p className="text-sm text-white/70">Clear terms and conditions</p>
              </div>
            </div>
            
            <div className="flex items-center p-4 bg-white/10 rounded-lg backdrop-blur-sm">
              <div className="mr-4 bg-white/20 p-2 rounded-full">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15.75 5.25C15.75 3.17893 14.0711 1.5 12 1.5C9.92893 1.5 8.25 3.17893 8.25 5.25C8.25 7.32107 9.92893 9 12 9C14.0711 9 15.75 7.32107 15.75 5.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14.9999 15L17.6965 12.3033C17.8917 12.1082 18.2082 12.1082 18.4034 12.3033L22.5 16.4M5.25 21.75H16.0178C16.4413 21.75 16.75 21.4413 16.75 21.0178C16.75 17.2459 13.7019 14.25 9.93 14.25C7.82971 14.25 5.93164 15.1411 4.75 16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="text-left">
                <h3 className="font-medium">Verified Users</h3>
                <p className="text-sm text-white/70">Trade with confidence</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center p-6 sm:p-12 lg:px-16">
        <div className="max-w-lg w-full mx-auto">

          <Link to="/" className="lg:hidden">
            <div className="text-flexcrow-600 font-bold text-3xl mb-12">
              <span>Flex</span>
              <span className="relative text-gray-500">
                crow
                <span className="absolute -top-0.5 right-0 w-2.5 h-2.5 bg-flexcrow-500 rounded-full"></span>
              </span>
            </div>
          </Link>

          <div className="text-start mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome Back</h2>
            <p className="text-gray-600">Sign in to your Flexcrow account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="name@example.com"
                  className="pl-10 w-full rounded-lg border border-gray-300 bg-white py-3 px-4 text-gray-900 shadow-sm focus:border-[#0d6577] focus:outline-none focus:ring-1 focus:ring-[#0d6577] transition-colors"
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700" htmlFor="password">
                  Password
                </label>
                <Link to="#" className="text-sm font-medium text-[#0d6577] hover:text-[#0d6577]/80">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="pl-10 w-full rounded-lg border border-gray-300 bg-white py-3 px-4 text-gray-900 shadow-sm focus:border-[#0d6577] focus:outline-none focus:ring-1 focus:ring-[#0d6577] transition-colors"
                  onChange={handleChange}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#0d6577] hover:bg-[#0d6577]/90 text-white font-medium py-3 px-4 rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#0d6577] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : (
                <>
                  Sign in <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <div className="text-center mt-4">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link to="/auth/signup" className="font-medium text-[#0d6577] hover:text-[#0d6577]/80">
                  Sign Up
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignIn;