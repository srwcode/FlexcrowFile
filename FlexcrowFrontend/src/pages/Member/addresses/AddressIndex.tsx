import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
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
  transactionsCount?: number;
}

interface Transaction {
  transaction_id: string;
  address_id: string;
  status: number;
}

interface PaginatedResponse {
  total_count: number;
  address_items: Address[];
}

const AddressIndex = () => {
  const [addresses, setAddresses] = React.useState<Address[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);
  const recordsPerPage = 10;

  React.useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${config.API_URL}/addresses?page=${currentPage}&recordPerPage=${recordsPerPage}&startIndex=${(currentPage - 1) * recordsPerPage}`, {
          headers: {
            'Content-Type': 'application/json',
            'token': token || ''
          }
        });
        
        if (!response.ok) {
          setAddresses([]);
          setTotalCount(0);
          return;
        }
  
        const data: PaginatedResponse = await response.json();
        setAddresses(data.address_items || []);
        setTotalCount(data.total_count || 0);
      } catch (err) {
        setAddresses([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchAddresses();
  }, [currentPage]);

  React.useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${config.API_URL}/transactions?customer_id=current`, {
          headers: {
            'Content-Type': 'application/json',
            'token': token || ''
          }
        });
        
        if (!response.ok) {
          return;
        }
  
        const data = await response.json();
        
        if (addresses.length > 0 && data.transaction_items.length > 0) {
          const transactionsCountMap: Record<string, number> = {};
          
          data.transaction_items.forEach((transaction: Transaction) => {
            if (transaction.transaction_id && transaction.address_id) {
              transactionsCountMap[transaction.address_id] = (transactionsCountMap[transaction.address_id] || 0) + 1;
            }
          });
          
          const updatedAddresses = addresses.map(address => ({
            ...address,
            transactionsCount: transactionsCountMap[address.address_id] || 0
          }));
          
          setAddresses(updatedAddresses);
        }
      } catch (err) {
        console.error('Error fetching transactions:', err);
      }
    };

    if (addresses.length > 0) {
      fetchTransactions();
    }
  }, [addresses.length > 0]);

  const handleDelete = async (addressId: string) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.API_URL}/addresses/remove/${addressId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': token || ''
        }
      });

      if (!response.ok) throw new Error('Failed to delete address');

      toast.success('Address deleted successfully');
      setAddresses(addresses.filter(address => address.address_id !== addressId));
      
      if (addresses.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete address');
    }
  };

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
  
  if (error) return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 mx-auto my-8 max-w-4xl rounded shadow">
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

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r px-6 py-4" style={{ background: 'linear-gradient(to right, #0D6577, #0A5666)' }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-white mb-4 sm:mb-0 flex items-center gap-2">
            My Addresses 
            <span className="text-sm bg-white bg-opacity-20 rounded-full px-2 py-0.5">
              {totalCount}
            </span>
          </h1>
          <button
            onClick={() => navigate('/member/addresses/create')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-500 hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-400"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.25)', borderColor: 'rgba(255, 255, 255, 0.5)' }}
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add New Address
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        {addresses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <p className="text-lg font-medium text-gray-500 mb-1">No addresses found</p>
            <p className="text-gray-400 mb-4">Add a new address to get started</p>
            <button
              onClick={() => navigate('/member/addresses/create')}
              className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{ backgroundColor: '#0D6577' }}
            >
              Add Address
            </button>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th scope="col" className="min-w-[120px] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th scope="col" className="min-w-[120px] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th scope="col" className="min-w-[120px] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {addresses.map((address) => (
                <tr key={address.address_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{address.name}</div>
                    <div className="text-sm text-gray-500 mt-1">{address.full_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-teal-100 text-teal-800">
                      {address.type === 1 ? 'Home' : 'Workplace'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="truncate max-w-xs">
                      {address.address_1}, {address.district}, {address.province}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => navigate(`/member/addresses/${address.address_id}`)}
                        className="px-3 py-1.5 text-sm text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                        style={{ backgroundColor: '#0D6577' }}
                      >
                        View
                      </button>
                      {(address.transactionsCount || 0) === 0 && (
                      <>
                      <button
                        onClick={() => navigate(`/member/addresses/${address.address_id}/edit`)}
                        className="px-3 py-1.5 text-sm text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2"
                        style={{ backgroundColor: '#3f51b5' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(address.address_id)}
                        className="px-3 py-1.5 text-sm text-white bg-red-500 hover:bg-red-600 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Delete
                      </button>
                      </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      {addresses.length > 0 && (
        <>
          {renderPagination()}
        </>
      )}
    </div>
  );
};

export default AddressIndex;