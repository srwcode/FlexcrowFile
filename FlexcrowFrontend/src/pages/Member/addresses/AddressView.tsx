import React from 'react';
import { useParams } from 'react-router-dom';
import config from '../../../config';

interface Address {
  address_id: string;
  user_id: string;
  name: string;
  type: 1 | 2;
  full_name: string;
  phone: string;
  address_1: string;
  address_2: string;
  subdistrict: string;
  district: string;
  province: string;
  country: string;
  postal_code: string;
  created_at: string;
  updated_at: string;
}

const AddressView = () => {
  const { address_id } = useParams<{ address_id: string }>();
  const [address, setAddress] = React.useState<Address | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchAddress = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${config.API_URL}/addresses/${address_id}`, {
          headers: {
            'Content-Type': 'application/json',
            'token': token || ''
          }
        });

        if (!response.ok) throw new Error('Failed to fetch address');
        const data = await response.json();
        setAddress(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load address');
      } finally {
        setLoading(false);
      }
    };

    fetchAddress();
  }, [address_id]);

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600"></div>
    </div>
  );
  
  if (error) return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 mx-auto my-8 max-w-2xl rounded shadow">
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
  );
  
  if (!address) return (
    <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mx-auto my-8 max-w-2xl rounded shadow">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-yellow-800">Address not found</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-4" style={{ background: 'linear-gradient(to right, #0D6577, #0A5666)' }}>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Address: {address.name}</h1>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-teal-100 text-teal-800">
            {address.type === 1 ? 'Home' : 'Workplace'}
          </span>
        </div>
      </div>

      <div className="p-6">
        
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-teal-600">Recipient's Name</p>
              <p className="mt-2 font-semibold text-gray-900">{address.full_name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-teal-600">Phone</p>
              <p className="mt-2 font-semibold text-gray-900">{address.phone}</p>
            </div>
          </div>
        </div>

        <div className="mb-2">
          <h2 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Location Details</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1">
              <div>
                <p className="text-sm font-medium text-teal-600">Address 1</p>
                <p className="mt-1 text-gray-900">{address.address_1}</p>
              </div>
            </div>

            {address.address_2 &&
            <div className="grid grid-cols-1">
              <div>
                <p className="text-sm font-medium text-teal-600">Address 2</p>
                <p className="mt-1 text-gray-900">{address.address_2}</p>
              </div>
            </div>
            }
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-teal-600">Subdistrict</p>
                <p className="mt-1 text-gray-900">{address.subdistrict}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-teal-600">District</p>
                <p className="mt-1 text-gray-900">{address.district}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-teal-600">Province</p>
                <p className="mt-1 text-gray-900">{address.province}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-teal-600">Postal Code</p>
                <p className="mt-1 text-gray-900">{address.postal_code}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-teal-600">Country</p>
                <p className="mt-1 text-gray-900">{address.country}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddressView;