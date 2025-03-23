import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import config from '../../../config';

interface Address {
  address_id: string;
  user_id: string;
  name: string;
  status: 1 | 2;
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
  const navigate = useNavigate();
  const [address, setAddress] = React.useState<Address | null>(null);
  const [username, setUsername] = useState<string>('');
  const [loadingUsername, setLoadingUsername] = useState<boolean>(false);
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

  useEffect(() => {
    const fetchUsername = async () => {
      const userId = address?.user_id;

      if (userId) {
        setLoadingUsername(true);

        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${config.API_URL}/users/username?user_id=${userId}`, {
            headers: {
              'Content-Type': 'application/json',
              'token': token || ''
            }
          });

          if (!response.ok) {
            throw new Error('Failed to fetch username');
          }

          const data = await response.json();
          setUsername(data.username);
        } catch (error) {
          console.error('Error fetching username:', error);
          setUsername('Unknown User');
        } finally {
          setLoadingUsername(false);
        }
      }
    };

    if (address && address.user_id) {
      fetchUsername();
    }
  }, [address]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${format(date, "dd MMMM yyyy | HH:mm", { locale: enUS })} (${formatDistanceToNow(date, { addSuffix: true, locale: enUS })})`;
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!address) return <div>Address not found</div>;

  return (
    <>
      <div className="rounded-sm border border-stroke bg-white px-8 py-6 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-6">Address Details</h1>

        <div className="space-y-5">
          <div>
            <p className="font-medium text-gray-600 mb-1">ID</p>
            <p>{address.address_id}</p>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">Name</p>
            <p>{address.name}</p>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">User</p>
            <p>
              {loadingUsername ? (
                <span className="text-gray-400">Loading...</span>
              ) : (
                <a className="text-blue-500 hover:underline" href={`/admin/users/${address.user_id}`}>
                  {username || "Unknown User"}
                </a>
              )}
            </p>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">Status</p>
            <p>
              {address.status === 1 ? (
                <span className="text-green-500">Active</span>
              ) : address.status === 2 ? (
                <span className="text-red-500">Inactive</span>
              ) : null}
            </p>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">Type</p>
            <p>
              {address.type === 1 ? (
                <span>Home</span>
              ) : address.type === 2 ? (
                <span>Workplace</span>
              ) : null}
            </p>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">Recipient’s Name</p>
            <p>{address.full_name}</p>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">Phone</p>
            <p>{address.phone}</p>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">Address 1</p>
            <p>{address.address_1}</p>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">Address 2</p>
            <p>{address.address_2}</p>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">Subdistrict</p>
            <p>{address.subdistrict}</p>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">District</p>
            <p>{address.district}</p>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">Province</p>
            <p>{address.province}</p>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">Country</p>
            <p>{address.country}</p>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">Postal code</p>
            <p>{address.postal_code}</p>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">Created</p>
            <p>{formatDate(address.created_at)}</p>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">Updated</p>
            <p>{formatDate(address.updated_at)}</p>
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <button
            onClick={() => navigate(`/admin/addresses/${address_id}/edit`)}
            className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
          >
            Edit
          </button>
          <button
            onClick={() => navigate('/admin/addresses')}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Back
          </button>
        </div>

      </div>
    </>
  );
};

export default AddressView;