import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Upload, X, Loader2 } from 'lucide-react';
import config from '../../../config';

interface UserFormData {
  username: string;
  email: string;
  user_type: 'ADMIN' | 'USER';
  status: 1 | 2;
  first_name: string;
  last_name: string;
  phone: string;
  balance: string;
  password: string;
  address_id: string;
  image_id: string;
}

interface Address {
  address_id: string;
  name: string;
  user_id: string;
}

interface FileUploadResponse {
  file_id: string;
  cloud_url: string;
}

const UserEdit = () => {
  const { user_id } = useParams<{ user_id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);

  const [formData, setFormData] = React.useState<UserFormData>({
    username: '',
    email: '',
    user_type: 'USER',
    status: 1,
    first_name: '',
    last_name: '',
    phone: '',
    balance: '',
    password: '',
    address_id: '',
    image_id: '',
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

    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    const balanceStr = formData.balance as string;
    if (balanceStr === '') {
    } else if (!/^(0\.\d{1,2}|[1-9]\d*(\.\d{1,2})?)$/.test(balanceStr)) {
      newErrors.balance = 'Invalid balance format';
    } else {
      const balance = parseFloat(balanceStr);
      if (balance < 0.01) {
        newErrors.balance = 'Balance must be greater than 0.01';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.API_URL}/upload`, {
        method: 'POST',
        headers: {
          'token': token || '',
        },
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data: FileUploadResponse = await response.json();
      setFormData(prev => ({ ...prev, image_id: data.file_id }));
      setImageUrl(data.cloud_url);
    } catch (err) {
      toast.error('Failed to upload image');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async () => {
    setImageUrl('');
    setFormData(prev => ({ ...prev, image_id: '' }));
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  const fetchAddresses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.API_URL}/addresses?user_id=${user_id}`, {
        headers: {
          'Content-Type': 'application/json',
          'token': token || ''
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch addresses');
      
      const data = await response.json();
      if (data && Array.isArray(data.address_items)) {
        setAddresses(data.address_items);
      } else {
        setAddresses([]);
      }
    } catch (err) {
      console.error('Error fetching addresses:', err);
      toast.error('Failed to load addresses');
      setAddresses([]);
    }
  };

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${config.API_URL}/users/${user_id}`, {
          headers: {
            'Content-Type': 'application/json',
            'token': token || ''
          }
        });
        if (!response.ok) throw new Error('Failed to fetch user');
        const data = await response.json();
        
        setFormData({
          username: data.username,
          email: data.email,
          user_type: data.user_type,
          status: data.status,
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone,
          balance: data.balance || '',
          password: '',
          address_id: data.address_id || '',
          image_id: data.image_id || '',
        });

        if (data.image_id) {
          const fileResponse = await fetch(`${config.API_URL}/files/${data.image_id}`, {
            headers: {
              'token': token || ''
            }
          });
          if (fileResponse.ok) {
            const fileData = await fileResponse.json();
            setImageUrl(fileData.cloud_url);
          }
        }

        await fetchAddresses();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load user');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [user_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const dataToSubmit = {
      ...formData,
      balance: parseFloat(formData.balance) || 0
    };

    try {
      const token = localStorage.getItem("token");
  
      const response = await fetch(`${config.API_URL}/users/${user_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "token": token || "",
        },
        body: JSON.stringify(dataToSubmit),
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
  
      toast.success('User updated successfully');
    } catch (err) {
      console.error("Update error:", err);
      setError(err instanceof Error ? err.message : "Failed to update user");
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <>
      <div className="rounded-sm border border-stroke bg-white px-8 py-6 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-6">Edit User</h1>
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
            <label className="block mb-2">Balance</label>
            <input
                type="number"
                value={formData.balance}
                onChange={e => setFormData({ ...formData, balance: e.target.value })}
                className="w-full border p-2 rounded"
                step="0.01"
            />
            {errors.balance && <p className="text-red-500 text-sm mt-2">{errors.balance}</p>}
          </div>

          <div>
            <label className="block mb-2">Address</label>
            <select
              value={formData.address_id}
              onChange={e => setFormData({ ...formData, address_id: e.target.value })}
              className="w-full border p-2 rounded"
            >
              <option value="">Select an address</option>
              {addresses.map(address => (
                <option key={address.address_id} value={address.address_id}>
                  {address.name}
                </option>
              ))}
            </select>
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

          <div>
            <label className="block mb-2">Profile image</label>
            <div
              className={`relative border-2 border-dashed rounded-lg transition-all cursor-pointer h-[200px] flex items-center justify-center
                ${isDragging 
                  ? 'border-gray-400 bg-gray-50' 
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
              onClick={handleClickUpload}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInput}
                accept="image/*"
                className="hidden"
              />
              
              {uploading ? (
                <div className="text-center space-y-3">
                  <Loader2 className="w-12 h-12 mx-auto animate-spin text-blue-500" />
                  <p className="text-blue-500 font-medium">Uploading...</p>
                  <p className="text-sm text-gray-500">This may take a moment</p>
                </div>
              ) : imageUrl ? (
                <div className="space-y-4">
                  <div className="relative w-32 h-32 mx-auto">
                    <img 
                      src={imageUrl} 
                      alt="Profile" 
                      className="w-full h-full rounded-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteImage();
                      }}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="flex items-center justify-center">
                    <Upload className="w-10 h-10 text-gray-400" />
                  </div>
                  <div className="mt-4">
                    <p className="text-gray-700 font-medium">Drop file here</p>
                    <p className="text-sm text-gray-500 mt-1">or click to browse</p>
                  </div>
                </div>
              )}
            </div>
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

export default UserEdit;