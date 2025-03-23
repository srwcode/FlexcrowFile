import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { format, formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import { toast } from 'react-toastify';
import { Send, Loader2, Package, Truck, ArrowRight, CreditCard, CheckCircle, AlertCircle, Clock, CircleAlert, PackageCheck, CircleX, MessageCircleQuestion } from 'lucide-react';
import { createPortal } from 'react-dom';
import config from '../../../config';
import emailjs from '@emailjs/browser';

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
  fee_type: 1 | 2 | 3;
  created_at: string;
  updated_at: string;
}

interface ImageData {
  id: string;
  url: string;
}

interface ImagesData {
  id: string;
  url: string;
}

interface VideoData {
  id: string;
  url: string;
}

interface Address {
  user_id: string;
  name: string;
  full_name: string;
  type: 1 | 2;
  phone: string;
  address_1: string;
  address_2: string;
  subdistrict: string;
  district: string;
  province: string;
  country: string;
  postal_code: string;
}

interface Product {
  user_id: string;
  name: string;
  type: 1 | 2;
  description: string;
  price: number;
  image_id: string[];
  video_id: string;
}

interface Address {
  address_id: string;
  user_id: string;
  name: string;
  full_name: string;
  phone: string;
  address_1: string;
  address_2: string;
  subdistrict: string;
  district: string;
  province: string;
  country: string;
  postal_code: string;
}

