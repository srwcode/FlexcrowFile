import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import config from '../../../config';

interface Transaction {
  transaction_id: string;
  user_id: string;
  customer_id: string;
  status: 1 | 2 | 3 | 4 | 5 | 6;
  type: 1 | 2;
  product_id: string;
}

interface PaginatedResponse {
  total_count: number;
  transaction_items: Transaction[];
}

const TransactionIndex = () => {
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [usernames, setUsernames] = useState<{ [key: string]: string }>({});
  const [loadingUsernames, setLoadingUsernames] = useState<{ [key: string]: boolean }>({});
  const [customers, setCustomers] = useState<{ [key: string]: string }>({});
  const [loadingCustomers, setLoadingCustomers] = useState<{ [key: string]: boolean }>({});

  const [products, setProducts] = useState<{ [key: string]: string }>({});
  const [loadingProducts, setLoadingProducts] = useState<{ [key: string]: boolean }>({});


  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);
  const recordsPerPage = 10;

  React.useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${config.API_URL}/transactions?page=${currentPage}&recordPerPage=${recordsPerPage}&startIndex=${(currentPage - 1) * recordsPerPage}`, {
          headers: {
            'Content-Type': 'application/json',
            'token': token || ''
          }
        });
        
        if (!response.ok) {
          setTransactions([]);
          setTotalCount(0);
          return;
        }
  
        const data: PaginatedResponse = await response.json();
        setTransactions(data.transaction_items || []);
        setTotalCount(data.total_count || 0);
      } catch (err) {
        setTransactions([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [currentPage]);

  useEffect(() => {
    const fetchUsernames = async () => {
      const userIds = transactions.map(transaction => transaction.user_id);
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

    if (transactions.length > 0) {
      fetchUsernames();
    }
  }, [transactions]);

  useEffect(() => {
    const fetchCustomers = async () => {
      const userIds = transactions.map(transaction => transaction.customer_id);
      const uniqueUserIds = [...new Set(userIds)];
      
      const newLoadingStates: { [key: string]: boolean } = {};
      const newUsernames: { [key: string]: string } = { ...usernames };
      
      uniqueUserIds.forEach(userId => {
        newLoadingStates[userId] = true;
      });
      setLoadingCustomers(newLoadingStates);

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

        setCustomers(newUsernames);
      } catch (error) {
        console.error('Error fetching usernames:', error);
      } finally {
        setLoadingCustomers(newLoadingStates);
      }
    };

    if (transactions.length > 0) {
      fetchCustomers();
    }
  }, [transactions]);
  
  useEffect(() => {
    const fetchProducts = async () => {
      const productIds = transactions.map(transaction => transaction.product_id);
      const uniqueProductIds = [...new Set(productIds)];
      
      const newLoadingStates: { [key: string]: boolean } = {};
      const newProducts: { [key: string]: string } = { ...products };
      
      uniqueProductIds.forEach(productId => {
        newLoadingStates[productId] = true;
      });
      setLoadingProducts(newLoadingStates);

      try {
        const token = localStorage.getItem('token');
        await Promise.all(
          uniqueProductIds.map(async (productId) => {
            try {
              const response = await fetch(`${config.API_URL}/products/${productId}`, {
                headers: {
                  'Content-Type': 'application/json',
                  'token': token || ''
                }
              });

              if (!response.ok) {
                throw new Error('Failed to fetch product');
              }

              const data = await response.json();
              newProducts[productId] = data.name;
            } catch (error) {
              console.error(`Error fetching product for product ${productId}:`, error);
              newProducts[productId] = 'Unknown Product';
            } finally {
              newLoadingStates[productId] = false;
            }
          })
        );

        setProducts(newProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoadingProducts(newLoadingStates);
      }
    };

    if (transactions.length > 0) {
      fetchProducts();
    }
  }, [transactions]);

  const handleDelete = async (transactionId: string) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.API_URL}/transactions/${transactionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'token': token || ''
        }
      });

      if (!response.ok) throw new Error('Failed to delete transaction');

      toast.success('Transaction deleted successfully');
      setTransactions(transactions.filter(transaction => transaction.transaction_id !== transactionId));
      
      if (transactions.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete transaction');
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
        <h1 className="text-2xl font-bold">Transactions ({totalCount})</h1>
        <button
          onClick={() => navigate('/admin/transactions/create')}
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
              <th className="min-w-[120px] py-4 px-4 font-medium text-black">Customer</th>
              <th className="min-w-[120px] py-4 px-4 font-medium text-black">Status</th>
              <th className="min-w-[120px] py-4 px-4 font-medium text-black">Product</th>
              <th className="min-w-[120px] py-4 px-4 font-medium text-black">Type</th>
              <th className="min-w-[120px] py-4 px-4 font-medium text-black">Actions</th>
            </tr>
          </thead>
          <tbody>
          {transactions.length === 0 ? (
            <tr>
              <td colSpan={5} className="text-center py-20 text-gray-500">
                No data
              </td>
            </tr>
          ) : (
            transactions.map(transaction => (
              <tr key={transaction.transaction_id} className="hover:bg-gray-50">
                <td className="border-b border-[#eee] py-5 px-4 pl-6">
                  {loadingUsernames[transaction.user_id] ? (
                    <span className="text-gray-400">Loading...</span>
                  ) : (
                    <a className="text-blue-500 hover:underline" href={`/admin/users/${transaction.user_id}`}>
                      {usernames[transaction.user_id] || "Unknown User"}
                    </a>
                  )}
                </td>
                <td className="border-b border-[#eee] py-5 px-4 pl-6">
                  {loadingCustomers[transaction.customer_id] ? (
                    <span className="text-gray-400">Loading...</span>
                  ) : (
                    <a className="text-blue-500 hover:underline" href={`/admin/users/${transaction.customer_id}`}>
                      {customers[transaction.customer_id] || "Unknown Customer"}
                    </a>
                  )}
                </td>
                <td className="border-b border-[#eee] py-5 px-4">
                  {transaction.status === 1 ? (
                    <span className="bg-yellow-500 text-white py-1.5 px-3 rounded-full text-sm">Pending</span>
                  ) : transaction.status === 2 ? (
                    <span className="bg-cyan-500 text-white py-1.5 px-3 rounded-full text-sm">Processing</span>
                  ) : transaction.status === 3 ? (
                    <span className="bg-green-500 text-white py-1.5 px-3 rounded-full text-sm">Completed</span>
                  ) : transaction.status === 4 ? (
                    <span className="bg-red-500 text-white py-1.5 px-3 rounded-full text-sm">Canceled</span>
                  ) : transaction.status === 5 ? (
                    <span className="bg-orange-500 text-white py-1.5 px-3 rounded-full text-sm">Rejected</span>
                  ) : transaction.status === 6 ? (
                    <span className="bg-gray-700 text-white py-1.5 px-3 rounded-full text-sm">Disputed</span>
                  ) : null}
                </td>
                <td className="border-b border-[#eee] py-5 px-4 pl-6">
                  {loadingProducts[transaction.product_id] ? (
                    <span className="text-gray-400">Loading...</span>
                  ) : (
                    <a className="text-blue-500 hover:underline" href={`/admin/products/${transaction.product_id}`}>
                      {products[transaction.product_id] || "Unknown Product"}
                    </a>
                  )}
                </td>
                <td className="border-b border-[#eee] py-5 px-4">
                  {transaction.type === 1 ? (
                    <span>Physical</span>
                  ) : transaction.type === 2 ? (
                    <span>Digital</span>
                  ) : null}
                </td>
                <td className="border-b border-[#eee] py-5 px-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/admin/transactions/${transaction.transaction_id}`)}
                      className="bg-blue-500 text-white px-4 py-1.5 rounded hover:bg-blue-600"
                    >
                      View
                    </button>
                    <button
                      onClick={() => navigate(`/admin/transactions/${transaction.transaction_id}/edit`)}
                      className="bg-yellow-500 text-white px-4 py-1.5 rounded hover:bg-yellow-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(transaction.transaction_id)}
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

      {transactions.length !== 0 && (
        <>
          {renderPagination()}
        </>
      )}
    </div>
  );
};

export default TransactionIndex;