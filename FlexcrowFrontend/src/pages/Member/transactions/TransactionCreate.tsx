import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import config from '../../../config';

interface Product {
  product_id: string;
  name: string;
  price: number;
  status: 1 | 2;
  type: 1 | 2;
}

interface TransactionFormData {
  customer_id: string;
  type: 1 | 2;
  product_id: string;
  product_number: number;
  shipping_details: string;
  shipping: string;
  shipping_price: string;
  fee_type: 1 | 2 | 3;
}

const TransactionCreate = () => {
  const navigate = useNavigate();
  const [error, setError] = React.useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [username, setUsername] = useState<string>('');
  
  const shippings = ["Thailand Post", "KEX Express", "Flash Express", "J&T Express", "DHL", "FedEx", "GrabExpress", "Lalamove", "Other"];

  const [formData, setFormData] = React.useState<TransactionFormData>({
    customer_id: '',
    type: 1,
    product_id: '',
    product_number: 1,
    shipping: '',
    shipping_price: '',
    shipping_details: '',
    fee_type: 1
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${config.API_URL}/products?page=1&recordPerPage=100`, {
          headers: {
            'Content-Type': 'application/json',
            'token': token || ''
          }
        });
        
        if (!response.ok) {
          setProducts([]);
          return;
        }
  
        const data = await response.json();
        setProducts(data.product_items || []);
      } catch (err) {
        setProducts([]);
        setError('Failed to load products. Please try again.');
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    const authToken = localStorage.getItem('token');
    
    if (!authToken) return;
    
    const fetchUsername = async () => {
      try {
        const response = await fetch(`${config.API_URL}/auth/data`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'token': authToken || '',
          },
        });
  
        if (!response.ok) {
          throw new Error('Failed to verify user');
        }
  
        const data = await response.json();
        setUsername(data.username);
      } catch (error) {
        console.error('Error verifying user:', error);
      }
    };
  
    fetchUsername();
  }, []);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.customer_id) {
      newErrors.customer_id = 'Customer is required';
    } else if (formData.customer_id === username) {
      newErrors.customer_id = 'Customer cannot be you';
    }

    if (!formData.type || (formData.type !== 1 && formData.type !== 2)) {
      newErrors.type = 'Invalid type';
    }

    if (formData.type === 1) {
      if (!formData.shipping) {
        newErrors.shipping = 'Shipping method is required';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    if (!validateForm()) return;
  
    const selectedProduct = products.find(p => p.product_id === formData.product_id);
    if (!selectedProduct) {
      setErrors(prev => ({ ...prev, product_id: 'Product not found' }));
      return;
    }
  
    const productPrice = selectedProduct.price * formData.product_number;
    const shippingPrice = parseFloat(formData.shipping_price) || 0;
    const amount = productPrice + shippingPrice;
  
    let dataFee = 0;
    if (amount > 200) {
      dataFee = amount * 0.08;
    } else if (amount > 100) {
      dataFee = amount * 0.05;
    } else {
      dataFee = amount * 0.02;
    }
  
    const dataToSubmit = {
      ...formData,
      status: 1,
      address_id: '',
      payment_id: '',
      shipping_number: '',
      shipping_image_id: '',
      delivered_details: '',
      fee: dataFee,
      shipping_price: shippingPrice
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
        } else {
          throw new Error(responseData.error || 'Failed to create transaction');
        }
        return;
      }
  
      toast.success('Transaction created successfully');
      navigate('/member/transactions/sell');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create transaction');
    }
  };

  const inputClass = "w-full border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition duration-150";
  const selectClass = "w-full border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition duration-150";

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-4" style={{ background: 'linear-gradient(to right, #0D6577, #0A5666)' }}>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Create New Transaction</h1>
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
                <label className="block text-sm font-medium text-teal-600 mb-2">Customer ID</label>
                <input
                  type="text"
                  value={formData.customer_id}
                  onChange={e => setFormData({ ...formData, customer_id: e.target.value })}
                  className={inputClass}
                  placeholder="Enter customer's ID"
                />
                {errors.customer_id && <p className="text-red-500 text-xs mt-1">{errors.customer_id}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-teal-600 mb-2">Type</label>
                <div className="flex space-x-6 mt-3">
                  <div className="relative flex items-center">
                    <input
                      id="type-physical"
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
                    <label htmlFor="type-physical" className={`ml-2 block text-sm cursor-pointer ${formData.type === 1 ? 'font-medium text-teal-600' : 'text-gray-700'}`}>Physical</label>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      id="type-digital"
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
                    <label htmlFor="type-digital" className={`ml-2 block text-sm cursor-pointer ${formData.type === 2 ? 'font-medium text-teal-600' : 'text-gray-700'}`}>Digital</label>
                  </div>
                </div>
                {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type}</p>}
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Product Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-teal-600 mb-2">Product</label>
                {loadingProducts ? (
                  <div className="w-full p-2 border rounded bg-gray-50 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-teal-500"></div>
                    <span className="ml-2 text-gray-500">Loading products...</span>
                  </div>
                ) : (
                  <>
                    <select
                      value={formData.product_id}
                      onChange={e => setFormData({ ...formData, product_id: e.target.value })}
                      className={selectClass}
                    >
                      <option value="">Select a product</option>
                      {products.map((product) => (
                        <option key={product.product_id} value={product.product_id}>
                          {product.name} - ฿{product.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </option>
                      ))}
                    </select>
                    {products.length === 0 && 
                      <p className="text-yellow-600 text-xs mt-2">
                        No products available. <a href="/member/products/create" className="text-teal-600 underline">Create a product</a> first.
                      </p>
                    }
                  </>
                )}
                {errors.product_id && <p className="text-red-500 text-xs mt-1">{errors.product_id}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-teal-600 mb-2">Quantity</label>
                <input
                  type="number"
                  value={formData.product_number}
                  onChange={e => setFormData({ ...formData, product_number: Number(e.target.value) })}
                  className={inputClass}
                  min="1"
                />
                {errors.product_number && <p className="text-red-500 text-xs mt-1">{errors.product_number}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-teal-600 mb-2">Fee</label>
                <select
                  value={formData.fee_type}
                  onChange={e => setFormData({ ...formData, fee_type: Number(e.target.value) as 1 | 2 | 3 })}
                  className={selectClass}
                >
                  <option value="1">Buyer Pays Fees</option>
                  <option value="2">Seller Pays Fees</option>
                  <option value="3">Split Fees Equally</option>
                </select>
                {errors.fee_type && <p className="text-red-500 text-xs mt-1">{errors.fee_type}</p>}
              </div>
            </div>
          </div>

          {formData.type === 1 && (
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Shipping Information</h2>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-teal-600 mb-2">Shipping Service</label>
                  <select
                    value={formData.shipping}
                    onChange={e => setFormData({ ...formData, shipping: e.target.value })}
                    className={selectClass}
                  >
                    <option value="">Select a shipping service</option>
                    {shippings.map((shipping, index) => (
                      <option key={index} value={shipping}>{shipping}</option>
                    ))}
                  </select>
                  {errors.shipping && <p className="text-red-500 text-xs mt-1">{errors.shipping}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-teal-600 mb-2">Shipping Price</label>
                  <input
                    type="number"
                    value={formData.shipping_price}
                    onChange={e => setFormData({ ...formData, shipping_price: e.target.value })}
                    className={inputClass}
                    step="0.01"
                    placeholder="0.00"
                  />
                  {errors.shipping_price && <p className="text-red-500 text-xs mt-1">{errors.shipping_price}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-teal-600 mb-2">Shipping Details</label>
                <textarea
                  value={formData.shipping_details}
                  onChange={e => setFormData({ ...formData, shipping_details: e.target.value })}
                  className={`${inputClass} h-32 resize-none`}
                  placeholder="Additional shipping instructions or notes"
                />
                {errors.shipping_details && <p className="text-red-500 text-xs mt-1">{errors.shipping_details}</p>}
              </div>

            </div>
          </div>
          )}

          <div className="flex space-x-4 pt-6 border-t">
            <button
              type="submit"
              className="px-6 py-2 bg-[#0d6577] hover:bg-[#0F7A8D] text-white font-medium rounded-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => navigate('/member/transactions/sell')}
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

export default TransactionCreate;