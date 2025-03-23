import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Upload, X, Loader2, Video } from 'lucide-react';
import config from '../../../config';

interface ProductFormData {
  name: string;
  type: 1 | 2;
  description: string;
  price: string;
  image_id: string[];
  video_id: string;
}

interface FileUploadResponse {
  file_id: string;
  cloud_url: string;
}

interface ImageData {
  id: string;
  url: string;
}

interface VideoData {
  id: string;
  url: string;
}

const ProductCreate = () => {
  const navigate = useNavigate();
  const [error, setError] = React.useState<string | null>(null);
  const [images, setImages] = useState<ImageData[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [video, setVideo] = useState<VideoData | null>(null);
  const [isDraggingVideo, setIsDraggingVideo] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = React.useState<ProductFormData>({
    name: '',
    type: 1,
    description: '',
    price: '',
    image_id: [],
    video_id: ''
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name) newErrors.name = 'Name is required';
    else if (formData.name.length < 2 || formData.name.length > 100) {
      newErrors.name = 'Name must be 2-100 characters';
    }

    if (!formData.type || (formData.type !== 1 && formData.type !== 2)) {
      newErrors.type = 'Type must be New or Used';
    }

    if (formData.description.length > 1000) {
      newErrors.description = 'Description must not exceed 1,000 characters';
    }

    const priceStr = formData.price as string;
    if (priceStr === '') {
      newErrors.price = 'Price is required';
    } else if (!/^(0\.\d{1,2}|[1-9]\d*(\.\d{1,2})?)$/.test(priceStr)) {
      newErrors.price = 'Invalid price format';
    } else {
      const price = parseFloat(priceStr);
      if (price < 1) {
        newErrors.price = 'Price must be greater than 1';
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
      const newImage = { id: data.file_id, url: data.cloud_url };
      
      setImages(prev => [...prev, newImage]);
      setFormData(prev => ({
        ...prev,
        image_id: [...prev.image_id, data.file_id]
      }));
    } catch (err) {
      toast.error('Failed to upload image');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
    setFormData(prev => ({
      ...prev,
      image_id: prev.image_id.filter(id => id !== imageId)
    }));
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
    files.forEach(file => handleFileUpload(file));
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => handleFileUpload(file));
    }
  };

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  const handleVideoUpload = async (file: File) => {
    if (!file.type.startsWith('video/')) {
      toast.error('Please upload a video file');
      return;
    }

    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('Video size must be less than 100MB');
      return;
    }

    setUploadingVideo(true);
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
      const newVideo = { id: data.file_id, url: data.cloud_url };
      
      setVideo(newVideo);
      setFormData(prev => ({
        ...prev,
        video_id: data.file_id
      }));
    } catch (err) {
      toast.error('Failed to upload video');
      console.error('Upload error:', err);
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleVideoDelete = () => {
    setVideo(null);
    setFormData(prev => ({
      ...prev,
      video_id: ''
    }));
  };

  const handleVideoDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingVideo(true);
  };

  const handleVideoDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingVideo(false);
  };

  const handleVideoDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleVideoDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingVideo(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleVideoUpload(files[0]);
    }
  };

  const handleVideoInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleVideoUpload(files[0]);
    }
  };

  const handleClickVideoUpload = () => {
    videoInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const dataToSubmit = {
      ...formData,
      status: 1,
      price: parseFloat(formData.price) || 0
    };

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.API_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': token || ''
        },
        body: JSON.stringify(dataToSubmit)
      });

      const responseData = await response.json();

      if (!response.ok) {
        if (responseData.error === 'user_error') {
          setErrors((prev) => ({ ...prev, user_id: 'User not found' }));
        } else {
          throw new Error(responseData.error || 'Failed to create product');
        }
        return;
      }

      toast.success('Product created successfully');
      navigate('/member/products');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create product');
    }
  };

  const inputClass = "w-full border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition duration-150";

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-4" style={{ background: 'linear-gradient(to right, #0D6577, #0A5666)' }}>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Create New Product</h1>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mx-6 my-4 rounded shadow">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">Error: {error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="p-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-teal-600 mb-2">Product Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className={inputClass}
                  placeholder="Enter product name"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-teal-600 mb-2">Type</label>
                <div className="flex space-x-6 mt-3">
                  <div className="relative flex items-center">
                    <input
                      id="type-new"
                      type="radio"
                      name="type"
                      checked={formData.type === 1}
                      onChange={() => setFormData({ ...formData, type: 1 })}
                      className="sr-only"
                    />
                    <span className={`flex items-center justify-center w-5 h-5 rounded-full border ${formData.type === 1 ? 'border-teal-600' : 'border-gray-400'}`}>
                      {formData.type === 1 && (
                        <span className="w-3 h-3 rounded-full bg-teal-600"></span>
                      )}
                    </span>
                    <label htmlFor="type-new" className={`ml-2 block text-sm cursor-pointer ${formData.type === 1 ? 'font-medium text-teal-600' : 'text-gray-700'}`}>New</label>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      id="type-used"
                      type="radio"
                      name="type"
                      checked={formData.type === 2}
                      onChange={() => setFormData({ ...formData, type: 2 })}
                      className="sr-only"
                    />
                    <span className={`flex items-center justify-center w-5 h-5 rounded-full border ${formData.type === 2 ? 'border-teal-600' : 'border-gray-400'}`}>
                      {formData.type === 2 && (
                        <span className="w-3 h-3 rounded-full bg-teal-600"></span>
                      )}
                    </span>
                    <label htmlFor="type-used" className={`ml-2 block text-sm cursor-pointer ${formData.type === 2 ? 'font-medium text-teal-600' : 'text-gray-700'}`}>Used</label>
                  </div>
                </div>
                {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type}</p>}
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Product Details</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-teal-600 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className={`${inputClass} h-32 resize-none`}
                  placeholder="Describe your product"
                ></textarea>
                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-teal-600 mb-2">Price</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={e => setFormData({ ...formData, price: e.target.value })}
                  className={inputClass}
                  placeholder="0.00"
                  step="0.01"
                />
                {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Media</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-teal-600 mb-2">Product Images</label>
                <div
                  className={`relative border-2 border-dashed rounded-md transition-all cursor-pointer p-6
                    ${isDragging 
                      ? 'border-teal-400 bg-teal-50' 
                      : 'border-gray-300 hover:border-teal-400 hover:bg-teal-50'
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
                    multiple
                    className="hidden"
                  />
                  
                  {uploading ? (
                    <div className="text-center space-y-3">
                      <Loader2 className="w-10 h-10 mx-auto animate-spin text-teal-500" />
                      <p className="text-teal-600 font-medium">Uploading...</p>
                      <p className="text-sm text-gray-500">This may take a moment</p>
                    </div>
                  ) : images.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {images.map((image, index) => (
                        <div key={image.id} className="relative group">
                          <img 
                            src={image.url} 
                            alt={`Product ${index + 1}`} 
                            className="w-full h-36 rounded-md object-cover"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteImage(image.id);
                            }}
                            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="flex items-center justify-center">
                        <Upload className="w-10 h-10 text-teal-400" />
                      </div>
                      <div className="mt-4">
                        <p className="text-teal-600 font-medium">Drop images here</p>
                        <p className="text-sm text-gray-500 mt-1">or click to browse</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-teal-600 mb-2">Product Video (Optional)</label>
                <div
                  className={`relative border-2 border-dashed rounded-md transition-all cursor-pointer p-6
                    ${isDraggingVideo 
                      ? 'border-teal-400 bg-teal-50' 
                      : 'border-gray-300 hover:border-teal-400 hover:bg-teal-50'
                    }`}
                  onClick={handleClickVideoUpload}
                  onDragEnter={handleVideoDragEnter}
                  onDragLeave={handleVideoDragLeave}
                  onDragOver={handleVideoDragOver}
                  onDrop={handleVideoDrop}
                >
                  <input
                    type="file"
                    ref={videoInputRef}
                    onChange={handleVideoInput}
                    accept="video/*"
                    className="hidden"
                  />
                  
                  {uploadingVideo ? (
                    <div className="text-center space-y-3">
                      <Loader2 className="w-10 h-10 mx-auto animate-spin text-teal-500" />
                      <p className="text-teal-600 font-medium">Uploading video...</p>
                      <p className="text-sm text-gray-500 mt-1">This may take several moments</p>
                    </div>
                  ) : video ? (
                    <div className="relative w-fit">
                      <video 
                        src={video.url}
                        className="w-auto h-48 object-contain rounded-md"
                        controls
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVideoDelete();
                        }}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="flex items-center justify-center">
                        <Video className="w-10 h-10 text-teal-400" />
                      </div>
                      <div className="mt-4">
                        <p className="text-teal-600 font-medium">Drop video here</p>
                        <p className="text-sm text-gray-500 mt-1">or click to browse (max 100MB)</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex space-x-4 pt-6 border-t">
            <button
              type="submit"
              className="px-6 py-2 bg-[#0d6577] hover:bg-[#0F7A8D] text-white font-medium rounded-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => navigate('/member/products')}
              className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductCreate;