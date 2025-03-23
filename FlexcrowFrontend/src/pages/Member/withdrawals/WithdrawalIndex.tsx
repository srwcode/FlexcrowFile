import React from 'react';
import { useNavigate } from 'react-router-dom';
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
}

interface PaginatedResponse {
  total_count: number;
  withdrawal_items: Withdrawal[];
}

const WithdrawalIndex = () => {
  const [withdrawals, setWithdrawals] = React.useState<Withdrawal[]>([]);
  const [loading, setLoading] = React.useState(true);
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);
  const recordsPerPage = 10;

  React.useEffect(() => {
    const fetchWithdrawals = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${config.API_URL}/withdrawals?page=${currentPage}&recordPerPage=${recordsPerPage}&startIndex=${(currentPage - 1) * recordsPerPage}`, {
          headers: {
            'Content-Type': 'application/json',
            'token': token || ''
          }
        });
        
        if (!response.ok) {
          setWithdrawals([]);
          setTotalCount(0);
          return;
        }
  
        const data: PaginatedResponse = await response.json();
        setWithdrawals(data.withdrawal_items || []);
        setTotalCount(data.total_count || 0);
      } catch (err) {
        setWithdrawals([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchWithdrawals();
  }, [currentPage]);

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${format(date, "dd MMMM yyyy | HH:mm", { locale: enUS })}`;
  };

  const formatDate2 = (dateString: string) => {
    const date = new Date(dateString);
    return `${formatDistanceToNow(date, { addSuffix: true, locale: enUS })}`;
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
            My Withdrawals 
            <span className="text-sm bg-white bg-opacity-20 rounded-full px-2 py-0.5">
              {totalCount}
            </span>
          </h1>
          <button
            onClick={() => navigate('/member/withdrawals/create')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-500 hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-400"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.25)', borderColor: 'rgba(255, 255, 255, 0.5)' }}
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Request Withdrawal
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        {withdrawals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <p className="text-lg font-medium text-gray-500 mb-1">No withdrawals found</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th scope="col" className="min-w-[120px] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th scope="col" className="min-w-[120px] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="min-w-[120px] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th scope="col" className="min-w-[120px] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                <th scope="col" className="min-w-[120px] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {withdrawals.map((withdrawal) => (
                <tr key={withdrawal.withdrawal_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{formatDate(withdrawal.created_at)}</div>
                    <div className="text-sm text-gray-500 mt-1">{formatDate2(withdrawal.created_at)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-teal-100 text-teal-800">
                      {withdrawal.status === 1 ? 'Pending' : withdrawal.status === 2 ? 'Completed' : 'Canceled'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ฿{withdrawal.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {withdrawal.method === "promptpay" ? 'PromptPay' :
                    withdrawal.method === "truemoney" ? 'TrueMoney' :
                    withdrawal.method === "paypal" ? 'PayPal' :
                    withdrawal.method === "payoneer" ? 'Payoneer' :
                    withdrawal.method === "usdt" ? 'USDT' :
                    withdrawal.method === "skrill" ? 'Skrill' : withdrawal.method}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{withdrawal.account}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      {withdrawals.length > 0 && (
        <>
          {renderPagination()}
        </>
      )}
    </div>
  );
};

export default WithdrawalIndex;