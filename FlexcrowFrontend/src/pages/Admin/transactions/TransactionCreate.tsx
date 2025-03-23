import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Upload, X, Loader2 } from 'lucide-react';
import config from '../../../config';

interface TransactionFormData {
  user_id: string;
  customer_id: string;
  status: 1 | 2 | 3 | 4 | 5 | 6;
  type: 1 | 2;
  product_id: string;
  product_number: number;
  address_id: string;
  payment_id: string;
  shipping: string;
  shipping_price: string;
  shipping_number: string;
  shipping_details: string;
  shipping_image_id: string;
  delivered_at: string;
  delivered_details: string;
  fee: string;
  fee_type: 1 | 2 | 3;
}

interface FileUploadResponse {
  file_id: string;
  cloud_url: string;
}

const TransactionCreate = () => {
  const navigate = useNavigate();
  const [error, setError] = React.useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  
  const shippings = ["Thailand Post", "KEX Express", "Flash Express", "J&T Express", "DHL", "FedEx", "GrabExpress", "Lalamove", "Other"];

  const [formData, setFormData] = React.useState<TransactionFormData>({
    user_id: '',
    customer_id: '',
    status: 1,
    type: 1,
    product_id: '',
    product_number: 1,
    address_id: '',
    payment_id: '',
    shipping: '',
    shipping_price: '',
    shipping_number: '',
    shipping_details: '',
    shipping_image_id: '',
    delivered_at: '',
    delivered_details: '',
    fee: '',
    fee_type: 1
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.user_id) newErrors.user_id = 'User is required';

    if (!formData.customer_id) newErrors.customer_id = 'Customer is required';

    if (formData.customer_id && formData.user_id && formData.user_id == formData.customer_id) newErrors.user_id = 'User and Customer must be different';

    if (!formData.status || (formData.status !== 1 && formData.status !== 2 && formData.status !== 3 && formData.status !== 4 && formData.status !== 5 && formData.status !== 6)) {
      newErrors.status = 'Invalid status';
    }

    if (!formData.type || (formData.type !== 1 && formData.type !== 2)) {
      newErrors.type = 'Invalid type';
    }

    const priceStr = formData.shipping_price as string;
    if (priceStr === '') {
    } else if (!/^(0\.\d{1,2}|[1-9]\d*(\.\d{1,2})?)$/.test(priceStr)) {
      newErrors.shipping_price = 'Invalid price format';
    } else {
      const shippingPrice = parseFloat(priceStr);
      if (shippingPrice < 0.01) {
        newErrors.shipping_price = 'Price must be greater than 0.01';
      }
    }

    const feeStr = formData.fee as string;
    if (feeStr === '') {
    } else if (!/^(0\.\d{1,2}|[1-9]\d*(\.\d{1,2})?)$/.test(feeStr)) {
      newErrors.fee = 'Invalid fee format';
    } else {
      const Fee = parseFloat(feeStr);
      if (Fee < 0.01) {
        newErrors.fee = 'Fee must be greater than 0.01';
      }
    }

    if (!formData.product_id) newErrors.product_id = 'Product is required';

    if (!formData.product_number) {
      newErrors.product_number = 'Product number is required';
    } else if (!Number.isInteger(formData.product_number)) {
      newErrors.product_number = 'Product number must be an integer';
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
        setFormData(prev => ({ ...prev, shipping_image_id: data.file_id }));
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
      setFormData(prev => ({ ...prev, shipping_image_id: '' }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const dataToSubmit = {
      ...formData,
      shipping_price: parseFloat(formData.shipping_price) || 0,
      fee: parseFloat(formData.fee) || 0,
      delivered_at: formData.delivered_at ? new Date(formData.delivered_at).toISOString() : null,
    };

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.API_URL}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': token || ''
        },
        body: JSON.stringify(dataToSubmit)
      });

      const responseData = await response.json();

      if (!response.ok) {
        if (responseData.error === 'user_error' ||
            responseData.error === 'customer_error' ||
            responseData.error === 'product_error' ||
            responseData.error === 'address_error' ||
            responseData.error === 'payment_error'
        ) {
          if (responseData.error === 'user_error') {
            setErrors((prev) => ({ ...prev, user_id: 'User not found' }));
          }

          if (responseData.error === 'customer_error') {
            setErrors((prev) => ({ ...prev, customer_id: 'Customer not found' }));
          }

          if (responseData.error === 'product_error') {
            setErrors((prev) => ({ ...prev, product_id: 'Product not found' }));
          }

          if (responseData.error === 'address_error') {
            setErrors((prev) => ({ ...prev, address_id: 'Address not found' }));
          }

          if (responseData.error === 'payment_error') {
            setErrors((prev) => ({ ...prev, payment_id: 'Payment not found' }));
          }
        } else {
          throw new Error(responseData.error || 'Failed to create transaction');
        }
        return;
      }

      toast.success('Transaction created successfully');
      navigate('/admin/transactions');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create transaction');
    }
  };

  return (
    <>
      <div className="rounded-sm border border-stroke bg-white px-8 py-6 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-6">Create Transaction</h1>
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
            <label className="block mb-2">Customer</label>
            <input
                type="text"
                value={formData.customer_id}
                onChange={e => setFormData({ ...formData, customer_id: e.target.value })}
                className="w-full border p-2 rounded"
            />
            {errors.customer_id && <p className="text-red-500 text-sm mt-2">{errors.customer_id}</p>}
          </div>

          <div>
            <label className="block mb-2">Status</label>
            <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: Number(e.target.value) as 1 | 2 | 3 | 4 | 5 })}
                className="w-full border p-2 rounded"
            >
                <option value="1">Pending</option>
                <option value="2">Processing</option>
                <option value="3">Completed</option>
                <option value="4">Canceled</option>
                <option value="5">Rejected</option>
                <option value="6">Disputed</option>
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
                <option value="1">Physical</option>
                <option value="2">Digital</option>
            </select>
            {errors.type && <p className="text-red-500 text-sm mt-2">{errors.type}</p>}
          </div>

          <div>
            <label className="block mb-2">Product</label>
            <input
                type="text"
                value={formData.product_id}
                onChange={e => setFormData({ ...formData, product_id: e.target.value })}
                className="w-full border p-2 rounded"
            />
            {errors.product_id && <p className="text-red-500 text-sm mt-2">{errors.product_id}</p>}
          </div>

          <div>
            <label className="block mb-2">Product Number</label>
            <input
              type="number"
              value={formData.product_number}
              onChange={e => setFormData({ ...formData, product_number: Number(e.target.value) })}
              className="w-full border p-2 rounded"
            />
            {errors.product_number && <p className="text-red-500 text-sm mt-2">{errors.product_number}</p>}
          </div>

          <div>
            <label className="block mb-2">Address</label>
            <input
                type="text"
                value={formData.address_id}
                onChange={e => setFormData({ ...formData, address_id: e.target.value })}
                className="w-full border p-2 rounded"
            />
            {errors.address_id && <p className="text-red-500 text-sm mt-2">{errors.address_id}</p>}
          </div>

          <div>
            <label className="block mb-2">Payment</label>
            <input
                type="text"
                value={formData.payment_id}
                onChange={e => setFormData({ ...formData, payment_id: e.target.value })}
                className="w-full border p-2 rounded"
            />
            {errors.payment_id && <p className="text-red-500 text-sm mt-2">{errors.payment_id}</p>}
          </div>

          <div>
            <label className="block mb-2">Shipping</label>
            <select
              value={formData.shipping}
              onChange={e => setFormData({ ...formData, shipping: e.target.value })}
              className="w-full border p-2 rounded"
            >
              <option value="">Select a shipping</option>
              {shippings.map((shipping, index) => (
                <option key={index} value={shipping}>{shipping}</option>
              ))}
            </select>
            {errors.country && <p className="text-red-500 text-sm mt-2">{errors.country}</p>}
          </div>

          <div>
            <label className="block mb-2">Shipping Price</label>
            <input
                type="number"
                value={formData.shipping_price}
                onChange={e => setFormData({ ...formData, shipping_price: e.target.value })}
                className="w-full border p-2 rounded"
                step="0.01"
            />
            {errors.shipping_price && <p className="text-red-500 text-sm mt-2">{errors.shipping_price}</p>}
          </div>

          <div>
            <label className="block mb-2">Shipping Number</label>
            <input
              type="text"
              value={formData.shipping_number}
              onChange={e => setFormData({ ...formData, shipping_number: e.target.value })}
              className="w-full border p-2 rounded"
            />
            {errors.shipping_number && <p className="text-red-500 text-sm mt-2">{errors.shipping_number}</p>}
          </div>

          <div>
            <label className="block mb-2">Shipping Details</label>
            <textarea
              value={formData.shipping_details}
              onChange={e => setFormData({ ...formData, shipping_details: e.target.value })}
              className="w-full border p-2 rounded h-32 resize-none"
            />
            {errors.shipping_details && <p className="text-red-500 text-sm mt-2">{errors.shipping_details}</p>}
          </div>

          <div>
            <label className="block mb-2">Shipping Image</label>
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
                      className="w-full h-full rounded object-cover"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteImage();
                      }}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
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

          <div>
            <label className="block mb-2">Delivered</label>
            <input
              type="datetime-local"
              value={formData.delivered_at}
              onChange={e => setFormData({ ...formData, delivered_at: e.target.value })}
              className="w-full border p-2 rounded"
            />
            {errors.delivered_at && <p className="text-red-500 text-sm mt-2">{errors.delivered_at}</p>}
          </div>

          <div>
            <label className="block mb-2">Delivered Details</label>
            <textarea
              value={formData.delivered_details}
              onChange={e => setFormData({ ...formData, delivered_details: e.target.value })}
              className="w-full border p-2 rounded h-32 resize-none"
            />
            {errors.delivered_details && <p className="text-red-500 text-sm mt-2">{errors.delivered_details}</p>}
          </div>

          <div>
            <label className="block mb-2">Fee</label>
            <input
                type="number"
                value={formData.fee}
                onChange={e => setFormData({ ...formData, fee: e.target.value })}
                className="w-full border p-2 rounded"
                step="0.01"
            />
            {errors.fee && <p className="text-red-500 text-sm mt-2">{errors.fee}</p>}
          </div>

          <div>
            <label className="block mb-2">Fee Type</label>
            <select
                value={formData.fee_type}
                onChange={e => setFormData({ ...formData, fee_type: Number(e.target.value) as 1 | 2 | 3 })}
                className="w-full border p-2 rounded"
            >
                <option value="1">Buyer</option>
                <option value="2">Seller</option>
                <option value="3">Split Fees Equally</option>
            </select>
            {errors.fee_type && <p className="text-red-500 text-sm mt-2">{errors.fee_type}</p>}
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
              onClick={() => navigate('/admin/transactions')}
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

export default TransactionCreate;