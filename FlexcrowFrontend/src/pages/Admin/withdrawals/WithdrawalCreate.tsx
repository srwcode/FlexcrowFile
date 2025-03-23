import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import config from '../../../config';

interface WithdrawalFormData {
  user_id: string;
  status: 1 | 2 | 3;
  amount: string;
  method: string;
  account: string;
}

const WithdrawalCreate = () => {
  const navigate = useNavigate();
  const [error, setError] = React.useState<string | null>(null);
  
  const methods = ["promptpay", "truemoney", "paypal", "payoneer", "usdt", "skrill"];

  const [formData, setFormData] = React.useState<WithdrawalFormData>({
    user_id: '',
    status: 1,
    amount: '',
    method: '',
    account: ''
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.user_id) newErrors.user_id = 'User is required';

    if (!formData.status || (formData.status !== 1 && formData.status !== 2 && formData.status !== 3)) {
      newErrors.status = 'Status must be Pending or Completed or Canceled';
    }

    if (!formData.method) newErrors.method = 'Method is required';
    if (formData.method.length > 100) {
      newErrors.method = 'Method must not exceed 100 characters';
    }

    if (!formData.account) newErrors.account = 'Account is required';
    if (formData.account.length > 100) {
      newErrors.account = 'Account must not exceed 100 characters';
    }

    const amountStr = formData.amount as string;
    if (amountStr === '') {
      newErrors.amount = 'Amount is required';
    } else if (!/^(0\.\d{1,2}|[1-9]\d*(\.\d{1,2})?)$/.test(amountStr)) {
      newErrors.amount = 'Invalid amount format';
    } else {
      const amount = parseFloat(amountStr);
      if (amount < 1) {
        newErrors.amount = 'Amount must be greater than 1';
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

      toast.success('Withdrawal created successfully');
      navigate('/admin/withdrawals');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create withdrawal');
    }
  };

  return (
    <>
      <div className="rounded-sm border border-stroke bg-white px-8 py-6 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-6">Create Withdrawal</h1>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
            <label className="block mb-2">User</label>
            <input
                type="text"
                value={formData.user_id}
                onChange={e => setFormData({ ...formData, user_id: e.target.value })}
                className="w-full border p-2 rounded"
            />
            {errors.user_id && <p className="text-red-500 text-sm mt-2">{errors.user_id}</p>}
          </div>

          <div>
            <label className="block mb-2">Status</label>
            <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: Number(e.target.value) as 1 | 2 | 3 })}
                className="w-full border p-2 rounded"
            >
                <option value="1">Pending</option>
                <option value="2">Completed</option>
                <option value="3">Canceled</option>
            </select>
            {errors.status && <p className="text-red-500 text-sm mt-2">{errors.status}</p>}
          </div>

          <div>
            <label className="block mb-2">Amount</label>
            <input
                type="number"
                value={formData.amount}
                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                className="w-full border p-2 rounded"
                step="0.01"
            />
            {errors.amount && <p className="text-red-500 text-sm mt-2">{errors.amount}</p>}
          </div>

          <div>
            <label className="block mb-2">Method</label>
            <select
              value={formData.method}
              onChange={e => setFormData({ ...formData, method: e.target.value })}
              className="w-full border p-2 rounded"
            >
              <option value="">Select a method</option>
              {methods.map((method, index) => (
                <option key={index} value={method}>{method}</option>
              ))}
            </select>
            {errors.method && <p className="text-red-500 text-sm mt-2">{errors.method}</p>}
          </div>

          <div>
            <label className="block mb-2">Account</label>
            <input
                type="text"
                value={formData.account}
                onChange={e => setFormData({ ...formData, account: e.target.value })}
                className="w-full border p-2 rounded"
            />
            {errors.account && <p className="text-red-500 text-sm mt-2">{errors.account}</p>}
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 mt-4 rounded hover:bg-blue-600"
            >
              Submit
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/withdrawals')}
              className="bg-gray-500 text-white px-4 py-2 mt-4 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>

        </form>
      </div>
    </>
  );
};

export default WithdrawalCreate;