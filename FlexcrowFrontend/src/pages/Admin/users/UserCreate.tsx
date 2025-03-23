import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import config from '../../../config';

interface UserFormData {
  username: string;
  email: string;
  user_type: 'ADMIN' | 'USER';
  status: 1 | 2;
  first_name: string;
  last_name: string;
  phone: string;
  password: string;
}

const UserCreate = () => {
  const navigate = useNavigate();
  const [error, setError] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState<UserFormData>({
    username: '',
    email: '',
    user_type: 'USER',
    status: 1,
    first_name: '',
    last_name: '',
    phone: '',
    password: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    const usernameRegex = /^[a-zA-Z0-9]+$/;

    if (!formData.username) newErrors.username = 'Username is required';
    else if (formData.username.length < 5 || formData.username.length > 50) {
      newErrors.username = 'Username must be 5-50 characters';
    } else if (!usernameRegex.test(formData.username)) {
      newErrors.username = 'Username can only contain letters (a-z, A-Z) and numbers (0-9)';
    }

    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    const phoneRegex = /^\+?[0-9]{3,}$/;

    if (!formData.phone) newErrors.phone = 'Phone number is required';
    else if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number format';
    }

    if (!formData.user_type || (formData.user_type !== 'ADMIN' && formData.user_type !== 'USER')) {
      newErrors.user_type = 'User type must be ADMIN or USER';
    }

    if (!formData.status || (formData.status !== 1 && formData.status !== 2)) {
      newErrors.status = 'Status must be Active or Inactive';
    }

    if (!formData.first_name) newErrors.first_name = 'First name is required';
    else if (formData.first_name.length < 2 || formData.first_name.length > 100) {
      newErrors.first_name = 'First name must be 2-100 characters';
    }

    if (!formData.last_name) newErrors.last_name = 'Last name is required';
    else if (formData.last_name.length < 2 || formData.last_name.length > 100) {
      newErrors.last_name = 'Last name must be 2-100 characters';
    }

    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.API_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': token || ''
        },
        body: JSON.stringify(formData)
      });

      const responseData = await response.json();

      if (!response.ok) {
        if (responseData.error === 'email_error') {
          setErrors((prev) => ({ ...prev, email: 'Email already exists' }));
        } else if (responseData.error === 'username_error') {
          setErrors((prev) => ({ ...prev, username: 'Username already exists' }));
        } else {
          throw new Error(responseData.error || 'Failed to create user');
        }
        return;
      }

      toast.success('User created successfully');
      navigate('/admin/users');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    }
  };

  return (
    <>
      <div className="rounded-sm border border-stroke bg-white px-8 py-6 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-6">Create User</h1>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
            <label className="block mb-2">Username</label>
            <input
                type="text"
                value={formData.username}
                onChange={e => setFormData({ ...formData, username: e.target.value })}
                className="w-full border p-2 rounded"
            />
            {errors.username && <p className="text-red-500 text-sm mt-2">{errors.username}</p>}
          </div>

          <div>
            <label className="block mb-2">Email</label>
            <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full border px-4 py-2 rounded"
            />
            {errors.email && <p className="text-red-500 text-sm mt-2">{errors.email}</p>}
          </div>

          <div>
            <label className="block mb-2">Role</label>
            <select
                value={formData.user_type}
                onChange={e => setFormData({ ...formData, user_type: e.target.value as 'ADMIN' | 'USER' })}
                className="w-full border p-2 rounded"
            >
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
            </select>
            {errors.user_type && <p className="text-red-500 text-sm mt-2">{errors.user_type}</p>}
          </div>

          <div>
            <label className="block mb-2">Status</label>
            <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: Number(e.target.value) as 1 | 2 })}
                className="w-full border p-2 rounded"
            >
                <option value="1">Active</option>
                <option value="2">Inactive</option>
            </select>
            {errors.status && <p className="text-red-500 text-sm mt-2">{errors.status}</p>}
          </div>

          <div>
            <label className="block mb-2">First Name</label>
            <input
                type="text"
                value={formData.first_name}
                onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full border p-2 rounded"
            />
            {errors.first_name && <p className="text-red-500 text-sm mt-2">{errors.first_name}</p>}
          </div>

          <div>
            <label className="block mb-2">Last Name</label>
            <input
                type="text"
                value={formData.last_name}
                onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full border p-2 rounded"
            />
            {errors.last_name && <p className="text-red-500 text-sm mt-2">{errors.last_name}</p>}
          </div>

          <div>
            <label className="block mb-2">Phone</label>
            <input
                type="tel"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full border p-2 rounded"
            />
            {errors.phone && <p className="text-red-500 text-sm mt-2">{errors.phone}</p>}
          </div>

          <div>
            <label className="block mb-2">Password</label>
            <input
                type="password"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                className="w-full border p-2 rounded"
            />
            {errors.password && <p className="text-red-500 text-sm mt-2">{errors.password}</p>}
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 mt-4 rounded hover:bg-blue-600"
            >
              Submit
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/users')}
              className="bg-gray-500 text-white px-4 py-2 mt-4 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>

        </form>
      </div>
    </>
  );
};

export default UserCreate;