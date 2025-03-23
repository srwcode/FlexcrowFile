import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import config from '../../../config';

interface Withdrawal {
  withdrawal_id: string;
  user_id: string;
  status: 1 | 2 | 3;
  amount: GLfloat;
  method: string;
  account: string;
  created_at: string;
  updated_at: string;
}

const WithdrawalView = () => {
  const { withdrawal_id } = useParams<{ withdrawal_id: string }>();
  const navigate = useNavigate();
  const [withdrawal, setWithdrawal] = React.useState<Withdrawal | null>(null);
  const [username, setUsername] = useState<string>('');
  const [loadingUsername, setLoadingUsername] = useState<boolean>(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchWithdrawal = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${config.API_URL}/withdrawals/${withdrawal_id}`, {
          headers: {
            'Content-Type': 'application/json',
            'token': token || ''
          }
        });

        if (!response.ok) throw new Error('Failed to fetch withdrawal');
        const data = await response.json();
        setWithdrawal(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load withdrawal');
      } finally {
        setLoading(false);
      }
    };

    fetchWithdrawal();
  }, [withdrawal_id]);

  useEffect(() => {
    const fetchUsername = async () => {
      const userId = withdrawal?.user_id;

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

    if (withdrawal && withdrawal.user_id) {
      fetchUsername();
    }
  }, [withdrawal]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${format(date, "dd MMMM yyyy | HH:mm", { locale: enUS })} (${formatDistanceToNow(date, { addSuffix: true, locale: enUS })})`;
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!withdrawal) return <div>Withdrawal not found</div>;

  return (
    <>
      <div className="rounded-sm border border-stroke bg-white px-8 py-6 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-6">Withdrawal Details</h1>

        <div className="space-y-5">
          <div>
            <p className="font-medium text-gray-600 mb-1">ID</p>
            <p>{withdrawal.withdrawal_id}</p>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">User</p>
            <p>
              {loadingUsername ? (
                <span className="text-gray-400">Loading...</span>
              ) : (
                <a className="text-blue-500 hover:underline" href={`/admin/users/${withdrawal.user_id}`}>
                  {username || "Unknown User"}
                </a>
              )}
            </p>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">Status</p>
            <p>
              {withdrawal.status === 1 ? (
                <span className="text-yellow-500">Pending</span>
              ) : withdrawal.status === 2 ? (
                <span className="text-green-500">Completed</span>
              ) : withdrawal.status === 3 ? (
                <span className="text-red-500">Canceled</span>
              ) : null}
            </p>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">Amount</p>
            <p>฿{withdrawal.amount.toFixed(2)}</p>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">Method</p>
            <p>
              {withdrawal.method === "promptpay" ? 'PromptPay' :
              withdrawal.method === "truemoney" ? 'TrueMoney' :
              withdrawal.method === "paypal" ? 'PayPal' :
              withdrawal.method === "payoneer" ? 'Payoneer' :
              withdrawal.method === "usdt" ? 'USDT' :
              withdrawal.method === "skrill" ? 'Skrill' : withdrawal.method}
            </p>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">Account</p>
            <p>{withdrawal.account}</p>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">Created</p>
            <p>{formatDate(withdrawal.created_at)}</p>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">Updated</p>
            <p>{formatDate(withdrawal.updated_at)}</p>
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <button
            onClick={() => navigate(`/admin/withdrawals/${withdrawal_id}/edit`)}
            className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
          >
            Edit
          </button>
          <button
            onClick={() => navigate('/admin/withdrawals')}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Back
          </button>
        </div>

      </div>
    </>
  );
};

export default WithdrawalView;