import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import config from '../../../config';

interface Payment {
  payment_id: string;
  user_id: string;
  status: 1 | 2 | 3;
  amount: GLfloat;
  method: string;
  created_at: string;
}

interface PaginatedResponse {
  total_count: number;
  payment_items: Payment[];
}

const PaymentIndex = () => {
  const [payments, setPayments] = React.useState<Payment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [usernames, setUsernames] = useState<{ [key: string]: string }>({});
  const [loadingUsernames, setLoadingUsernames] = useState<{ [key: string]: boolean }>({});
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);
  const recordsPerPage = 10;

  React.useEffect(() => {
    const fetchPayments = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${config.API_URL}/payments?page=${currentPage}&recordPerPage=${recordsPerPage}&startIndex=${(currentPage - 1) * recordsPerPage}`, {
          headers: {
            'Content-Type': 'application/json',
            'token': token || ''
          }
        });
        
        if (!response.ok) {
          setPayments([]);
          setTotalCount(0);
          return;
        }
  
        const data: PaginatedResponse = await response.json();
        setPayments(data.payment_items || []);
        setTotalCount(data.total_count || 0);
      } catch (err) {
        setPayments([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [currentPage]);

  useEffect(() => {
    const fetchUsernames = async () => {
      const userIds = payments.map(payment => payment.user_id);
      const uniqueUserIds = [...new Set(userIds)];
      
      const newLoadingStates: { [key: string]: boolean } = {};
      const newUsernames: { [key: string]: string } = { ...usernames };
      
      uniqueUserIds.forEach(userId => {
        newLoadingStates[userId] = true;
      });
      setLoadingUsernames(newLoadingStates);

      try {
        const token = localStorage.getItem('token');
        await Promise.all(
          uniqueUserIds.map(async (userId) => {
            try {
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
              newUsernames[userId] = data.username;
            } catch (error) {
              console.error(`Error fetching username for user ${userId}:`, error);
              newUsernames[userId] = 'Unknown User';
            } finally {
              newLoadingStates[userId] = false;
            }
          })
        );

        setUsernames(newUsernames);
      } catch (error) {
        console.error('Error fetching usernames:', error);
      } finally {
        setLoadingUsernames(newLoadingStates);
      }
    };

    if (payments.length > 0) {
      fetchUsernames();
    }
  }, [payments]);

  const handleDelete = async (paymentId: string) => {
    if (!window.confirm('Are you sure you want to delete this payment?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.API_URL}/payments/${paymentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'token': token || ''
        }
      });

      if (!response.ok) throw new Error('Failed to delete payment');

      toast.success('Payment deleted successfully');
      setPayments(payments.filter(payment => payment.payment_id !== paymentId));
      
      if (payments.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete payment');
    }
  };

  const totalPages = Math.ceil(totalCount / recordsPerPage);

  const renderPagination = () => {
    return (
      <div className="flex justify-between items-center mt-8">
        <button
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-6 py-1.5 rounded-md border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        <span className="hidden md:block px-4 py-1.5">
          Page {currentPage} of {totalPages}
        </span>

        <button
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-6 py-1.5 rounded-md border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    );
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-10 shadow-default sm:px-7.5">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Payments ({totalCount})</h1>
        <button
          onClick={() => navigate('/admin/payments/create')}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Create
        </button>
      </div>

      <div className="max-w-full overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-2 text-left">
              <th className="min-w-[120px] py-4 px-4 font-medium text-black pl-6">User</th>
              <th className="min-w-[120px] py-4 px-4 font-medium text-black">Status</th>
              <th className="min-w-[120px] py-4 px-4 font-medium text-black">Amount</th>
              <th className="min-w-[120px] py-4 px-4 font-medium text-black">Method</th>
              <th className="min-w-[120px] py-4 px-4 font-medium text-black">Actions</th>
            </tr>
          </thead>
          <tbody>
          {payments.length === 0 ? (
            <tr>
              <td colSpan={5} className="text-center py-20 text-gray-500">
                No data
              </td>
            </tr>
          ) : (
            payments.map(payment => (
              <tr key={payment.payment_id} className="hover:bg-gray-50">
                <td className="border-b border-[#eee] py-5 px-4 pl-6">
                  {loadingUsernames[payment.user_id] ? (
                    <span className="text-gray-400">Loading...</span>
                  ) : (
                    <a className="text-blue-500 hover:underline" href={`/admin/users/${payment.user_id}`}>
                      {usernames[payment.user_id] || "Unknown User"}
                    </a>
                  )}
                </td>
                <td className="border-b border-[#eee] py-5 px-4">
                  {payment.status === 1 ? (
                    <span className="bg-yellow-500 text-white py-1.5 px-3 rounded-full text-sm">Pending</span>
                  ) : payment.status === 2 ? (
                    <span className="bg-green-500 text-white py-1.5 px-3 rounded-full text-sm">Completed</span>
                  ) : payment.status === 3 ? (
                    <span className="bg-red-500 text-white py-1.5 px-3 rounded-full text-sm">Canceled</span>
                  ) : null}
                </td>
                <td className="border-b border-[#eee] py-5 px-4 pl-6">฿{payment.amount.toFixed(2)}</td>
                <td className="border-b border-[#eee] py-5 px-4 pl-6">
                  {payment.method === "card" ? 'Credit/Debit Card' :
                  payment.method === "promptpay" ? 'PromptPay' : payment.method}
                </td>
                <td className="border-b border-[#eee] py-5 px-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/admin/payments/${payment.payment_id}`)}
                      className="bg-blue-500 text-white px-4 py-1.5 rounded hover:bg-blue-600"
                    >
                      View
                    </button>
                    <button
                      onClick={() => navigate(`/admin/payments/${payment.payment_id}/edit`)}
                      className="bg-yellow-500 text-white px-4 py-1.5 rounded hover:bg-yellow-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(payment.payment_id)}
                      className="bg-red-500 text-white px-4 py-1.5 rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
          </tbody>
        </table>
      </div>

      {payments.length !== 0 && (
        <>
          {renderPagination()}
        </>
      )}
    </div>
  );
};

export default PaymentIndex;