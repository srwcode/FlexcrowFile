import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Upload, X, Loader2, Video } from 'lucide-react';
import config from '../../../config';

interface ProductFormData {
  user_id: string;
  name: string;
  status: 1 | 2;
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
    user_id: '',
    name: '',
    status: 1,
    type: 1,
    description: '',
    price: '',
    image_id: [],
    video_id: ''
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.user_id) newErrors.user_id = 'User is required';

    if (!formData.name) newErrors.name = 'Name is required';
    else if (formData.name.length < 2 || formData.name.length > 100) {
      newErrors.name = 'Name must be 2-100 characters';
    }

    if (!formData.status || (formData.status !== 1 && formData.status !== 2)) {
      newErrors.status = 'Status must be Active or Inactive';
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
      navigate('/admin/products');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create product');
    }
  };

  return (
    <>
      <div className="rounded-sm border border-stroke bg-white px-8 py-6 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-6">Create Product</h1>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
            <label className="block mb-2">User</label>
            <input
                type="text"
                value={formData.user_id}
                onChange={e => setFormData({ ...formData, user_id: e.target.value })}
                className="w-full border p-2 rounded"
            />
            {errors.user_id && <p className="text-red-500 text-sm mt-2">{errors.user_id}</p>}
          </div>

          <div>
            <label className="block mb-2">Name</label>
            <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full border p-2 rounded"
            />
            {errors.name && <p className="text-red-500 text-sm mt-2">{errors.name}</p>}
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
            <label className="block mb-2">Type</label>
            <select
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: Number(e.target.value) as 1 | 2 })}
                className="w-full border p-2 rounded"
            >
                <option value="1">New</option>
                <option value="2">Used</option>
            </select>
            {errors.type && <p className="text-red-500 text-sm mt-2">{errors.type}</p>}
          </div>

          <div>
            <label className="block mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full border p-2 rounded h-32 resize-none"
            />
            {errors.description && <p className="text-red-500 text-sm mt-2">{errors.description}</p>}
          </div>

          <div>
            <label className="block mb-2">Price</label>
            <input
                type="number"
                value={formData.price}
                onChange={e => setFormData({ ...formData, price: e.target.value })}
                className="w-full border p-2 rounded"
                step="0.01"
            />
            {errors.price && <p className="text-red-500 text-sm mt-2">{errors.price}</p>}
          </div>

          <div>
            <label className="block mb-2">Images</label>
            <div
              className={`relative border-2 border-dashed rounded-lg transition-all cursor-pointer px-8 py-8
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
                multiple
                className="hidden"
              />
              
              {uploading ? (
                <div className="text-center space-y-3">
                  <Loader2 className="w-12 h-12 mx-auto animate-spin text-blue-500" />
                  <p className="text-blue-500 font-medium">Uploading...</p>
                  <p className="text-sm text-gray-500">This may take a moment</p>
                </div>
              ) : images.length > 0 ? (
                <div className="grid grid-cols-3 gap-4 p-4">
                  {images.map((image, index) => (
                    <div key={image.id} className="relative">
                      <img 
                        src={image.url} 
                        alt={`Product ${index + 1}`} 
                        className="w-24 h-24 rounded object-cover"
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
                    <Upload className="w-10 h-10 text-gray-400" />
                  </div>
                  <div className="mt-4">
                    <p className="text-gray-700 font-medium">Drop image here</p>
                    <p className="text-sm text-gray-500 mt-1">or click to browse</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block mb-2">Video</label>
            <div
              className={`relative border-2 border-dashed rounded-lg transition-all cursor-pointer px-8 py-8
                ${isDraggingVideo 
                  ? 'border-gray-400 bg-gray-50' 
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
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
                  <Loader2 className="w-12 h-12 mx-auto animate-spin text-blue-500" />
                  <p className="text-blue-500 font-medium">Uploading...</p>
                  <p className="text-sm text-gray-500">This may take a moment</p>
                </div>
              ) : video ? (
                <div className="relative w-full h-full p-4">
                  <video 
                    src={video.url}
                    className="w-full h-full object-contain"
                    controls
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVideoDelete();
                    }}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <div className="flex items-center justify-center">
                    <Video className="w-10 h-10 text-gray-400" />
                  </div>
                  <div className="mt-4">
                    <p className="text-gray-700 font-medium">Drop video here</p>
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
              onClick={() => navigate('/admin/products')}
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

export default ProductCreate;