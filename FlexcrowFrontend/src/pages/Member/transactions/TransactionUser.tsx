import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../../../config';

interface Transaction {
  transaction_id: string;
  user_id: string;
  customer_id: string;
  status: 1 | 2 | 3 | 4 | 5| 6;
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
  created_at: string;
  updated_at: string;
}

interface PaginatedResponse {
  total_count: number;
  transaction_items: Transaction[];
}

const TransactionUser = () => {
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [customers, setCustomers] = useState<{ [key: string]: string }>({});
  const [phones, setPhones] = useState<{ [key: string]: string }>({});
  const [images, setImages] = useState<{ [key: string]: { id: string, url: string } }>({});
  const [loadingCustomers, setLoadingCustomers] = useState<{ [key: string]: boolean }>({});
  const [products, setProducts] = useState<{ [key: string]: string }>({});
  const [prices, setPrices] = useState<{ [key: string]: GLfloat }>({});
  const [loadingProducts, setLoadingProducts] = useState<{ [key: string]: boolean }>({});

  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);
  const recordsPerPage = 10;

  React.useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${config.API_URL}/transactions?page=${currentPage}&recordPerPage=${recordsPerPage}&startIndex=${(currentPage - 1) * recordsPerPage}&user_id=current`, {
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
    const fetchCustomers = async () => {
      const userIds = transactions.map(transaction => transaction.customer_id);
      const uniqueUserIds = [...new Set(userIds)];
      
      const newLoadingStates: { [key: string]: boolean } = {};
      const newUsernames: { [key: string]: string } = { ...customers };
      const newPhones: { [key: string]: string } = { ...phones };
      const newImages: { [key: string]: { id: string, url: string } } = { ...images };
      
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
              newUsernames[userId] = data.first_name + ' ' + data.last_name;
              newPhones[userId] = data.phone;
              
              if (data.image_id) {
                const imageResponse = await fetch(`${config.API_URL}/files/${data.image_id}`, {
                  headers: {
                    'token': token || ''
                  }
                });
                
                if (imageResponse.ok) {
                  const imageData = await imageResponse.json();
                  newImages[userId] = {
                    id: data.image_id,
                    url: imageData.cloud_url
                  };
                }
              }

            } catch (error) {
              console.error(`Error fetching username for user ${userId}:`, error);
              newUsernames[userId] = 'Unknown User';
            } finally {
              newLoadingStates[userId] = false;
            }
          })
        );

        setCustomers(newUsernames);
        setPhones(newPhones);
        setImages(newImages);
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
      const newPrices: { [key: string]: GLfloat } = { ...prices };
      
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
              newPrices[productId] = data.price;
            } catch (error) {
              console.error(`Error fetching product for product ${productId}:`, error);
              newProducts[productId] = 'Unknown Product';
            } finally {
              newLoadingStates[productId] = false;
            }
          })
        );

        setProducts(newProducts);
        setPrices(newPrices);
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

  const totalPages = Math.ceil(totalCount / recordsPerPage);

  const renderPagination = () => {
    return (
      <div className="flex justify-between items-center pt-6 pb-6 border-t px-6">
        <button
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex justify-center items-center w-30 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ borderColor: currentPage === 1 ? '#D1D5DB' : '#D1D5DB' }}
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Previous
        </button>

        <div className="hidden md:flex gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-10 py-2 text-sm font-medium rounded-md ${
                currentPage === page 
                  ? 'text-white' 
                  : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
              }`}
              style={{ backgroundColor: currentPage === page ? '#0D6577' : undefined }}
            >
              {page}
            </button>
          ))}
        </div>

        <button
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
          className="flex justify-center items-center w-30 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ borderColor: currentPage === totalPages || totalPages === 0 ? '#D1D5DB' : '#D1D5DB' }}
        >
          Next
          <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    );
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600" style={{ borderColor: '#0D6577' }}></div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r px-6 py-4" style={{ background: 'linear-gradient(to right, #0D6577, #0A5666)' }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-white mb-4 sm:mb-0 flex items-center gap-2">
            My Sales
            <span className="text-sm bg-white bg-opacity-20 rounded-full px-2 py-0.5">
              {totalCount}
            </span>
          </h1>
          <button
            onClick={() => navigate('/member/transactions/create')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-500 hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-400"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.25)', borderColor: 'rgba(255, 255, 255, 0.5)' }}
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add New Transaction
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <p className="text-lg font-medium text-gray-500 mb-1">No transactions found</p>
            <p className="text-gray-400 mb-4">Add a new transaction to get started</p>
            <button
              onClick={() => navigate('/member/transactions/create')}
              className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{ backgroundColor: '#0D6577' }}
            >
              Add Transaction
            </button>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th scope="col" className="min-w-[100px] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Buyer</th>
                <th scope="col" className="min-w-[100px] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="min-w-[100px] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th scope="col" className="min-w-[100px] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <tr key={transaction.transaction_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0 h-10 w-10">
                        {images[transaction.customer_id] ? (
                          <img
                            src={images[transaction.customer_id].url}
                            alt={`${customers[transaction.customer_id] || 'Unknown'} profile`}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(customers[transaction.customer_id] || 'Unknown')}&font-size=0.35&size=128&color=random&background=random&format=svg`} 
                            alt={`${customers[transaction.customer_id] || 'Unknown'} profile`}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        )}
                      </div>

                      <div>
                        <div className="font-medium text-gray-900">
                          {loadingCustomers[transaction.customer_id] ? (
                            <span className="text-gray-400">Loading...</span>
                          ) : (
                            <>
                              {customers[transaction.customer_id] || "Unknown Customer"}
                            </>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {loadingCustomers[transaction.customer_id] ? (
                            <span className="text-gray-400">Loading...</span>
                          ) : (
                            <>
                              {phones[transaction.customer_id] || "Unknown Phone"}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-teal-100 text-teal-800">
                        {transaction.status === 1 ? (
                          'Pending'
                        ) : transaction.status === 2 ? (

                          <>
                          {transaction.payment_id == "" ? (
                            'Waiting for payment'
                          ) : transaction.type === 1 && transaction.shipping_number === "" ? (
                            'Waiting for shipping'
                          ) : transaction.type === 1 && transaction.shipping_number !== "" && transaction.delivered_at === null ? (
                            'In transit'
                          ) : transaction.type === 2 && transaction.delivered_at === null ? (
                            'Waiting for delivery'
                          ) : transaction.delivered_at !== null ? (
                            'Delivered, awaiting review'
                          ) : 'Processing'}
                          </>
                          
                        ) : transaction.status === 3 ? (
                          'Completed'
                        ) : transaction.status === 4 ? (
                          'Canceled'
                        ) : transaction.status === 5 ? (
                          'Rejected'
                        ) : transaction.status === 6 ? (
                          'Disputed'
                        ) : null}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">
                      {loadingProducts[transaction.product_id] ? (
                        <span className="text-gray-400">Loading...</span>
                      ) : (
                        <>
                          {products[transaction.product_id] || "Unknown Product"}
                        </>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                     x{transaction.product_number ?? 1}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="font-medium text-gray-900">
                      {loadingProducts[transaction.product_id] ? (
                        <span className="text-gray-400">Loading...</span>
                      ) : (
                        <>
                          ฿{((prices[transaction.product_id] ?? 0)*(transaction.product_number ?? 1)+(transaction.shipping_price ?? 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      ฿{transaction.fee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} fee
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => navigate(`/member/transactions/sell/${transaction.transaction_id}`)}
                        className="px-3 py-1.5 text-sm text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                        style={{ backgroundColor: '#0D6577' }}
                      >
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      {transactions.length > 0 && (
        <>
          {renderPagination()}
        </>
      )}
    </div>
  );
};

export default TransactionUser;