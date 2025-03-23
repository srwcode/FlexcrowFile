import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import config from '../../../config';

interface Transaction {
  transaction_id: string;
  user_id: string;
  customer_id: string;
  status: 1 | 2 | 3 | 4 | 5 | 6;
  type: 1 | 2;
  product_id: string;
  product_number: number;
  address_id: string;
  payment_id: string;
  shipping: string;
  shipping_price: GLfloat;
  shipping_number: string;
  shipping_details: string;
  shipping_image_id: string;
  delivered_at: string;
  delivered_details: string;
  fee: GLfloat;
  fee_type: 1 | 2 | 3;
  created_at: string;
  updated_at: string;
}

interface ImageData {
  id: string;
  url: string;
}

interface Address {
  user_id: string;
  name: string;
}

interface Product {
  user_id: string;
  name: string;
}

const TransactionView = () => {
  const { transaction_id } = useParams<{ transaction_id: string }>();
  const navigate = useNavigate();
  const [transaction, setTransaction] = React.useState<Transaction | null>(null);
  const [username, setUsername] = useState<string>('');
  const [customer, setCustomer] = useState<string>('');
  const [loadingUsername, setLoadingUsername] = useState<boolean>(false);
  const [loadingCustomer, setLoadingCustomer] = useState<boolean>(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [address, setAddress] = React.useState<Address | null>(null);
  const [product, setProduct] = React.useState<Product | null>(null);
  const [image, setImage] = useState<ImageData | null>(null);

  React.useEffect(() => {
    const fetchTransaction = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${config.API_URL}/transactions/${transaction_id}`, {
          headers: {
            'Content-Type': 'application/json',
            'token': token || ''
          }
        });

        if (!response.ok) throw new Error('Failed to fetch transaction');
        const data = await response.json();
        setTransaction(data);

        if (data.shipping_image_id) {
          const imageResponse = await fetch(`${config.API_URL}/files/${data.shipping_image_id}`, {
            headers: {
              'token': token || ''
            }
          });
          if (imageResponse.ok) {
            const imageData = await imageResponse.json();
            setImage({
              id: data.shipping_image_id,
              url: imageData.cloud_url
            });
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load transaction');
      } finally {
        setLoading(false);
      }
    };

    fetchTransaction();
  }, [transaction_id]);

  useEffect(() => {
    const fetchUsername = async () => {
      const userId = transaction?.user_id;

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

    if (transaction && transaction.user_id) {
      fetchUsername();
    }
  }, [transaction]);

  useEffect(() => {
    const fetchCustomer = async () => {
      const customerId = transaction?.customer_id;

      if (customerId) {
        setLoadingCustomer(true);

        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${config.API_URL}/users/username?user_id=${customerId}`, {
            headers: {
              'Content-Type': 'application/json',
              'token': token || ''
            }
          });

          if (!response.ok) {
            throw new Error('Failed to fetch username');
          }

          const data = await response.json();
          setCustomer(data.username);
        } catch (error) {
          console.error('Error fetching username:', error);
          setCustomer('Unknown User');
        } finally {
          setLoadingCustomer(false);
        }
      }
    };

    if (transaction && transaction.user_id) {
      fetchCustomer();
    }
  }, [transaction]);

  useEffect(() => {
    const fetchAddress = async () => {

      const addressId = transaction?.address_id;

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

    if (transaction && transaction.address_id) {
      fetchAddress();
    }
  }, [transaction]);

  useEffect(() => {
    const fetchProduct = async () => {

      const productId = transaction?.product_id;

      if (productId) {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${config.API_URL}/products/${productId}`, {
            headers: {
              'Content-Type': 'application/json',
              'token': token || ''
            }
          });

          if (!response.ok) throw new Error('Failed to fetch product');
          const data = await response.json();
          setProduct(data);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load product');
        } finally {
          setLoading(false);
        }
      };
    }

    if (transaction && transaction.product_id) {
      fetchProduct();
    }
  }, [transaction]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${format(date, "dd MMMM yyyy | HH:mm", { locale: enUS })} (${formatDistanceToNow(date, { addSuffix: true, locale: enUS })})`;
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!transaction) return <div>Transaction not found</div>;

  return (
    <>
      <div className="rounded-sm border border-stroke bg-white px-8 py-6 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-6">Transaction Details</h1>

        <div className="space-y-5">
          <div>
            <p className="font-medium text-gray-600 mb-1">ID</p>
            <p>{transaction.transaction_id}</p>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">User</p>
            <p>
              {loadingUsername ? (
                <span className="text-gray-400">Loading...</span>
              ) : (
                <a className="text-blue-500 hover:underline" href={`/admin/users/${transaction.user_id}`}>
                  {username || "Unknown User"}
                </a>
              )}
            </p>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">Customer</p>
            <p>
              {loadingCustomer ? (
                <span className="text-gray-400">Loading...</span>
              ) : (
                <a className="text-blue-500 hover:underline" href={`/admin/users/${transaction.customer_id}`}>
                  {customer || "Unknown Customer"}
                </a>
              )}
            </p>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">Status</p>
            <p>
              {transaction.status === 1 ? (
                <span className="text-yellow-500">Pending</span>
              ) : transaction.status === 2 ? (
                <span className="text-cyan-500">Processing</span>
              ) : transaction.status === 3 ? (
                <span className="text-green-500">Completed</span>
              ) : transaction.status === 4 ? (
                <span className="text-red-500">Canceled</span>
              ) : transaction.status === 5 ? (
                <span className="text-orange-500">Rejected</span>
              ) : transaction.status === 6 ? (
                <span className="text-gray-700">Disputed</span>
              ) : null}
            </p>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">Type</p>
            <p>
              {transaction.type === 1 ? (
                <span>Physical</span>
              ) : transaction.type === 2 ? (
                <span>Digital</span>
              ) : null}
            </p>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">Product</p>
            <p>
              {product && (
                <a className="text-blue-500 hover:underline" href={`/admin/products/${transaction.product_id}`}>
                  {product.name}
                </a>
              )}
            </p>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">Product Number</p>
            <p>{transaction.product_number}</p>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">Address</p>
            <p>
              {address && (
                <a className="text-blue-500 hover:underline" href={`/admin/addresses/${transaction.address_id}`}>
                  {address.name}
                </a>
              )}
            </p>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">Payment</p>
            <p>
              {transaction.payment_id && (
                <a className="text-blue-500 hover:underline" href={`/admin/payments/${transaction.payment_id}`}>
                  {transaction.payment_id}
                </a>
              )}
            </p>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">Shipping</p>
            <p>{transaction.shipping}</p>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">Shipping Price</p>
            <p>
              {transaction.shipping_price && (
                <>
                  ฿{transaction.shipping_price.toFixed(2)}
                </>
              )}
            </p>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">Shipping Number</p>
            <p>{transaction.shipping_number}</p>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">Shipping Details</p>
            <p className="whitespace-pre-wrap">{transaction.shipping_details}</p>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">Shipping Image</p>
              {image ? (
                <img 
                  src={image.url} 
                  alt="Profile" 
                  className="w-auto h-auto max-w-full max-h-30 object-contain mt-2"
                />
              ) : (
                <p>No image</p>
              )}
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">Delivered</p>
            <p>
              {transaction.delivered_at && (
                <>
                  {formatDate(transaction.delivered_at)}
                </>
              )}
            </p>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">Delivered Details</p>
            <p className="whitespace-pre-wrap">{transaction.delivered_details}</p>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">Fee</p>
            <p>
              {transaction.fee && (
                <>
                  ฿{transaction.fee.toFixed(2)}
                </>
              )}
            </p>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">Fee Type</p>
            <p>
              {transaction.fee_type === 1 ? (
                <span>Buyer</span>
              ) : transaction.fee_type === 2 ? (
                <span>Seller</span>
              ) : transaction.fee_type === 3 ? (
                <span>Split Fees Equally</span>
              ) : null}
            </p>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">Created</p>
            <p>{formatDate(transaction.created_at)}</p>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">Updated</p>
            <p>{formatDate(transaction.updated_at)}</p>
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <button
            onClick={() => navigate(`/admin/transactions/${transaction_id}/edit`)}
            className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
          >
            Edit
          </button>
          <button
            onClick={() => navigate('/admin/transactions')}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Back
          </button>
        </div>

      </div>
    </>
  );
};

export default TransactionView;