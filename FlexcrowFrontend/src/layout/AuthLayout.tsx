import React, { ReactNode } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AuthLayout: React.FC<{ children: ReactNode }> = ({ children }) => {

  return (
    <div>
      <div className="flex h-screen overflow-hidden">

        <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">

          <main>
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
            />

            <div className="w-full bg-white">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
