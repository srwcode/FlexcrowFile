import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import config from '../../../config';

interface User {
  user_id: string;
  username: string;
  email: string;
  user_type: 'ADMIN' | 'USER';
  status: 1 | 2;
  first_name: string;
  last_name: string;
  phone: string;
  balance: GLfloat;
  address_id: string;
  image_id: string;
  created_at: string;
  updated_at: string;
}

interface Address {
  user_id: string;
  name: string;
}

interface ImageData {
  id: string;
  url: string;
}

const UserView = () => {
  const { user_id } = useParams<{ user_id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [address, setAddress] = React.useState<Address | null>(null);
  const [image, setImage] = useState<ImageData | null>(null);

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
        setUser(data);

        if (data.image_id) {
          const imageResponse = await fetch(`${config.API_URL}/files/${data.image_id}`, {
            headers: {
              'token': token || ''
            }
          });
          if (imageResponse.ok) {
            const imageData = await imageResponse.json();
            setImage({
              id: data.image_id,
              url: imageData.cloud_url
            });
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load user');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [user_id]);

  useEffect(() => {
    const fetchAddress = async () => {

      const addressId = user?.address_id;

      if (addressId) {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${config.API_URL}/addresses/${addressId}`, {
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
    }

    if (user && user.address_id) {
      fetchAddress();
    }
  }, [user]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${format(date, "dd MMMM yyyy | HH:mm", { locale: enUS })} (${formatDistanceToNow(date, { addSuffix: true, locale: enUS })})`;
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>User not found</div>;

  return (
    <>
      <div className="rounded-sm border border-stroke bg-white px-8 py-6 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-6">User Details</h1>

        <div className="space-y-5">
          <div>
            <p className="font-medium text-gray-600 mb-1">ID</p>
            <p>{user.user_id}</p>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">Username</p>
            <p>{user.username}</p>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">Email</p>
            <p>{user.email}</p>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">Role</p>
            <p>
              {user.user_type === 'ADMIN' ? (
                <span>Admin</span>
              ) : user.user_type === 'USER' ? (
                <span>User</span>
              ) : null}
            </p>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">Status</p>
            <p>
              {user.status === 1 ? (
                <span className="text-green-500">Active</span>
              ) : user.status === 2 ? (
                <span className="text-red-500">Inactive</span>
              ) : null}
            </p>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">First name</p>
            <p>{user.first_name}</p>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">Last name</p>
            <p>{user.last_name}</p>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">Phone</p>
            <p>{user.phone}</p>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">Balance</p>
            <p>
              {user.balance && (
                <>
                  ฿{user.balance.toFixed(2)}
                </>
              )}
            </p>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">Address</p>
            <p>
              {address && (
                <a className="text-blue-500 hover:underline" href={`/admin/addresses/${user.address_id}`}>
                  {address.name}
                </a>
              )}
            </p>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">Profile image</p>
              {image ? (
                <img 
                  src={image.url} 
                  alt="Profile" 
                  className="w-32 h-32 rounded-full object-cover mt-2"
                />
              ) : (
                <p>No image</p>
              )}
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">Created</p>
            <p>{formatDate(user.created_at)}</p>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">Updated</p>
            <p>{formatDate(user.updated_at)}</p>
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <button
            onClick={() => navigate(`/admin/users/${user_id}/edit`)}
            className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
          >
            Edit
          </button>
          <button
            onClick={() => navigate('/admin/users')}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Back
          </button>
        </div>

      </div>
    </>
  );
};

export default UserView;