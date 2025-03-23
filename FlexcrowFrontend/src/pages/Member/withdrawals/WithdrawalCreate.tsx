import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import config from '../../../config';

interface WithdrawalMethod {
  id: string;
  name: string;
  minAmount: number;
}

interface WithdrawalFormData {
  amount: string;
  method: string;
  account: string;
}

interface UserBalance {
  available: number;
}

const WithdrawalCreate = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [userBalance, setUserBalance] = useState<UserBalance>({
    available: 0
  });
  
  const withdrawalMethods: WithdrawalMethod[] = [
    { id: "promptpay", name: "PromptPay", minAmount: 100 },
    { id: "truemoney", name: "TrueMoney", minAmount: 100 },
    { id: "paypal", name: "PayPal", minAmount: 500 },
    { id: "payoneer", name: "Payoneer", minAmount: 1000 },
    { id: "usdt", name: "USDT", minAmount: 100 },
    { id: "skrill", name: "Skrill", minAmount: 200 }
  ];

  const [formData, setFormData] = useState<WithdrawalFormData>({
    amount: '',
    method: '',
    account: ''
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const fetchUserBalance = async () => {
      try {
        const authToken = localStorage.getItem('token');
        const response = await fetch(`${config.API_URL}/auth/data`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'token': authToken || ''
          }
        })
        
        if (!response.ok) {
          throw new Error('Failed to fetch balance');
        }
        
        const data = await response.json();
        setUserBalance({
          available: data.balance || 0
        });
      } catch (err) {
        console.error('Error fetching balance:', err);
        toast.error('Unable to fetch your current balance');
      }
    };
    
    fetchUserBalance();
  }, []);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.method) newErrors.method = 'Withdrawal method is required';
    
    if (!formData.account) newErrors.account = 'Account details are required';
    if (formData.account.length > 100) {
      newErrors.account = 'Account details must not exceed 100 characters';
    }

    const amountStr = formData.amount as string;
    if (amountStr === '') {
      newErrors.amount = 'Amount is required';
    } else if (!/^(0\.\d{1,2}|[1-9]\d*(\.\d{1,2})?)$/.test(amountStr)) {
      newErrors.amount = 'Invalid amount format';
    } else {
      const amount = parseFloat(amountStr);
      const selectedMethod = withdrawalMethods.find(m => m.id === formData.method);
      
      if (selectedMethod && amount < selectedMethod.minAmount) {
        newErrors.amount = `Amount must be at least ${selectedMethod.minAmount}`;
      }
      
      if (amount > userBalance.available) {
        newErrors.amount = 'Amount exceeds your available balance';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const dataToSubmit = {
      ...formData,
      status: 1,
      amount: parseFloat(formData.amount) || 0
    };

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.API_URL}/withdrawals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': token || ''
        },
        body: JSON.stringify(dataToSubmit)
      });

      const responseData = await response.json();

      if (!response.ok) {
        if (responseData.error === 'user_error') {
          setErrors((prev) => ({ ...prev, user_id: 'User not found' }));
        } else {
          throw new Error(responseData.error || 'Failed to create withdrawal');
        }
        return;
      }

      toast.success('Withdrawal request submitted successfully');
      navigate('/member/withdrawals');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create withdrawal');
    }
  };

  const inputClass = "w-full border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition duration-150";

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-4" style={{ background: 'linear-gradient(to right, #0D6577, #0A5666)' }}>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Request Withdrawal</h1>
          <span className="inline-flex items-center px-5 py-2.5 rounded-md text-sm font-medium text-white" style={{ backgroundColor: 'rgba(255, 255, 255, 0.25)', borderColor: 'rgba(255, 255, 255, 0.5)' }}>
            Balance: ฿{userBalance.available.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mx-6 my-4 rounded shadow">
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
      )}

      <div className="p-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Withdrawal Method</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
              {withdrawalMethods.map((method) => (
                <div 
                  key={method.id}
                  onClick={() => setFormData({ ...formData, method: method.id })}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition duration-150 ${
                    formData.method === method.id 
                      ? 'border-teal-500 bg-teal-50' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">{method.name}</h3>
                      <p className="text-sm text-gray-500">Min: ฿{method.minAmount.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {errors.method && <p className="text-red-500 text-xs mt-1">{errors.method}</p>}
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Withdrawal Account</h2>
            <div>
              <label className="block text-sm font-medium text-teal-600 mb-2">
                {formData.method === 'promptpay' ? 'PromptPay Phone Number' : 
                 formData.method === 'truemoney' ? 'TrueMoney Phone Number' :
                 formData.method === 'paypal' ? 'PayPal Email Address' :
                 formData.method === 'payoneer' ? 'Payoneer Email Address' :
                 formData.method === 'usdt' ? 'USDT Wallet Address' :
                 formData.method === 'skrill' ? 'Skrill Email Address' :
                 'Account Details'}
              </label>
              <input
                type="text"
                value={formData.account}
                onChange={e => setFormData({ ...formData, account: e.target.value })}
                className={inputClass}
                placeholder={
                  formData.method === 'promptpay' ? 'Enter your PromptPay phone number' : 
                  formData.method === 'truemoney' ? 'Enter your TrueMoney phone number' : 
                  formData.method === 'paypal' ? 'Enter your PayPal email address' :
                  formData.method === 'payoneer' ? 'Enter your Payoneer email address' :
                  formData.method === 'usdt' ? 'Enter your USDT wallet address' :
                  formData.method === 'skrill' ? 'Enter your Skrill email address' :
                  'Enter account details'
                }
              />
              {errors.account && <p className="text-red-500 text-xs mt-1">{errors.account}</p>}
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Withdrawal Details</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-teal-600 mb-2">Amount</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">฿</span>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  className={`${inputClass} pl-8`}
                  placeholder="0.00"
                  step="0.01"
                  min={formData.method ? withdrawalMethods.find(m => m.id === formData.method)?.minAmount || 0 : 0}
                  max={userBalance.available}
                />
              </div>
              {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg mb-8 border border-gray-200">
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="h-5 w-5 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-teal-600">Important Information</h3>
                <div className="mt-1 text-xs text-gray-600">
                  <p className="mt-0.5">• Withdrawal requests are typically processed within 1-3 business days.</p>
                  <p className="mt-0.5">• Make sure your account details are correct to avoid processing delays.</p>
                  <p className="mt-0.5">• A small transaction fee may apply depending on the withdrawal method.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-4 pt-6 border-t">
            <button
              type="submit"
              className="px-6 py-2 bg-[#0d6577] hover:bg-[#0F7A8D] text-white font-medium rounded-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
            >
              Request Withdrawal
            </button>
            <button
              type="button"
              onClick={() => navigate('/member/withdrawals')}
              className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WithdrawalCreate;