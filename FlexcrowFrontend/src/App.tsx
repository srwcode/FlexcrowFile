import { useEffect, useState } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import config from './config';

import Loader from './common/Loader';
import PageTitle from './components/PageTitle';

import MainLayout from './layout/MainLayout';
import MemberLayout from './layout/MemberLayout';
import AdminLayout from './layout/AdminLayout';
import AuthLayout from './layout/AuthLayout';

import Landing from './pages/Main/Landing';
import SignIn from './pages/Authentication/SignIn';
import SignUp from './pages/Authentication/SignUp';
import About from './pages/Main/About';
import Contact from './pages/Main/Contact';
import Terms from './pages/Main/Terms';
import Privacy from './pages/Main/Privacy';

import AdminDashboard from './pages/Admin/Dashboard';

import AdminUserIndex from './pages/Admin/users/UserIndex';
import AdminUserCreate from './pages/Admin/users/UserCreate';
import AdminUserEdit from './pages/Admin/users/UserEdit';
import AdminUserView from './pages/Admin/users/UserView';

import AdminFileIndex from './pages/Admin/files/FileIndex';
import AdminFileView from './pages/Admin/files/FileView';

import AdminProductIndex from './pages/Admin/products/ProductIndex';
import AdminProductCreate from './pages/Admin/products/ProductCreate';
import AdminProductEdit from './pages/Admin/products/ProductEdit';
import AdminProductView from './pages/Admin/products/ProductView';

import AdminAddressIndex from './pages/Admin/addresses/AddressIndex';
import AdminAddressCreate from './pages/Admin/addresses/AddressCreate';
import AdminAddressEdit from './pages/Admin/addresses/AddressEdit';
import AdminAddressView from './pages/Admin/addresses/AddressView';

import AdminPaymentIndex from './pages/Admin/payments/PaymentIndex';
import AdminPaymentCreate from './pages/Admin/payments/PaymentCreate';
import AdminPaymentEdit from './pages/Admin/payments/PaymentEdit';
import AdminPaymentView from './pages/Admin/payments/PaymentView';

import AdminWithdrawalIndex from './pages/Admin/withdrawals/WithdrawalIndex';
import AdminWithdrawalCreate from './pages/Admin/withdrawals/WithdrawalCreate';
import AdminWithdrawalEdit from './pages/Admin/withdrawals/WithdrawalEdit';
import AdminWithdrawalView from './pages/Admin/withdrawals/WithdrawalView';

import AdminTransactionIndex from './pages/Admin/transactions/TransactionIndex';
import AdminTransactionCreate from './pages/Admin/transactions/TransactionCreate';
import AdminTransactionEdit from './pages/Admin/transactions/TransactionEdit';
import AdminTransactionView from './pages/Admin/transactions/TransactionView';



import MemberDashboard from './pages/Member/Dashboard';
import MemberSettings from './pages/Member/Settings';

import MemberTransactionUser from './pages/Member/transactions/TransactionUser';
import MemberTransactionUserView from './pages/Member/transactions/TransactionUserView';
import MemberTransactionCustomer from './pages/Member/transactions/TransactionCustomer';
import MemberTransactionCustomerView from './pages/Member/transactions/TransactionCustomerView';
import MemberTransactionCreate from './pages/Member/transactions/TransactionCreate';

import MemberProductIndex from './pages/Member/products/ProductIndex';
import MemberProductCreate from './pages/Member/products/ProductCreate';
import MemberProductEdit from './pages/Member/products/ProductEdit';
import MemberProductView from './pages/Member/products/ProductView';

import MemberAddressIndex from './pages/Member/addresses/AddressIndex';
import MemberAddressCreate from './pages/Member/addresses/AddressCreate';
import MemberAddressEdit from './pages/Member/addresses/AddressEdit';
import MemberAddressView from './pages/Member/addresses/AddressView';

import MemberPaymentIndex from './pages/Member/payments/PaymentIndex';

import MemberWithdrawalIndex from './pages/Member/withdrawals/WithdrawalIndex';
import MemberWithdrawalCreate from './pages/Member/withdrawals/WithdrawalCreate';

function App() {
  const [loading, setLoading] = useState<boolean>(true);
  const { pathname } = useLocation();
  const [userType, setUserType] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  useEffect(() => {
    const authToken = localStorage.getItem('token');
    
    if (!authToken) {
      if (pathname.startsWith('/admin') || pathname.startsWith('/member')) {
        navigate('/auth/signin');
      }
    } else {
      fetch(`${config.API_URL}/auth/verify`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'token': authToken || ''
        }
      })
        .then((response) => response.json())
        .then((data) => {
          setUserType(data.user_type);

          if (data.user_type === 'USER') {
            if (pathname.startsWith('/admin') || pathname.startsWith('/auth')) {
              navigate('/member');
            }
          } else if (data.user_type === 'ADMIN') {
            if (pathname.startsWith('/member') || pathname.startsWith('/auth')) {
              navigate('/admin');
            }
          } else {
            if (pathname.startsWith('/admin') || pathname.startsWith('/member')) {
              navigate('/auth/signin');
            }
          }
        })
        .catch((error) => {
          console.error('Error fetching user type:', error);
          setUserType(null);
        });
    }
  }, [pathname, navigate]);

  if (loading) {
    return <Loader />;
  }

  let Layout;

  if (pathname.startsWith('/auth')) {
    Layout = AuthLayout;
  } else if (pathname.startsWith('/member') && userType === 'USER') {
    Layout = MemberLayout;
  } else if (pathname.startsWith('/admin') && userType === 'ADMIN') {
    Layout = AdminLayout;
  } else {
    Layout = MainLayout;
  }

  return (
    <Layout>
      <Routes>
        <Route
          index
          element={
            <>
              <PageTitle title="Flexcrow" />
              <Landing />
            </>
          }
        />
        <Route
          path="/auth/signin"
          element={
            <>
              <PageTitle title="Signin" />
              <SignIn />
            </>
          }
        />
        <Route
          path="/auth/signup"
          element={
            <>
              <PageTitle title="Signup" />
              <SignUp />
            </>
          }
        />
        <Route
          path="/about"
          element={
            <>
              <PageTitle title="About Us" />
              <About />
            </>
          }
        />
        <Route
          path="/contact"
          element={
            <>
              <PageTitle title="Contact Us" />
              <Contact />
            </>
          }
        />
        <Route
          path="/terms"
          element={
            <>
              <PageTitle title="Terms of Service" />
              <Terms />
            </>
          }
        />
        <Route
          path="/privacy"
          element={
            <>
              <PageTitle title="Privacy Policy" />
              <Privacy />
            </>
          }
        />
        

        

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <>
              <PageTitle title="Admin Dashboard" />
              <AdminDashboard />
            </>
          }
        />
        <Route
          path="/admin/users"
          element={
            <>
              <PageTitle title="Users" />
              <AdminUserIndex />
            </>
          }
        />
        <Route
          path="/admin/users/create"
          element={
            <>
              <PageTitle title="Create User" />
              <AdminUserCreate />
            </>
          }
        />
        <Route
          path="/admin/users/:user_id"
          element={
            <>
              <PageTitle title="User Details" />
              <AdminUserView />
            </>
          }
        />
        <Route
          path="/admin/users/:user_id/edit"
          element={
            <>
              <PageTitle title="Edit User" />
              <AdminUserEdit />
            </>
          }
        />
        <Route
          path="/admin/files"
          element={
            <>
              <PageTitle title="Files" />
              <AdminFileIndex />
            </>
          }
        />
        <Route
          path="/admin/files/:file_id"
          element={
            <>
              <PageTitle title="File Details" />
              <AdminFileView />
            </>
          }
        />
        <Route
          path="/admin/products"
          element={
            <>
              <PageTitle title="Products" />
              <AdminProductIndex />
            </>
          }
        />
        <Route
          path="/admin/products/create"
          element={
            <>
              <PageTitle title="Create Product" />
              <AdminProductCreate />
            </>
          }
        />
        <Route
          path="/admin/products/:product_id"
          element={
            <>
              <PageTitle title="Product Details" />
              <AdminProductView />
            </>
          }
        />
        <Route
          path="/admin/products/:product_id/edit"
          element={
            <>
              <PageTitle title="Edit Product" />
              <AdminProductEdit />
            </>
          }
        />
        <Route
          path="/admin/addresses"
          element={
            <>
              <PageTitle title="Addresses" />
              <AdminAddressIndex />
            </>
          }
        />
        <Route
          path="/admin/addresses/create"
          element={
            <>
              <PageTitle title="Create Address" />
              <AdminAddressCreate />
            </>
          }
        />
        <Route
          path="/admin/addresses/:address_id"
          element={
            <>
              <PageTitle title="Address Details" />
              <AdminAddressView />
            </>
          }
        />
        <Route
          path="/admin/addresses/:address_id/edit"
          element={
            <>
              <PageTitle title="Edit Address" />
              <AdminAddressEdit />
            </>
          }
        />
        <Route
          path="/admin/payments"
          element={
            <>
              <PageTitle title="Payments" />
              <AdminPaymentIndex />
            </>
          }
        />
        <Route
          path="/admin/payments/create"
          element={
            <>
              <PageTitle title="Create Payment" />
              <AdminPaymentCreate />
            </>
          }
        />
        <Route
          path="/admin/payments/:payment_id"
          element={
            <>
              <PageTitle title="Payment Details" />
              <AdminPaymentView />
            </>
          }
        />
        <Route
          path="/admin/payments/:payment_id/edit"
          element={
            <>
              <PageTitle title="Edit Payment" />
              <AdminPaymentEdit />
            </>
          }
        />
        <Route
          path="/admin/withdrawals"
          element={
            <>
              <PageTitle title="Withdrawals" />
              <AdminWithdrawalIndex />
            </>
          }
        />
        <Route
          path="/admin/withdrawals/create"
          element={
            <>
              <PageTitle title="Create Withdrawal" />
              <AdminWithdrawalCreate />
            </>
          }
        />
        <Route
          path="/admin/withdrawals/:withdrawal_id"
          element={
            <>
              <PageTitle title="Withdrawal Details" />
              <AdminWithdrawalView />
            </>
          }
        />
        <Route
          path="/admin/withdrawals/:withdrawal_id/edit"
          element={
            <>
              <PageTitle title="Edit Withdrawal" />
              <AdminWithdrawalEdit />
            </>
          }
        />
        <Route
          path="/admin/transactions"
          element={
            <>
              <PageTitle title="Transactions" />
              <AdminTransactionIndex />
            </>
          }
        />
        <Route
          path="/admin/transactions/create"
          element={
            <>
              <PageTitle title="Create Transaction" />
              <AdminTransactionCreate />
            </>
          }
        />
        <Route
          path="/admin/transactions/:transaction_id"
          element={
            <>
              <PageTitle title="Transaction Details" />
              <AdminTransactionView />
            </>
          }
        />
        <Route
          path="/admin/transactions/:transaction_id/edit"
          element={
            <>
              <PageTitle title="Edit Transaction" />
              <AdminTransactionEdit />
            </>
          }
        />

        {/* Member */}
        <Route
          path="/member"
          element={
            <>
              <PageTitle title="Dashboard" />
              <MemberDashboard />
            </>
          }
        />
        <Route
          path="/member/settings"
          element={
            <>
              <PageTitle title="Account Settings" />
              <MemberSettings />
            </>
          }
        />
        <Route
          path="/member/products"
          element={
            <>
              <PageTitle title="Products" />
              <MemberProductIndex />
            </>
          }
        />
        <Route
          path="/member/products/create"
          element={
            <>
              <PageTitle title="Create Product" />
              <MemberProductCreate />
            </>
          }
        />
        <Route
          path="/member/products/:product_id"
          element={
            <>
              <PageTitle title="Product Details" />
              <MemberProductView />
            </>
          }
        />
        <Route
          path="/member/products/:product_id/edit"
          element={
            <>
              <PageTitle title="Edit Product" />
              <MemberProductEdit />
            </>
          }
        />
        <Route
          path="/member/addresses"
          element={
            <>
              <PageTitle title="Addresses" />
              <MemberAddressIndex />
            </>
          }
        />
        <Route
          path="/member/addresses/create"
          element={
            <>
              <PageTitle title="Create Address" />
              <MemberAddressCreate />
            </>
          }
        />
        <Route
          path="/member/addresses/:address_id"
          element={
            <>
              <PageTitle title="Address Details" />
              <MemberAddressView />
            </>
          }
        />
        <Route
          path="/member/addresses/:address_id/edit"
          element={
            <>
              <PageTitle title="Edit Address" />
              <MemberAddressEdit />
            </>
          }
        />
        <Route
          path="/member/payments"
          element={
            <>
              <PageTitle title="Payments" />
              <MemberPaymentIndex />
            </>
          }
        />
        <Route
          path="/member/withdrawals"
          element={
            <>
              <PageTitle title="Withdrawals" />
              <MemberWithdrawalIndex />
            </>
          }
        />
        <Route
          path="/member/withdrawals/create"
          element={
            <>
              <PageTitle title="Request Withdrawal" />
              <MemberWithdrawalCreate />
            </>
          }
        />
        <Route
          path="/member/transactions/sell"
          element={
            <>
              <PageTitle title="Transactions" />
              <MemberTransactionUser />
            </>
          }
        />
        <Route
          path="/member/transactions/sell/:transaction_id"
          element={
            <>
              <PageTitle title="Transaction Details" />
              <MemberTransactionUserView />
            </>
          }
        />
        <Route
          path="/member/transactions/buy"
          element={
            <>
              <PageTitle title="Transactions" />
              <MemberTransactionCustomer />
            </>
          }
        />
        <Route
          path="/member/transactions/buy/:transaction_id"
          element={
            <>
              <PageTitle title="Transaction Details" />
              <MemberTransactionCustomerView />
            </>
          }
        />
        <Route
          path="/member/transactions/create"
          element={
            <>
              <PageTitle title="Create Transaction" />
              <MemberTransactionCreate />
            </>
          }
        />
        


      </Routes>
    </Layout>
  );
}

export default App;