const TransactionCustomerView = () => {
  const { transaction_id } = useParams<{ transaction_id: string }>();
  const [transaction, setTransaction] = React.useState<Transaction | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [buyer, setBuyer] = useState<string>('');
  const [buyerEmail, setBuyerEmail] = useState<string>('');
  const [customer, setCustomer] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [customerImage, setCustomerImage] = useState<{ id: string; url: string } | null>(null);
  const [customerBalance, setCustomerBalance] = useState<GLfloat>(0);
  const [loadingCustomer, setLoadingCustomer] = useState<boolean>(false);
  const [address, setAddress] = React.useState<Address | null>(null);
  const [product, setProduct] = React.useState<Product | null>(null);
  const [image, setImage] = useState<ImageData | null>(null);
  const [images, setImages] = useState<ImagesData[]>([]);
  const [video, setVideo] = useState<VideoData | null>(null);
  const [fullscreenMedia, setFullscreenMedia] = useState<{type: 'image' | 'video', url: string} | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [acceptanceStep, setAcceptanceStep] = useState<'initial' | 'address' | 'confirm'>('initial');
  const [addresses, setAddresses] = React.useState<Address[]>([]);
  const [defaultAddressId, setDefaultAddressId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [activeTab, setActiveTab] = useState('basic');

  let step = 0;

  if(transaction) {
    if(transaction.status === 1) {
      step = 1;
    } else if (transaction.status === 2) {
      if (transaction.payment_id == "") {
        step = 2;
      } else if (transaction.type === 1 && transaction.shipping_number === "") {
        step = 3;
      } else if (transaction.type === 1 && transaction.shipping_number !== "" && transaction.delivered_at === null ) {
        step = 4;
      } else if (transaction.type === 2 && transaction.delivered_at === null) {
        step = 5;
      } else if (transaction.delivered_at !== null ) {
        step = 6;
      }
    } else if (transaction.status === 3) {
      step = 7;
    }
  }

  React.useEffect(() => {
    const fetchTransaction = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${config.API_URL}/transactions/${transaction_id}?customer_id=current`, {
          headers: {
            'Content-Type': 'application/json',
            'token': token || ''
          }
        });

        if (!response.ok) throw new Error('Failed to fetch transaction');
        const data = await response.json();
        setTransaction(data);

        if (data.shipping_image_id) {
          const imageResponse = await fetch(`${config.API_URL}/files/${data.shipping_image_id}`, {
            headers: {
              'token': token || ''
            }
          });
          if (imageResponse.ok) {
            const imageData = await imageResponse.json();
            setImage({
              id: data.shipping_image_id,
              url: imageData.cloud_url
            });
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load transaction');
      } finally {
        setLoading(false);
      }
    };

    fetchTransaction();
  }, [transaction_id]);

  useEffect(() => {
    const fetchCustomer = async () => {
      const customerId = transaction?.user_id;

      if (customerId) {
        setLoadingCustomer(true);

        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${config.API_URL}/users/username?user_id=${customerId}`, {
            headers: {
              'Content-Type': 'application/json',
              'token': token || ''
            }
          });

          if (!response.ok) {
            throw new Error('Failed to fetch username');
          }

          const data = await response.json();
          setCustomer(data.username);
          setCustomerName(data.first_name + ' ' + data.last_name);
          setCustomerPhone(data.phone);
          setCustomerEmail(data.email);
          setCustomerBalance(data.balance);

          if (data.image_id) {
            const imageResponse = await fetch(`${config.API_URL}/files/${data.image_id}`, {
              headers: {
                'token': token || ''
              }
            });
            
            if (imageResponse.ok) {
              const imageData = await imageResponse.json();
              setCustomerImage({ id: data.image_id, url: imageData.cloud_url });
            }
          }

        } catch (error) {
          console.error('Error fetching username:', error);
          setCustomer('Unknown User');
        } finally {
          setLoadingCustomer(false);
        }
      }
    };

    if (transaction && transaction.user_id) {
      fetchCustomer();
    }
  }, [transaction]);

  useEffect(() => {
    const fetchAddress = async () => {

      const addressId = transaction?.address_id;

      if (addressId) {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${config.API_URL}/addresses/${addressId}`, {
            headers: {
              'Content-Type': 'application/json',
              'token': token || ''
            }
          });

          if (!response.ok) throw new Error('Failed to fetch address');
          const data = await response.json();
          setAddress(data);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load address');
        } finally {
          setLoading(false);
        }
      };
    }

    if (transaction && transaction.address_id) {
      fetchAddress();
    }
  }, [transaction]);

  useEffect(() => {
    const fetchProduct = async () => {

      const productId = transaction?.product_id;

      if (productId) {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${config.API_URL}/products/${productId}?transaction=true`, {
            headers: {
              'Content-Type': 'application/json',
              'token': token || ''
            }
          });

          if (!response.ok) throw new Error('Failed to fetch product');
          const data = await response.json();
          setProduct(data);

          if (data.image_id && Array.isArray(data.image_id)) {
            const imagePromises = data.image_id.map(async (imageId: string) => {
              const fileResponse = await fetch(`${config.API_URL}/files/${imageId}`, {
                headers: {
                  'token': token || ''
                }
              });
              if (fileResponse.ok) {
                const fileData = await fileResponse.json();
                return {
                  id: imageId,
                  url: fileData.cloud_url
                };
              }
              return null;
            });
  
            const imageResults = await Promise.all(imagePromises);
            const validImages = imageResults.filter((img): img is ImageData => img !== null);
            setImages(validImages);
          }
  
          if (data.video_id) {
            const videoResponse = await fetch(`${config.API_URL}/files/${data.video_id}`, {
              headers: {
                'token': token || ''
              }
            });
            if (videoResponse.ok) {
              const videoData = await videoResponse.json();
              setVideo({
                id: data.video_id,
                url: videoData.cloud_url
              });
            }
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load product');
        } finally {
          setLoading(false);
        }
      };
    }

    if (transaction && transaction.product_id) {
      fetchProduct();
    }
  }, [transaction]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${format(date, "dd MMMM yyyy | HH:mm", { locale: enUS })} (${formatDistanceToNow(date, { addSuffix: true, locale: enUS })})`;
  };

  const handleDeliveryConfirmation = async () => {
    try {
      const token = localStorage.getItem('token');
      const dataToSubmit = {
        delivered_at: new Date().toISOString(),
      };
      
      const response = await fetch(`${config.API_URL}/transactions/${transaction_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "token": token || "",
        },
        body: JSON.stringify(dataToSubmit),
      });

      if (!response.ok) {
        const responseData = await response.json();
        throw new Error(responseData.error || 'Failed to update transaction');
      }

      window.location.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to confirm delivery');
    }
  };

  let amountBuyer = 0;
  let amountSeller = 0;

  if(transaction && product) {

    let amountDefault = product.price*transaction.product_number+transaction.shipping_price

    if(transaction.fee_type === 1) {
      amountBuyer = amountDefault+transaction.fee;
      amountSeller = amountDefault;
    } else if (transaction.fee_type === 2) {
      amountBuyer = amountDefault;
      amountSeller = amountDefault-transaction.fee;
    } else if (transaction.fee_type === 3) {
      amountBuyer = amountDefault+transaction.fee/2;
      amountSeller = amountDefault-transaction.fee/2;
    }
  }

  useEffect(() => {
    const authToken = localStorage.getItem('token');
    
    if (!authToken) return;
    
    const fetchMainAddress = async () => {
      try {
        const response = await fetch(`${config.API_URL}/auth/data`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'token': authToken || '',
          },
        });
  
        if (!response.ok) {
          throw new Error('Failed to verify user');
        }
  
        const data = await response.json();
  
        if (transaction?.type === 1) {
          if(data.address_id) {
            setDefaultAddressId(data.address_id);
          }
        }

        setBuyer(data.username);
        setBuyerEmail(data.email);
        
      } catch (error) {
        console.error('Error verifying user:', error);
      }
    };
  
    fetchMainAddress();
  }, [transaction]);
  
  const fetchAddresses = async () => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user_id') || 'current';
      const response = await fetch(`${config.API_URL}/addresses?user_id=${userId}`, {
        headers: {
          'Content-Type': 'application/json',
          'token': token || ''
        }
      });
  
      if (!response.ok) throw new Error('Failed to fetch addresses');
      const data = await response.json();
      if (data && Array.isArray(data.address_items)) {
        setAddresses(data.address_items);
        
        if (defaultAddressId && data.address_items.some((addr: Address) => addr.address_id === defaultAddressId)) {
          setSelectedAddressId(defaultAddressId);
        } else if (data.address_items.length > 0) {
          setSelectedAddressId(data.address_items[0].address_id);
        }
      } else {
        setAddresses([]);
      }
    } catch (err) {
      console.error('Error fetching addresses:', err);
      toast.error('Failed to load addresses');
      setAddresses([]);
    }
  };

  const handleAcceptTransaction = async () => {
    if (transaction?.type === 1 && acceptanceStep === 'initial') {
      setAcceptanceStep('address');
      fetchAddresses();
      return;
    }

    if (transaction?.type === 1 && acceptanceStep === 'address' && !selectedAddressId) {
      toast.error('Please select a shipping address');
      return;
    }

    setProcessingAction('accepting');
    try {
      const token = localStorage.getItem('token');
      const dataToSubmit: any = {
        status: 2
      };

      if (selectedAddressId) {
        dataToSubmit.address_id = selectedAddressId;
      }

      const response = await fetch(`${config.API_URL}/transactions/${transaction_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'token': token || ''
        },
        body: JSON.stringify(dataToSubmit)
      });

      if (!response.ok) {
        const responseData = await response.json();
        throw new Error(responseData.error || 'Failed to accept transaction');
      }

      window.location.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to accept transaction');
    } finally {
      setProcessingAction(null);
    }
  };

  const handleRejectTransaction = async () => {

    const isConfirmed = window.confirm("Are you sure?");
  
    if (!isConfirmed) {
      return;
    }

    setProcessingAction('rejecting');
    try {
      const token = localStorage.getItem('token');
      const dataToSubmit = {
        ...(transaction ? { delivered_at: transaction.delivered_at } : {}),
        status: 5
      };

      const response = await fetch(`${config.API_URL}/transactions/${transaction_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'token': token || ''
        },
        body: JSON.stringify(dataToSubmit)
      });

      if (!response.ok) {
        const responseData = await response.json();
        throw new Error(responseData.error || 'Failed to reject transaction');
      }

      window.location.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reject transaction');
    } finally {
      setProcessingAction(null);
    }
  };

  const handleCompleteTransaction = async () => {

    const isConfirmed = window.confirm("Are you sure?");
  
    if (!isConfirmed) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const dataToSubmit = {
        ...(transaction ? { delivered_at: transaction.delivered_at } : {}),
        status: 3
      };

      const response = await fetch(`${config.API_URL}/transactions/${transaction_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'token': token || ''
        },
        body: JSON.stringify(dataToSubmit)
      });

      if (!response.ok) {
        const responseData = await response.json();
        throw new Error(responseData.error || 'Failed to complete transaction');
      } else {

        if(transaction) {

          const dataUserToSubmit = {
            balance: (customerBalance + amountSeller) || 0
          };
          
          try {
            const response = await fetch(`${config.API_URL}/users/${transaction.user_id}?transaction=true`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                "token": token || "",
              },
              body: JSON.stringify(dataUserToSubmit),
            });
        
            const responseData = await response.json();
      
            if (!response.ok) {
              throw new Error(responseData.error || 'Failed to update user');
            }
          } catch (err) {
            console.error("Update error:", err);
          }
        }
      }

      window.location.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to complete transaction');
    } finally {
      setProcessingAction(null);
    }
  };

  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleDisputeTransaction = () => {
    setShowRejectionForm(true);
  };

  const RejectionFormModal = () => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    
    useEffect(() => {
      if (showRejectionForm && textareaRef.current) {
        textareaRef.current.value = rejectionReason;
        setTimeout(() => {
          textareaRef.current?.focus();
        }, 0);
      }
    }, [showRejectionForm, rejectionReason]);
  
    const handleSubmit = () => {
      const currentReason = textareaRef.current?.value || '';
      
      if (!currentReason.trim()) {
        toast.error("Please provide a reason for rejection");
        return;
      }

      setRejectionReason(currentReason);
      setProcessingAction("rejecting");
      submitRejectionWithReason(currentReason);
    };
    
    const submitRejectionWithReason = async (reason: string) => {
      try {
        const emailParams = {
          to_email: `${config.EMAIL_TO}`,
          url_email: `${config.EMAIL_URL}`,
          transaction_id: transaction_id,
          buyer_name: buyer,
          buyer_email: buyerEmail,
          seller_name: customer,
          seller_email: customerEmail,
          reason: reason,
          title: "Transaction Disputed",
          description: "The transaction has been disputed and requires your attention. Please review the details below and take appropriate action."
        };
    
        emailjs.init(`${config.EMAIL_API}`);
    
        const response = await emailjs.send(
          `${config.EMAIL_SERVICE}`,
          `${config.EMAIL_TEMPLATE_Transaction}`,
          emailParams
        );
    
        console.log("Email sent successfully:", response);
    
        const token = localStorage.getItem('token');
        const dataToSubmit = {
          ...(transaction ? { delivered_at: transaction.delivered_at } : {}),
          status: 6
        };
      
        const apiResponse = await fetch(`${config.API_URL}/transactions/${transaction_id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'token': token || ''
          },
          body: JSON.stringify(dataToSubmit)
        });
    
        if (!apiResponse.ok) {
          const responseData = await apiResponse.json();
          throw new Error(responseData.error || 'Failed to update transaction');
        }

        setShowRejectionForm(false);
        window.location.reload();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to process rejection');
      } finally {
        setProcessingAction(null);
      }
    };
  
    if (!showRejectionForm) return null;
  
    return createPortal(
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-999">
        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-2.5">Reject Transaction</h2>
          <p className="mb-4.5 text-gray-600">
            Please provide a reason for rejecting this transaction.
          </p>
          <textarea
            ref={textareaRef}
            defaultValue={rejectionReason}
            placeholder="Enter reason for rejection"
            className="w-full border bg-white border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition duration-150 h-40 resize-none mb-5"
          />
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setShowRejectionForm(false);
                setRejectionReason('');
              }}
              className="px-4.5 py-2.5 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={processingAction === "rejecting"}
              className="px-4.5 py-2.5 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors flex items-center"
            >
              {processingAction === "rejecting" ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit"
              )}
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsProcessing(true);
    
    const dataToSubmit = {
      amount: amountBuyer,
      currency: 'thb',
      description: 'Transaction #' + transaction_id,
      method: 'card',
    };

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.API_URL}/pay?transaction=${transaction_id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': token || ''
        },
        body: JSON.stringify(dataToSubmit)
      });

      const responseData = await response.json();
      
      if (response.ok) {
        window.location.href = responseData.checkout_url;
      } else {
        throw new Error(responseData.error || 'Error');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error';
      setError(errorMessage);
      toast.error(errorMessage);
      setIsProcessing(false);
    }
  };

  const [searchParams] = useSearchParams();
  const paymentID = searchParams.get("payment")
  const paymentStatus = searchParams.get("payment_status")

  useEffect(() => {
    const handlePaymentUpdate = async () => {
      if(paymentID) {
        const fetchPayment = async () => {
          try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${config.API_URL}/payments/${paymentID}`, {
              headers: {
                'Content-Type': 'application/json',
                'token': token || ''
              }
            });
    
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();

            if(data.status === 1) {

              let newPaymentStatus;

              if(paymentStatus) {
                if(paymentStatus === "success") {
                  newPaymentStatus = 2;
                } else if (paymentStatus === "cancel") {
                  newPaymentStatus = 3;
                }
              }

              if(newPaymentStatus) {

                try {
                  const paymentUpdateData = {
                    status: newPaymentStatus
                  };
        
                  const responseUpdate = await fetch(`${config.API_URL}/payments/${data.payment_id}`, {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                      'token': token || ''
                    },
                    body: JSON.stringify(paymentUpdateData)
                  });

                  if (responseUpdate.ok) {

                    if(newPaymentStatus === 2) {

                      try {
                        const transactionUpdateData = {
                          payment_id: data.payment_id,
                          ...(transaction?.delivered_at ? { delivered_at: transaction.delivered_at } : {})
                        };
              
                        const responseTran = await fetch(`${config.API_URL}/transactions/${transaction_id}`, {
                          method: 'PUT',
                          headers: {
                            'Content-Type': 'application/json',
                            'token': token || ''
                          },
                          body: JSON.stringify(transactionUpdateData)
                        });

                        if (responseTran.ok) {
                          window.location.href = `/member/transactions/buy/${transaction_id}`;
                        }
                      } catch (updateError) {
                        console.error('Error updating transaction:', updateError);
                      }
                    } else {
                      window.location.href = `/member/transactions/buy/${transaction_id}`;
                    }
                  }

                } catch (updateError) {
                  console.error('Error updating payment:', updateError);
                }
              }
            }

          } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load address');
          } finally {
            setLoading(false);
          }
        };

        fetchPayment();
      }
    };

    handlePaymentUpdate();
  }, [paymentID, paymentStatus, transaction_id, transaction]);

  const openFullscreen = (type: 'image' | 'video', url: string) => {
    setFullscreenMedia({ type, url });
    document.body.style.overflow = 'hidden';
  };

  const closeFullscreen = () => {
    setFullscreenMedia(null);
    document.body.style.overflow = '';
  };

  React.useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && fullscreenMedia) {
        closeFullscreen();
      }
    };

    window.addEventListener('keydown', handleEscKey);
    return () => {
      window.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = '';
    };
  }, [fullscreenMedia]);


  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const handleCancelTransaction = () => {
    setShowCancelForm(true);
  };

  const CancelFormModal = () => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    
    useEffect(() => {
      if (showCancelForm && textareaRef.current) {
        textareaRef.current.value = cancelReason;
        setTimeout(() => {
          textareaRef.current?.focus();
        }, 0);
      }
    }, [showCancelForm, cancelReason]);
  
    const handleSubmit = () => {
      const currentReason = textareaRef.current?.value || '';
      
      if (!currentReason.trim()) {
        toast.error("Please provide a reason for cancel");
        return;
      }

      setCancelReason(currentReason);
      setProcessingAction("cancelling");
      submitCancelWithReason(currentReason);
    };
    
    const submitCancelWithReason = async (reason: string) => {
      try {
        const emailParams = {
          to_email: `${config.EMAIL_TO}`,
          url_email: `${config.EMAIL_URL}`,
          transaction_id: transaction_id,
          buyer_name: buyer,
          buyer_email: buyerEmail,
          seller_name: customer,
          seller_email: customerEmail,
          reason: reason,
          title: "Transaction Cancellation",
          description: "The transaction has been requested for cancellation by buyer and requires your attention. Please review the details below and take appropriate action."
        };
    
        emailjs.init(`${config.EMAIL_API}`);
    
        const response = await emailjs.send(
          `${config.EMAIL_SERVICE}`,
          `${config.EMAIL_TEMPLATE_Transaction}`,
          emailParams
        );
    
        console.log("Email sent successfully:", response);

        setShowCancelForm(false);
        toast.success('Request sent successfully');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to process cancel');
      } finally {
        setProcessingAction(null);
      }
    };
  
    if (!showCancelForm) return null;
  
    return createPortal(
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-999">
        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-2.5">Cancel Transaction</h2>
          <p className="mb-4.5 text-gray-600">
            Please provide a reason for cancelling this transaction.
          </p>
          <textarea
            ref={textareaRef}
            defaultValue={cancelReason}
            placeholder="Enter reason for cancel"
            className="w-full border bg-white border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition duration-150 h-40 resize-none mb-5"
          />
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setShowCancelForm(false);
                setCancelReason('');
              }}
              className="px-4.5 py-2.5 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={processingAction === "cancelling"}
              className="px-4.5 py-2.5 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors flex items-center"
            >
              {processingAction === "cancelling" ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit"
              )}
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  };


  const [showHelpForm, setShowHelpForm] = useState(false);
  const [helpReason, setHelpReason] = useState('');

  const handleHelpTransaction = () => {
    setShowHelpForm(true);
  };

  const HelpFormModal = () => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    
    useEffect(() => {
      if (showHelpForm && textareaRef.current) {
        textareaRef.current.value = helpReason;
        setTimeout(() => {
          textareaRef.current?.focus();
        }, 0);
      }
    }, [showHelpForm, helpReason]);
  
    const handleSubmit = () => {
      const currentReason = textareaRef.current?.value || '';
      
      if (!currentReason.trim()) {
        toast.error("Please provide a message");
        return;
      }

      setHelpReason(currentReason);
      setProcessingAction("helping");
      submitHelpWithReason(currentReason);
    };
    
    const submitHelpWithReason = async (reason: string) => {
      try {
        const emailParams = {
          to_email: `${config.EMAIL_TO}`,
          url_email: `${config.EMAIL_URL}`,
          transaction_id: transaction_id,
          buyer_name: buyer,
          buyer_email: buyerEmail,
          seller_name: customer,
          seller_email: customerEmail,
          request_by: "Buyer",
          message: reason
        };
    
        emailjs.init(`${config.EMAIL_API}`);
    
        const response = await emailjs.send(
          `${config.EMAIL_SERVICE}`,
          `${config.EMAIL_TEMPLATE_HELP}`,
          emailParams
        );
    
        console.log("Email sent successfully:", response);

        setShowHelpForm(false);
        toast.success('Message sent successfully');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to process help');
      } finally {
        setProcessingAction(null);
      }
    };
  
    if (!showHelpForm) return null;
  
    return createPortal(
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-999">
        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-2.5">Transaction Support</h2>
          <p className="mb-4.5 text-gray-600">
            Please provide details about your transaction issue.
          </p>
          <textarea
            ref={textareaRef}
            defaultValue={helpReason}
            placeholder="Enter message"
            className="w-full border bg-white border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition duration-150 h-40 resize-none mb-5"
          />
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setShowHelpForm(false);
                setHelpReason('');
              }}
              className="px-4.5 py-2.5 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={processingAction === "helping"}
              className="px-4.5 py-2.5 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors flex items-center"
            >
              {processingAction === "helping" ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit"
              )}
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="w-12 h-12 animate-spin text-cyan-600" />
    </div>
  );
  
  if (error) return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
        <p className="text-gray-600">{error}</p>
      </div>
    </div>
  );
  
  if (!transaction || !product) return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Transaction Not Found</h2>
        <p className="text-gray-600">We couldn't find the requested transaction.</p>
      </div>
    </div>
  );

  return (
    <>

      {fullscreenMedia && createPortal(
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center p-4" 
          style={{ 
            zIndex: 9999,
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }}
        >
          <div className="relative w-full h-full flex justify-center items-center">
            <button 
              onClick={closeFullscreen}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70 transition-all z-10"
              aria-label="Close fullscreen view"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="max-h-full max-w-full flex items-center justify-center">
              {fullscreenMedia.type === 'image' ? (
                <img 
                  src={fullscreenMedia.url} 
                  alt="Full screen view" 
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <video 
                  src={fullscreenMedia.url} 
                  controls 
                  autoPlay 
                  className="max-h-full max-w-full"
                />
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
            
      <div className="bg-white rounded-lg shadow-lg overflow-auto mb-12">
        <div className="bg-gradient-to-r px-6 py-4 min-w-[750px]" style={{ background: 'linear-gradient(to right, #0D6577, #0A5666)' }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">Transaction #{transaction.transaction_id}</h1>
              <p className="text-sm text-cyan-50 mt-1">
                Created {formatDistanceToNow(new Date(transaction.created_at), { addSuffix: true })}
              </p>
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-teal-100 text-teal-800">
              {transaction.status === 1 ? (
                'Pending'
              ) : transaction.status === 2 ? (
                'Processing'
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
          </div>
        </div>
        
        <div className="pt-8 pb-6 px-10 min-w-[750px]">

          {transaction.status === 4 ? (
          <div className="flex items-center justify-center py-4 mb-4">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Transaction Canceled</h2>
              <p className="text-gray-600">Please contact us if you need assistance.</p>
            </div>
          </div>
          ) : transaction.status === 5 ? (
          <div className="flex items-center justify-center py-4 mb-4">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Transaction Rejected</h2>
              <p className="text-gray-600">You have rejected this offer.</p>
            </div>
          </div>
          ) : transaction.status === 6 ? (
            <div className="flex items-center justify-center py-4 mb-4">
              <div className="text-center">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Transaction Disputed</h2>
                <p className="text-gray-600">You have rejected the product.</p>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-100 mt-8">
                  <p className="text-sm text-yellow-800">
                  We will review and request additional details from both the buyer and the seller, and will notify the results of the dispute via your email.
                  </p>
                </div>
              </div>
            </div>
          ) :
          <>
          <div className="mb-10">
            <div className="flex items-center justify-between">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-cyan-600 text-white' : 'bg-gray-200'}`}>
                  <Send className="w-5 h-5" />
                </div>
                <p className="text-xs mt-2 text-center">Offered</p>
              </div>
              <div className={`flex-1 h-1 mx-2 ${step >= 2 ? 'bg-cyan-600' : 'bg-gray-200'}`}></div>
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step > 2 ? 'bg-cyan-600 text-white' : 'bg-gray-200'}`}>
                  <CreditCard className="w-5 h-5" />
                </div>
                <p className="text-xs mt-2 text-center">Paid</p>
              </div>
              <div className={`flex-1 h-1 mx-2 ${step >= 3 ? 'bg-cyan-600' : 'bg-gray-200'}`}></div>

              {transaction.type === 1 && (
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step > 3 ? 'bg-cyan-600 text-white' : 'bg-gray-200'}`}>
                  <Truck className="w-5 h-5" />
                </div>
                <p className="text-xs mt-2 text-center">Shipped</p>
              </div>
              )}

              {transaction.type === 1 && (
              <div className={`flex-1 h-1 mx-2 ${step >= 4 ? 'bg-cyan-600' : 'bg-gray-200'}`}></div>
              )}

              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 6 ? 'bg-cyan-600 text-white' : 'bg-gray-200'}`}>
                  <PackageCheck className="w-5 h-5" />
                </div>
                <p className="text-xs mt-2 text-center">Delivered</p>
              </div>
              <div className={`flex-1 h-1 mx-2 ${step >= 6 ? 'bg-cyan-600' : 'bg-gray-200'}`}></div>
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step == 7 ? 'bg-cyan-600 text-white' : 'bg-gray-200'}`}>
                  <CheckCircle className="w-5 h-5" />
                </div>
                <p className="text-xs mt-2 text-center">Verified</p>
              </div>
            </div>
          </div>

          {step === 1 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
              <div className="flex items-start">
                <Send className="w-6 h-6 text-yellow-500 mr-4 flex-shrink-0 mt-1" />
                <div className="w-full">
                  <h2 className="text-lg font-bold text-gray-800 mb-2">New Transaction Offer</h2>
                  <p className="text-gray-600 mb-6">You have received a new transaction offer. Please review the details and decide whether to accept or reject it.</p>
                  
                  {acceptanceStep === 'initial' && (
                    <div className="flex justify-end space-x-4">
                      <button
                        onClick={handleAcceptTransaction}
                        disabled={processingAction !== null}
                        className="px-6 py-3 bg-cyan-600 text-white font-medium rounded-md hover:bg-cyan-700 transition-colors"
                      >
                        {processingAction === 'accepting' ? (
                          <><Loader2 className="w-4 h-4 mr-2 inline animate-spin" /> Accepting...</>
                        ) : 'Accept'}
                      </button>
                      <button
                        onClick={handleRejectTransaction}
                        disabled={processingAction !== null}
                        className="px-6 py-3 bg-red-100 text-red-600 font-medium rounded-md hover:bg-red-200 transition-colors"
                      >
                        {processingAction === 'rejecting' ? (
                          <><Loader2 className="w-4 h-4 mr-2 inline animate-spin" /> Rejecting...</>
                        ) : 'Reject'}
                      </button>
                    </div>
                  )}
                  
                  {acceptanceStep === 'address' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-md font-semibold text-gray-800 mb-4">Select Shipping Address</h3>
                        
                        {addresses.length === 0 ? (
                          <div className="bg-white p-4 border border-gray-200 rounded-lg">
                            <p className="text-gray-500">No addresses found. Please add a shipping address.</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {addresses.map((address) => (
                              <div 
                                key={address.address_id}
                                className={`px-5 py-4 border rounded-lg cursor-pointer transition-colors ${
                                  selectedAddressId === address.address_id ? 'border-cyan-500 bg-cyan-50' : 'border-gray-200 bg-white hover:border-cyan-300'
                                }`}
                                onClick={() => setSelectedAddressId(address.address_id)}
                              >
                                <div className="flex items-start">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2.5">
                                      <p className="font-medium text-gray-800">{address.name}</p>
                                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-cyan-600 text-white">
                                        {address.type === 1 ? 'Home' : 'Workplace'}
                                      </span>
                                    </div>

                                    <p className="text-gray-600 text-sm mt-2.5">{address.full_name} ({address.phone})</p>
                                    <p className="text-gray-600 text-sm mt-1">
                                      {address.address_1}
                                      {address.address_2 && `, ${address.address_2}`}
                                    </p>
                                    <p className="text-gray-600 text-sm mt-1">
                                      {address.subdistrict}, {address.district}, {address.province}, {address.postal_code}
                                    </p>
                                  </div>
                                  <div className="ml-4">
                                    <div className={`w-5 h-5 rounded-full border ${
                                      selectedAddressId === address.address_id ? 'border-cyan-500 bg-cyan-500' : 'border-gray-400'
                                    }`}>
                                      {selectedAddressId === address.address_id && (
                                        <div className="w-full h-full flex items-center justify-center">
                                          <div className="w-2 h-2 rounded-full bg-white"></div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex justify-end space-x-4">
                        <button
                          onClick={() => setAcceptanceStep('initial')}
                          className="px-6 py-3 bg-gray-200 text-gray-600 font-medium rounded-md hover:bg-gray-300 transition-colors"
                        >
                          Back
                        </button>
                        <button
                          onClick={handleAcceptTransaction}
                          disabled={processingAction !== null || addresses.length === 0}
                          className="px-6 py-3 bg-cyan-600 text-white font-medium rounded-md hover:bg-cyan-700 transition-colors disabled:bg-gray-300 disabled:text-gray-500"
                        >
                          {processingAction === 'accepting' ? (
                            <><Loader2 className="w-4 h-4 mr-2 inline animate-spin" /> Processing...</>
                          ) : 'Confirm & Accept'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-6 pb-8 mb-6">
              <div className="flex items-start">
                <CreditCard className="w-6 h-6 text-cyan-600 mr-4 flex-shrink-0 mt-1" />
                <div className="w-full">
                  <h2 className="text-lg font-bold text-gray-800 mb-2">Waiting for Payment</h2>
                  <p className="text-gray-600 mb-6">You have accepted the offer. Please complete the payment.</p>

                  <div className="flex justify-start">
                    <button
                      onClick={handlePayment}
                      disabled={isProcessing}
                      className={`px-6 py-3 bg-cyan-600 text-white font-medium rounded-md transition-colors ${
                        isProcessing ? 'bg-cyan-600 cursor-not-allowed' : 'hover:bg-cyan-700'
                      }`}
                    >
                      {isProcessing ? (
                        <span className="flex items-center">
                          <svg className="animate-spin mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </span>
                      ) : (
                        <span className="flex items-center">
                          Proceed to Payment
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-6 mb-6">
              <div className="flex items-start">
                <Truck className="w-6 h-6 text-cyan-600 mr-4 flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-lg font-bold text-gray-800 mb-2">Waiting for Shipping</h2>
                  <p className="text-gray-600">Your payment has been completed. The seller is preparing to ship your item.</p>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-6 pb-8 mb-6">
              <div className="flex items-start">
                <Truck className="w-6 h-6 text-cyan-600 mr-4 flex-shrink-0 mt-1" />
                <div className="w-full">
                  <h2 className="text-lg font-bold text-gray-800 mb-2">In Transit</h2>
                  <p className="text-gray-600 mb-6">The seller has successfully shipped your item. You can check the delivery status using the tracking number.</p>
                  
                  <div className="bg-white rounded-lg p-4 border border-gray-200 mb-6">
                    <div className="flex items-center">
                      <div className="bg-cyan-100 p-2 rounded-lg mr-4">
                        <Package className="w-5 h-5 text-cyan-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Tracking Number ({transaction.shipping})</p>
                        <p className="font-medium mt-0.5">{transaction.shipping_number}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <div className="flex">
                      <CircleAlert className="w-5 h-5 text-yellow-600 mr-3 flex-shrink-0" />
                      <p className="text-sm text-yellow-800">
                        Please confirm the delivery once you have received the item.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-start">
                    <button
                      onClick={handleDeliveryConfirmation}
                      className="px-6 py-3 bg-cyan-600 text-white font-medium rounded-md hover:bg-cyan-700 transition-colors"
                    >
                      Confirm Receipt
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-6 mb-6">
              <div className="flex items-start">
                <Package className="w-6 h-6 text-cyan-600 mr-4 flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-lg font-bold text-gray-800 mb-2">Waiting for Delivery</h2>
                  <p className="text-gray-600">Your payment has been completed. The seller is preparing to deliver your item.</p>
                </div>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 pb-8 mb-6">
              <div className="flex items-start">
                <PackageCheck className="w-6 h-6 text-green-600 mr-4 flex-shrink-0 mt-1" />
                <div className="w-full">
                  <h2 className="text-lg font-bold text-gray-800 mb-2">Delivery Confirmed</h2>
                  <p className="text-gray-600 mb-4">The product has been delivered. Please verify the product.</p>
                  
                  <div className="bg-white rounded-lg p-4 border border-gray-200 mb-6">
                    <div className="flex items-center">
                      <div className="bg-green-100 p-2 rounded-lg mr-4">
                        <Clock className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Delivered Date</p>
                        <p className="font-medium">{formatDate(transaction.delivered_at)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <div className="flex">
                      <CircleAlert className="w-5 h-5 text-yellow-600 mr-3 flex-shrink-0" />
                      <p className="text-sm text-yellow-800">
                        If you do not inspect the product within 3 days after successful delivery, the transaction will be considered complete.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-start space-x-4">
                    <button
                      onClick={handleCompleteTransaction}
                      disabled={processingAction !== null}
                      className="px-6 py-3 bg-cyan-600 text-white font-medium rounded-md hover:bg-cyan-700 transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={handleDisputeTransaction}
                      disabled={processingAction !== null}
                      className="px-6 py-3 bg-red-100 text-red-600 font-medium rounded-md hover:bg-red-200 transition-colors"
                    >
                      Reject
                    </button>
                  </div>

                </div>
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <div className="flex items-start">
                <CheckCircle className="w-6 h-6 text-green-600 mr-4 flex-shrink-0 mt-1" />
                <div className="w-full">
                  <h2 className="text-lg font-bold text-gray-800 mb-2">Product Verified</h2>
                  <p className="text-gray-600">You have accepted the product.</p>
                </div>
              </div>
            </div>
          )}

          </>
          }

        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-4" style={{ background: 'linear-gradient(to right, #0D6577, #0A5666)' }}>
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-white">Transaction Details</h1>
          </div>
        </div>

        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('basic')}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'basic'
                  ? 'border-b-2 border-teal-500 text-teal-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Summary
            </button>

            <button
              onClick={() => setActiveTab('product')}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'product'
                  ? 'border-b-2 border-teal-500 text-teal-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Product
            </button>

            {transaction.type === 1 && (
            <button
              onClick={() => setActiveTab('shipping')}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'shipping'
                  ? 'border-b-2 border-teal-500 text-teal-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Shipping
            </button>
            )}

            {transaction.type === 1 && (
            <button
              onClick={() => setActiveTab('address')}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'address'
                  ? 'border-b-2 border-teal-500 text-teal-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Address
            </button>
            )}
            
            <button
              onClick={() => setActiveTab('delivery')}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'delivery'
                  ? 'border-b-2 border-teal-500 text-teal-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Delivery
            </button>
          </nav>
        </div>

        <div className="p-6 pb-8">
          {activeTab === 'basic' && (
            <div>
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-teal-600 border-b border-gray-200 pb-2 mb-4.5">Seller Information</h3>
                <div className="flex items-center gap-5">
                  <div className="flex-shrink-0">
                    {customerImage ? (
                      <img
                        src={customerImage.url}
                        alt={`${customerName} profile`}
                        className="h-20 w-20 rounded-full object-cover ring-2 ring-teal-500 ring-offset-2"
                      />
                    ) : (
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(customerName || 'Unknown')}&font-size=0.35&size=128&color=random&background=random&format=svg`} 
                        alt={`${customerName} profile`}
                        className="h-20 w-20 rounded-full object-cover ring-2 ring-teal-500 ring-offset-2"
                      />
                    )}
                  </div>

                  <div>
                    <h4 className="text-xl font-medium text-gray-900">
                      {loadingCustomer ? (
                        <div className="h-6 w-40 bg-gray-200 rounded animate-pulse"></div>
                      ) : (
                        customerName || "Unknown Customer"
                      )}
                    </h4>
                    <div className="space-y-1 mt-1.5">
                      <div className="flex items-center text-sm text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {loadingCustomer ? (
                          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                        ) : (
                          <>Username: {customer || "Unknown"}</>
                        )}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {loadingCustomer ? (
                          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                        ) : (
                          <>{customerPhone || "Unknown Phone"}</>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-teal-600 border-b border-gray-200 pb-2 mb-4">Agreement Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg pt-4 pb-5 px-6">
                    <h4 className="text-sm font-medium text-teal-600 mb-2.5">Type</h4>
                    <div className="flex items-center">
                      <div className={`p-2 rounded-full bg-teal-100 text-teal-800 mr-2`}>
                        {transaction.type === 1 ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        )}
                      </div>
                      <span className="font-medium text-gray-900">{transaction.type === 1 ? 'Physical Product' : 'Digital Product'}</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg pt-4 pb-5 px-6">
                    <h4 className="text-sm font-medium text-teal-600 mb-2.5">Fee</h4>
                    <div className="flex items-center">
                      <div className="p-2 rounded-full bg-teal-100 text-teal-800 mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <span className="font-medium text-gray-900">
                        {transaction.fee_type === 1 ? (
                          'Buyer Pays Fee'
                        ) : transaction.fee_type === 2 ? (
                          'Seller Pays Fee'
                        ) : transaction.fee_type === 3 ? (
                          'Split Fees Equally'
                        ) : null}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-teal-600 border-b border-gray-200 pb-2 mb-4">Price Summary</h3>
                <div className="bg-gray-50 rounded-lg p-5">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Product price:</span>
                      <span className="font-medium">฿{((product.price ?? 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Product quantity:</span>
                      <span className="font-medium">{transaction.product_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total product price:</span>
                      <span className="font-medium">฿{((product.price ?? 0)*(transaction.product_number ?? 1)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    {transaction.type === 1 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping price:</span>
                      <span className="font-medium">฿{((transaction.shipping_price ?? 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fee:</span>
                      <span className="font-medium">฿{((transaction.fee ?? 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                  <div className="h-px bg-gray-300 my-4"></div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-800 font-semibold">Amount Buyer Pays:</span>
                    <span className="text-teal-700 font-bold text-lg">฿{(amountBuyer).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-800 font-semibold">Amount Seller Receives:</span>
                    <span className="text-teal-700 font-bold text-lg">฿{(amountSeller).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'product' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-2">
                <p className="text-sm font-medium text-teal-600">Name</p>
                <p className="mt-1 text-gray-900">{product.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-teal-600">Type</p>
                <p className="mt-1 text-gray-900">{product.type === 1 ? 'New' : 'Used'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-teal-600">Price</p>
                <p className="mt-1 text-gray-900">
                  ฿{product.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-sm font-medium text-teal-600">Description</p>
                {product.description ? (
                  <p className="mt-1 text-gray-900 whitespace-pre-wrap">{product.description}</p>
                ) : (
                  <p className="mt-1 text-gray-500 italic">No description</p>
                )}
              </div>

              <div className="col-span-2">
                <p className="text-sm font-medium text-teal-600">Images</p>
                {images.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-2.5">
                    {images.map((image, index) => (
                      <div 
                        key={image.id || index} 
                        className="border border-gray-200 rounded-lg overflow-hidden cursor-pointer transform transition-transform hover:scale-105 hover:shadow-md"
                        onClick={() => openFullscreen('image', image.url)}
                      >
                        <div className="relative group">
                          <img
                            src={image.url} 
                            alt={`Product ${index + 1}`} 
                            className="w-full h-48 object-cover"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 flex items-center justify-center transition-all">
                            <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-gray-500 italic">No images available</p>
                )}
              </div>

              <div className="col-span-2">
                <p className="text-sm font-medium text-teal-600">Video</p>

                {video ? (
                  <div 
                    className="border border-gray-200 rounded-lg overflow-hidden cursor-pointer w-fit hover:shadow-md mt-2.5"
                    onClick={() => openFullscreen('video', video.url)}
                  >
                    <div className="relative group">
                      <video 
                        src={video.url}
                        className="w-auto h-60"
                        preload="metadata"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-10 flex items-center justify-center transition-all">
                        <div className="text-white group-hover:transform group-hover:scale-125 transition-transform">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="mt-1 text-gray-500 italic">No video available</p>
                )}
              </div>
            </div>
          </div>
          )}

          {activeTab === 'shipping' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-teal-600">Shipping Service</p>
                <p className="mt-1 text-gray-900">{transaction.shipping}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-teal-600">Price</p>
                <p className="mt-1 text-gray-900">
                  ฿{(transaction.shipping_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-sm font-medium text-teal-600">Tracking Number</p>
                {transaction.shipping_number ? (
                  <p className="mt-1 text-gray-900">{transaction.shipping_number}</p>
                ) : (
                  <p className="mt-1 text-gray-500 italic">No tracking number</p>
                )}
              </div>
              <div className="col-span-2">
                <p className="text-sm font-medium text-teal-600">Details</p>
                {transaction.shipping_details ? (
                  <p className="mt-1 text-gray-900 whitespace-pre-wrap">{transaction.shipping_details}</p>
                ) : (
                  <p className="mt-1 text-gray-500 italic">No shipping details</p>
                )}
              </div>

              <div className="col-span-2">
                <p className="text-sm font-medium text-teal-600">Package Image</p>
                {image ? (
                  <div 
                    className="border border-gray-200 rounded-lg overflow-hidden cursor-pointer w-fit transform transition-transform hover:scale-105 hover:shadow-md mt-2.5"
                    onClick={() => openFullscreen('image', image.url)}
                  >
                    <div className="relative group">
                      <img
                        src={image.url} 
                        className="w-auto h-48"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 flex items-center justify-center transition-all">
                        <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="mt-1 text-gray-500 italic">No images available</p>
                )}
              </div>
            </div>
          </div>
          )}

          {activeTab === 'address' && (
            <>
            {address ? (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-2">
                  <p className="text-sm font-medium text-teal-600">Name</p>
                  <p className="mt-1 text-gray-900">{address.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-teal-600">Recipient's Name</p>
                  <p className="mt-1 text-gray-900">{address.full_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-teal-600">Phone</p>
                  <p className="mt-1 text-gray-900">{address.phone}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-teal-600">Address 1</p>
                  <p className="mt-1 text-gray-900">{address.address_1}</p>
                </div>

                {address.address_2 && (
                <div className="col-span-2">
                  <p className="text-sm font-medium text-teal-600">Address 2</p>
                  <p className="mt-1 text-gray-900">{address.address_2}</p>
                </div>
                )}

                <div>
                  <p className="text-sm font-medium text-teal-600">Subdistrict</p>
                  <p className="mt-1 text-gray-900">{address.subdistrict}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-teal-600">District</p>
                  <p className="mt-1 text-gray-900">{address.district}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-teal-600">Province</p>
                  <p className="mt-1 text-gray-900">{address.province}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-teal-600">Postal Code</p>
                  <p className="mt-1 text-gray-900">{address.postal_code}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-teal-600">Country</p>
                  <p className="mt-1 text-gray-900">{address.country}</p>
                </div>

              </div>
            </div>
            ) : (
              <p className="mt-1 text-gray-500 italic">No address</p>
            )}
            </>
          )}

          {activeTab === 'delivery' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-2">
                <p className="text-sm font-medium text-teal-600">Delivered Date</p>
                {transaction.delivered_at ? (
                  <p className="mt-1 text-gray-900">{formatDate(transaction.delivered_at)}</p>
                ) : (
                  <p className="mt-1 text-gray-500 italic">No delivered date</p>
                )}
              </div>

              {transaction.type == 2 && (
              <div className="col-span-2">
                <p className="text-sm font-medium text-teal-600">Delivery Details</p>

                {transaction.delivered_details ? (
                  <p className="mt-1 text-gray-900 whitespace-pre-wrap">{transaction.delivered_details}</p>
                ) : (
                  <p className="mt-1 text-gray-500 italic">No delivered details</p>
                )}
              </div>
              )}
            </div>
          </div>
          )}
        </div>
      </div>

      <div className="flex justify-start gap-4 mt-10">
        <button
          onClick={handleHelpTransaction}
          className="px-6 py-3 bg-[#0d6577] hover:bg-[#0F7A8D] text-white font-medium rounded-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 flex items-center gap-2.5"
        >
          <MessageCircleQuestion className="w-5 h-5" />
          Need Help
        </button>
        
        {transaction.status === 2 ? (
        <button
          onClick={handleCancelTransaction}
          className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 flex items-center gap-2.5"
        >
          <CircleX className="w-5 h-5" />
          Cancel
        </button>
        ): null}
      </div>
      
      <RejectionFormModal />
      <CancelFormModal />
      <HelpFormModal />
    </>
  );
};

export default TransactionCustomerView;