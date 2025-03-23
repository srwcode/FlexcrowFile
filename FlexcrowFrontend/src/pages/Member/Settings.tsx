import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Upload, X, Loader2, User, Mail, Phone, MapPin, Lock } from 'lucide-react';
import config from '../../config';

interface UserFormData {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  address_id: string;
  image_id: string;
}

interface PasswordData {
  current_password: string;
  new_password: string;
  confirm_password: string;
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

const UserSettings = () => {
  const [userID, setUserID] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [activeTab, setActiveTab] = useState('profile');

  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    address_id: '',
    image_id: '',
  });

  const [passwordData, setPasswordData] = useState<PasswordData>({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [passwordErrors, setPasswordErrors] = useState<{ [key: string]: string }>({});
  
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    const phoneRegex = /^\+?[0-9]{3,}$/;

    if (!formData.phone) newErrors.phone = 'Phone number is required';
    else if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number format';
    }

    if (!formData.first_name) newErrors.first_name = 'First name is required';
    else if (formData.first_name.length < 2 || formData.first_name.length > 100) {
      newErrors.first_name = 'First name must be 2-100 characters';
    }

    if (!formData.last_name) newErrors.last_name = 'Last name is required';
    else if (formData.last_name.length < 2 || formData.last_name.length > 100) {
      newErrors.last_name = 'Last name must be 2-100 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!passwordData.current_password) newErrors.current_password = 'Current password is required';

    if (!passwordData.new_password) newErrors.new_password = 'New password is required';
    else if (passwordData.new_password.length < 6) {
      newErrors.new_password = 'Password must be at least 6 characters';
    }

    if (!passwordData.confirm_password) newErrors.confirm_password = 'Please confirm your new password';
    else if (passwordData.new_password !== passwordData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
    }

    setPasswordErrors(newErrors);
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
      const response = await fetch(`${config.API_URL}/addresses?user_id=${userID}`, {
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

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${config.API_URL}/auth/data`, {
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
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone,
          address_id: data.address_id || '',
          image_id: data.image_id || '',
        });

        setUserID(data.user_id);

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
  }, [userID]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const dataToSubmit = {
      ...formData
    };

    try {
      const token = localStorage.getItem("token");
  
      const response = await fetch(`${config.API_URL}/users/${userID}`, {
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
          setErrors(prev => ({ ...prev, email: 'Email already exists' }));
        } else {
          throw new Error(responseData.error || 'Failed to update user');
        }
        return;
      }
  
      toast.success('Profile updated successfully');
    } catch (err) {
      console.error("Update error:", err);
      setError(err instanceof Error ? err.message : "Failed to update user");
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePasswordForm()) return;

    try {
      const token = localStorage.getItem("token");
  
      const response = await fetch(`${config.API_URL}/users/${userID}/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "token": token || "",
        },
        body: JSON.stringify({
          current_password: passwordData.current_password,
          new_password: passwordData.new_password
        }),
      });
  
      const responseData = await response.json();

      if (!response.ok) {
        if (responseData.error === 'invalid_password') {
          setPasswordErrors(prev => ({ ...prev, current_password: 'Current password is incorrect' }));
        } else {
          throw new Error(responseData.error || 'Failed to update password');
        }
        return;
      }
  
      toast.success('Password updated successfully');
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update password");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-10 h-10 animate-spin text-[#0d6577]" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-4" style={{ background: 'linear-gradient(to right, #0D6577, #0A5666)' }}>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Account Settings</h1>
        </div>
      </div>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center px-6 py-4 font-medium text-sm transition-colors ${
            activeTab === 'profile' 
              ? 'text-[#0d6577] border-b-2 border-[#0d6577]' 
              : 'text-gray-500 hover:text-[#0d6577]'
          }`}
        >
          <User className="w-4 h-4 mr-2" />
          Profile Information
        </button>
        <button
          onClick={() => setActiveTab('password')}
          className={`flex items-center px-6 py-4 font-medium text-sm transition-colors ${
            activeTab === 'password' 
              ? 'text-[#0d6577] border-b-2 border-[#0d6577]' 
              : 'text-gray-500 hover:text-[#0d6577]'
          }`}
        >
          <Lock className="w-4 h-4 mr-2" />
          Password
        </button>
      </div>

      {activeTab === 'profile' && (
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-1/3">
                <div className="mb-4">
                  <label className="block text-gray-600 text-sm font-medium mb-2">Profile Image</label>
                  <div
                    className={`relative border-2 border-dashed rounded-lg transition-all cursor-pointer h-[200px] flex items-center justify-center
                      ${isDragging 
                        ? 'border-[#0d6577] bg-blue-50' 
                        : 'border-gray-300 hover:border-[#0d6577] hover:bg-blue-50'
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
                        <Loader2 className="w-12 h-12 mx-auto animate-spin text-[#0d6577]" />
                        <p className="text-[#0d6577] font-medium">Uploading...</p>
                      </div>
                    ) : imageUrl ? (
                      <div className="space-y-4">
                        <div className="relative w-32 h-32 mx-auto">
                          <img 
                            src={imageUrl} 
                            alt="Profile" 
                            className="w-full h-full rounded-full object-cover border-2 border-[#0d6577]"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteImage();
                            }}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-md"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 text-center">Click to change image</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="flex items-center justify-center">
                          <Upload className="w-10 h-10 text-[#0d6577] opacity-70" />
                        </div>
                        <div className="mt-4">
                          <p className="text-gray-700 font-medium">Drop file here</p>
                          <p className="text-sm text-gray-500 mt-1.5">or click to browse</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="w-full md:w-2/3 space-y-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="w-full md:w-1/2">
                    <label className="block text-gray-600 text-sm font-medium mb-2">Username</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={formData.username}
                        className="w-full border border-gray-300 rounded-md py-2 pl-10 pr-3 bg-gray-100 text-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent cursor-not-allowed"
                        readOnly
                      />
                    </div>
                  </div>
                  
                  <div className="w-full md:w-1/2">
                    <label className="block text-gray-600 text-sm font-medium mb-2">Email</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className="w-full border border-gray-300 rounded-md py-2 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                    {errors.email && <p className="text-red-500 text-xs mt-1.5">{errors.email}</p>}
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                  <div className="w-full md:w-1/2">
                    <label className="block text-gray-600 text-sm font-medium mb-2">First Name</label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                      className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                    {errors.first_name && <p className="text-red-500 text-xs mt-1.5">{errors.first_name}</p>}
                  </div>
                  
                  <div className="w-full md:w-1/2">
                    <label className="block text-gray-600 text-sm font-medium mb-2">Last Name</label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                      className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                    {errors.last_name && <p className="text-red-500 text-xs mt-1.5">{errors.last_name}</p>}
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                  <div className="w-full md:w-1/2">
                    <label className="block text-gray-600 text-sm font-medium mb-2">Phone</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full border border-gray-300 rounded-md py-2 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                    {errors.phone && <p className="text-red-500 text-xs mt-1.5">{errors.phone}</p>}
                  </div>
                  
                  <div className="w-full md:w-1/2">
                    <label className="block text-gray-600 text-sm font-medium mb-2">Main Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MapPin className="h-5 w-5 text-gray-400" />
                      </div>
                      <select
                        value={formData.address_id}
                        onChange={e => setFormData({ ...formData, address_id: e.target.value })}
                        className="w-full border border-gray-300 rounded-md py-2 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none"
                      >
                        <option value="">Select an address</option>
                        {addresses.map(address => (
                          <option key={address.address_id} value={address.address_id}>
                            {address.name}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#0d6577] hover:bg-[#0F7A8D] text-white font-medium rounded-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'password' && (
        <div className="p-6">
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-600 text-sm font-medium mb-2">Current Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={passwordData.current_password}
                  onChange={e => setPasswordData({ ...passwordData, current_password: e.target.value })}
                  className="w-full border border-gray-300 rounded-md py-2 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Enter your current password"
                />
              </div>
              {passwordErrors.current_password && <p className="text-red-500 text-xs mt-1.5">{passwordErrors.current_password}</p>}
            </div>
            
            <div>
              <label className="block text-gray-600 text-sm font-medium mb-2">New Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={passwordData.new_password}
                  onChange={e => setPasswordData({ ...passwordData, new_password: e.target.value })}
                  className="w-full border border-gray-300 rounded-md py-2 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Enter your new password"
                />
              </div>
              {passwordErrors.new_password && <p className="text-red-500 text-xs mt-1.5">{passwordErrors.new_password}</p>}
            </div>
            
            <div>
              <label className="block text-gray-600 text-sm font-medium mb-2">Confirm New Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={passwordData.confirm_password}
                  onChange={e => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                  className="w-full border border-gray-300 rounded-md py-2 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Confirm your new password"
                />
              </div>
              {passwordErrors.confirm_password && <p className="text-red-500 text-xs mt-1.5">{passwordErrors.confirm_password}</p>}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 mt-2 bg-[#0d6577] hover:bg-[#0F7A8D] text-white font-medium rounded-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
              >
                Update Password
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default UserSettings;