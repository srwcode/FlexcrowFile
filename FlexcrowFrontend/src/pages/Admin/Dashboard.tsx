import { Link } from 'react-router-dom';
import { 
  Users, 
  Handshake, 
  ShoppingBag, 
  DollarSign, 
  Wallet, 
  MapPin, 
  CloudUpload,
  ArrowUpRight
} from 'lucide-react';

const Dashboard = () => {
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b-2 pb-8 mb-10 mt-2">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Admin Area</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-8">
        <Link to="/admin/users" className="group rounded-lg bg-white dark:bg-boxdark p-4 shadow transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="rounded-full bg-blue-100 dark:bg-blue-900/20 p-3">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="font-medium text-gray-900 dark:text-white">Users</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage user accounts</p>
              </div>
            </div>
            <ArrowUpRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 dark:text-gray-600 dark:group-hover:text-gray-400 transition-colors" />
          </div>
        </Link>

        {/* Transactions */}
        <Link to="/admin/transactions" className="group rounded-lg bg-white dark:bg-boxdark p-4 shadow transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="rounded-full bg-purple-100 dark:bg-purple-900/20 p-3">
                <Handshake className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="font-medium text-gray-900 dark:text-white">Transactions</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">View transaction history</p>
              </div>
            </div>
            <ArrowUpRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 dark:text-gray-600 dark:group-hover:text-gray-400 transition-colors" />
          </div>
        </Link>

        <Link to="/admin/products" className="group rounded-lg bg-white dark:bg-boxdark p-4 shadow transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-3">
                <ShoppingBag className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="font-medium text-gray-900 dark:text-white">Products</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage product catalog</p>
              </div>
            </div>
            <ArrowUpRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 dark:text-gray-600 dark:group-hover:text-gray-400 transition-colors" />
          </div>
        </Link>

        <Link to="/admin/payments" className="group rounded-lg bg-white dark:bg-boxdark p-4 shadow transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="rounded-full bg-yellow-100 dark:bg-yellow-900/20 p-3">
                <DollarSign className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="font-medium text-gray-900 dark:text-white">Payments</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Process payment records</p>
              </div>
            </div>
            <ArrowUpRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 dark:text-gray-600 dark:group-hover:text-gray-400 transition-colors" />
          </div>
        </Link>

        <Link to="/admin/withdrawals" className="group rounded-lg bg-white dark:bg-boxdark p-4 shadow transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-3">
                <Wallet className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="ml-4">
                <p className="font-medium text-gray-900 dark:text-white">Withdrawals</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage withdrawal requests</p>
              </div>
            </div>
            <ArrowUpRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 dark:text-gray-600 dark:group-hover:text-gray-400 transition-colors" />
          </div>
        </Link>

        <Link to="/admin/addresses" className="group rounded-lg bg-white dark:bg-boxdark p-4 shadow transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="rounded-full bg-indigo-100 dark:bg-indigo-900/20 p-3">
                <MapPin className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="ml-4">
                <p className="font-medium text-gray-900 dark:text-white">Addresses</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">View saved addresses</p>
              </div>
            </div>
            <ArrowUpRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 dark:text-gray-600 dark:group-hover:text-gray-400 transition-colors" />
          </div>
        </Link>

        <Link to="/admin/files" className="group rounded-lg bg-white dark:bg-boxdark p-4 shadow transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="rounded-full bg-teal-100 dark:bg-teal-900/20 p-3">
                <CloudUpload className="h-6 w-6 text-teal-600 dark:text-teal-400" />
              </div>
              <div className="ml-4">
                <p className="font-medium text-gray-900 dark:text-white">Files</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage uploaded files</p>
              </div>
            </div>
            <ArrowUpRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 dark:text-gray-600 dark:group-hover:text-gray-400 transition-colors" />
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;