import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Heart, Mail, Phone, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState('email'); // 'email' or 'mobile'
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm();

  const identifier = watch('identifier');

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const result = await login(data.identifier, data.password);
      if (result.success) {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const isEmail = (value) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const isMobile = (value) => {
    return /^\+?[\d\s-()]{10,}$/.test(value);
  };

  const handleIdentifierChange = (e) => {
    const value = e.target.value;
    if (isEmail(value)) {
      setLoginMethod('email');
    } else if (isMobile(value)) {
      setLoginMethod('mobile');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center"
          >
            <Heart className="h-8 w-8 text-primary-600" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 text-3xl font-bold text-gray-900"
          >
            Welcome Back
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-2 text-sm text-gray-600"
          >
            Sign in to continue your wellness journey
          </motion.p>
        </div>

        {/* Login Form */}
        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 space-y-6"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="space-y-4">
            {/* Identifier Field */}
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-2">
                {loginMethod === 'email' ? 'Email Address' : 'Mobile Number'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {loginMethod === 'email' ? (
                    <Mail className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Phone className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <input
                  id="identifier"
                  type={loginMethod === 'email' ? 'email' : 'tel'}
                  {...register('identifier', {
                    required: 'Email or mobile number is required',
                    validate: (value) => {
                      if (loginMethod === 'email' && !isEmail(value)) {
                        return 'Please enter a valid email address';
                      }
                      if (loginMethod === 'mobile' && !isMobile(value)) {
                        return 'Please enter a valid mobile number';
                      }
                      return true;
                    }
                  })}
                  onChange={handleIdentifierChange}
                  className={`input-field pl-10 ${errors.identifier ? 'border-red-500' : ''}`}
                  placeholder={loginMethod === 'email' ? 'Enter your email' : 'Enter your mobile number'}
                />
              </div>
              {errors.identifier && (
                <p className="mt-1 text-sm text-red-600">{errors.identifier.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })}
                  className={`input-field pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary flex justify-center items-center py-3 px-4 text-base font-medium"
          >
            {isLoading ? (
              <div className="spinner mr-2"></div>
            ) : null}
            {isLoading ? 'Signing in...' : 'Sign In'}
          </motion.button>

          {/* Links */}
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              <Link
                to="/forgot-password"
                className="font-medium text-primary-600 hover:text-primary-500 transition-colors duration-200"
              >
                Forgot your password?
              </Link>
            </p>
          </div>
        </motion.form>

        {/* Demo Credentials */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 p-4 bg-gray-50 rounded-lg"
        >
          <p className="text-xs text-gray-600 text-center">
            <strong>Demo Account:</strong><br />
            Email: demo@wellness.com<br />
            Password: demo123
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;
