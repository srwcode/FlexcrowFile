import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import config from '../../config';

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
  created_at: string;
  updated_at: string;
}

interface PaginatedResponse {
  total_count: number;
  transaction_items: Transaction[];
}

const TransactionCustomer = () => {
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [users, setUsers] = useState<{ [key: string]: string }>({});
  const [phones, setPhones] = useState<{ [key: string]: string }>({});
  const [images, setImages] = useState<{ [key: string]: { id: string, url: string } }>({});
  const [loadingUsers, setLoadingUsers] = useState<{ [key: string]: boolean }>({});
  const [products, setProducts] = useState<{ [key: string]: string }>({});
  const [prices, setPrices] = useState<{ [key: string]: GLfloat }>({});
  const [loadingProducts, setLoadingProducts] = useState<{ [key: string]: boolean }>({});

  const [utransactions, setUtransactions] = React.useState<Transaction[]>([]);
  const [customers, setCustomers] = useState<{ [key: string]: string }>({});
  const [uphones, setUphones] = useState<{ [key: string]: string }>({});
  const [uimages, setUimages] = useState<{ [key: string]: { id: string, url: string } }>({});
  const [loadingCustomers, setLoadingCustomers] = useState<{ [key: string]: boolean }>({});
  const [uproducts, setUproducts] = useState<{ [key: string]: string }>({});
  const [uprices, setUprices] = useState<{ [key: string]: GLfloat }>({});
  const [loadingUproducts, setUloadingProducts] = useState<{ [key: string]: boolean }>({});

  const navigate = useNavigate();
  const [purchasesCount, setPurchasesCount] = React.useState(0);
  const [salesCount, setSalesCount] = React.useState(0);
  const recordsPerPage = 5;

  const [purchasesAmount, setPurchasesAmount] = React.useState(0);
  const [salesAmount, setSalesAmount] = React.useState(0);

  React.useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${config.API_URL}/transactions?recordPerPage=${recordsPerPage}&customer_id=current`, {
          headers: {
            'Content-Type': 'application/json',
            'token': token || ''
          }
        });
        
        if (!response.ok) {
          setTransactions([]);
          setPurchasesCount(0);
          setPurchasesAmount(0);
          return;
        }
  
        const data: PaginatedResponse = await response.json();
        setTransactions(data.transaction_items || []);
        setPurchasesCount(data.total_count || 0);
      } catch (err) {
        setTransactions([]);
        setPurchasesCount(0);
        setPurchasesAmount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      const userIds = transactions.map(transaction => transaction.user_id);
      const uniqueUserIds = [...new Set(userIds)];
      
      const newLoadingStates: { [key: string]: boolean } = {};
      const newUsernames: { [key: string]: string } = { ...users };
      const newPhones: { [key: string]: string } = { ...phones };
      const newImages: { [key: string]: { id: string, url: string } } = { ...images };
      
      uniqueUserIds.forEach(userId => {
        newLoadingStates[userId] = true;
      });
      setLoadingUsers(newLoadingStates);

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

        setUsers(newUsernames);
        setPhones(newPhones);
        setImages(newImages);
      } catch (error) {
        console.error('Error fetching usernames:', error);
      } finally {
        setLoadingUsers(newLoadingStates);
      }
    };

    if (transactions.length > 0) {
      fetchUsers();
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
              const response = await fetch(`${config.API_URL}/products/${productId}?transaction=true`, {
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

  React.useEffect(() => {
    const fetchuTransactions = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${config.API_URL}/transactions?recordPerPage=${recordsPerPage}&user_id=current`, {
          headers: {
            'Content-Type': 'application/json',
            'token': token || ''
          }
        });
        
        if (!response.ok) {
          setUtransactions([]);
          setSalesCount(0);
          setSalesAmount(0);
          return;
        }
  
        const data: PaginatedResponse = await response.json();
        setUtransactions(data.transaction_items || []);
        setSalesCount(data.total_count || 0);
      } catch (err) {
        setUtransactions([]);
        setSalesCount(0);
        setSalesAmount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchuTransactions();
  }, []);

  useEffect(() => {
    const fetchuCustomers = async () => {
      const userIds = utransactions.map(transaction => transaction.customer_id);
      const uniqueUserIds = [...new Set(userIds)];
      
      const newLoadingStates: { [key: string]: boolean } = {};
      const newUsernames: { [key: string]: string } = { ...customers };
      const newPhones: { [key: string]: string } = { ...uphones };
      const newImages: { [key: string]: { id: string, url: string } } = { ...uimages };
      
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
        setUphones(newPhones);
        setUimages(newImages);
      } catch (error) {
        console.error('Error fetching usernames:', error);
      } finally {
        setLoadingCustomers(newLoadingStates);
      }
    };

    if (utransactions.length > 0) {
      fetchuCustomers();
    }
  }, [utransactions]);
  
  useEffect(() => {
    const fetchuProducts = async () => {
      const productIds = utransactions.map(transaction => transaction.product_id);
      const uniqueProductIds = [...new Set(productIds)];
      
      const newLoadingStates: { [key: string]: boolean } = {};
      const newProducts: { [key: string]: string } = { ...uproducts };
      const newPrices: { [key: string]: GLfloat } = { ...uprices };
      
      uniqueProductIds.forEach(productId => {
        newLoadingStates[productId] = true;
      });
      setUloadingProducts(newLoadingStates);

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

        setUproducts(newProducts);
        setUprices(newPrices);
      } catch (error) {
        console.error('Error fetching uproducts:', error);
      } finally {
        setUloadingProducts(newLoadingStates);
      }
    };

    if (utransactions.length > 0) {
      fetchuProducts();
    }
  }, [utransactions]);

  useEffect(() => {
    if (transactions.length > 0 && Object.keys(prices).length > 0) {
      let total = 0;
      transactions.forEach(transaction => {
        if(transaction.status === 3) {
          const productPrice = prices[transaction.product_id] || 0;
          const quantity = transaction.product_number || 1;
          const shippingPrice = transaction.shipping_price || 0;
          total += (productPrice * quantity) + shippingPrice;
        }
      });
      setPurchasesAmount(total);
    }
  }, [transactions, prices]);
  
  useEffect(() => {
    if (utransactions.length > 0 && Object.keys(uprices).length > 0) {
      let total = 0;
      utransactions.forEach(transaction => {
        if(transaction.status === 3) {
          const productPrice = uprices[transaction.product_id] || 0;
          const quantity = transaction.product_number || 1;
          const shippingPrice = transaction.shipping_price || 0;
          total += (productPrice * quantity) + shippingPrice;
        }
      });
      setSalesAmount(total);
    }
  }, [utransactions, uprices]);

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600" style={{ borderColor: '#0D6577' }}></div>
    </div>
  );

  return (
    <>

    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden transition-transform duration-300 hover:scale-105 border-l-4 border-[#0d6577]">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Purchases</h3>
            <div className="p-2 rounded-full bg-emerald-100 text-emerald-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-800">{purchasesCount}</p>
          <p className="text-sm text-gray-500 mt-2">Orders placed</p>
        </div>
      </div>

      <div className="bg-white shadow-lg rounded-lg overflow-hidden transition-transform duration-300 hover:scale-105 border-l-4 border-[#0d6577]">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Purchases Amount</h3>
            <div className="p-2 rounded-full bg-yellow-100 text-yellow-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-800">฿{purchasesAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-sm text-gray-500 mt-2">Total spending</p>
        </div>
      </div>

      <div className="bg-white shadow-lg rounded-lg overflow-hidden transition-transform duration-300 hover:scale-105 border-l-4 border-[#0d6577]">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Sales</h3>
            <div className="p-2 rounded-full bg-blue-100 text-blue-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-800">{salesCount}</p>
          <p className="text-sm text-gray-500 mt-2">Orders received</p>
        </div>
      </div>

      <div className="bg-white shadow-lg rounded-lg overflow-hidden transition-transform duration-300 hover:scale-105 border-l-4 border-[#0d6577]">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Sales Amount</h3>
            <div className="p-2 rounded-full bg-purple-100 text-purple-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-800">฿{salesAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-sm text-gray-500 mt-2">Total revenue</p>
        </div>
      </div>
    </div>

    <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-12">
      <div className="bg-gradient-to-r px-6 py-4" style={{ background: 'linear-gradient(to right, #0D6577, #0A5666)' }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-white mb-4 sm:mb-0 flex items-center gap-2">
            Latest Purchases
          </h1>
          <button
            onClick={() => navigate('/member/transactions/buy')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-500 hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-400"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.25)', borderColor: 'rgba(255, 255, 255, 0.5)' }}
          >
            View all
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <p className="text-lg font-medium text-gray-500 mb-1">No transactions found</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th scope="col" className="min-w-[100px] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller</th>
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
                        {images[transaction.user_id] ? (
                          <img
                            src={images[transaction.user_id].url}
                            alt={`${users[transaction.user_id] || 'Unknown'} profile`}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(users[transaction.user_id] || 'Unknown')}&font-size=0.35&size=128&color=random&background=random&format=svg`} 
                            alt={`${users[transaction.user_id] || 'Unknown'} profile`}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        )}
                      </div>

                      <div>
                        <div className="font-medium text-gray-900">
                          {loadingUsers[transaction.user_id] ? (
                            <span className="text-gray-400">Loading...</span>
                          ) : (
                            <>
                              {users[transaction.user_id] || "Unknown User"}
                            </>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {loadingUsers[transaction.user_id] ? (
                            <span className="text-gray-400">Loading...</span>
                          ) : (
                            <>
                              {phones[transaction.user_id] || "Unknown Phone"}
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
                        onClick={() => navigate(`/member/transactions/buy/${transaction.transaction_id}`)}
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
    </div>

    <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-20">
      <div className="bg-gradient-to-r px-6 py-4" style={{ background: 'linear-gradient(to right, #0D6577, #0A5666)' }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-white mb-4 sm:mb-0 flex items-center gap-2">
            Latest Sales
          </h1>
          <button
            onClick={() => navigate('/member/transactions/sell')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-500 hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-400"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.25)', borderColor: 'rgba(255, 255, 255, 0.5)' }}
          >
            View all
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        {utransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <p className="text-lg font-medium text-gray-500 mb-1">No transactions found</p>
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
              {utransactions.map((transaction) => (
                <tr key={transaction.transaction_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0 h-10 w-10">
                        {uimages[transaction.customer_id] ? (
                          <img
                            src={uimages[transaction.customer_id].url}
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
                              {uphones[transaction.customer_id] || "Unknown Phone"}
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
                      {loadingUproducts[transaction.product_id] ? (
                        <span className="text-gray-400">Loading...</span>
                      ) : (
                        <>
                          {uproducts[transaction.product_id] || "Unknown Product"}
                        </>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                     x{transaction.product_number ?? 1}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="font-medium text-gray-900">
                      {loadingUproducts[transaction.product_id] ? (
                        <span className="text-gray-400">Loading...</span>
                      ) : (
                        <>
                          ฿{((uprices[transaction.product_id] ?? 0)*(transaction.product_number ?? 1)+(transaction.shipping_price ?? 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
    </div>

    </>
  );
};

export default TransactionCustomer;