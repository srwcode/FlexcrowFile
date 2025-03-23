import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import config from '../../../config';

interface Product {
  product_id: string;
  user_id: string;
  name: string;
  status: 1 | 2;
  type: 1 | 2;
  description: string;
  price: number;
  image_id: string[];
  video_id: string;
  created_at: string;
  updated_at: string;
}

interface ImageData {
  id: string;
  url: string;
}

interface VideoData {
  id: string;
  url: string;
}

const ProductView = () => {
  const { product_id } = useParams<{ product_id: string }>();
  const [product, setProduct] = React.useState<Product | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [images, setImages] = useState<ImageData[]>([]);
  const [video, setVideo] = useState<VideoData | null>(null);
  const [fullscreenMedia, setFullscreenMedia] = useState<{type: 'image' | 'video', url: string} | null>(null);

  React.useEffect(() => {
    const fetchProduct = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${config.API_URL}/products/${product_id}`, {
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

    fetchProduct();
  }, [product_id]);

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

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600"></div>
    </div>
  );
  
  if (error) return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 mx-auto my-8 max-w-2xl rounded shadow">
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
  
  if (!product) return (
    <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mx-auto my-8 max-w-2xl rounded shadow">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-yellow-800">Product not found</p>
        </div>
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
            {/* Close button */}
            <button 
              onClick={closeFullscreen}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70 transition-all z-10"
              aria-label="Close fullscreen view"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Media content */}
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
    
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-4" style={{ background: 'linear-gradient(to right, #0D6577, #0A5666)' }}>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">Product: {product.name}</h1>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-teal-600">Type</p>
                <p className="mt-2 font-semibold text-gray-900">{product.type === 1 ? 'New' : 'Used'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-teal-600">Price</p>
                <p className="mt-2 font-semibold text-gray-900">
                  ฿{product.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Description</h2>
            {product.description ? (
            <div>
              <p className="mt-1 text-gray-900 whitespace-pre-wrap">{product.description}</p>
            </div>
            ) : (
              <p className="text-gray-500 italic">No description</p>
            )}
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Images</h2>
            {images.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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
              <p className="text-gray-500 italic">No images available</p>
            )}
          </div>

          <div className="mb-2">
            <h2 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Video</h2>
            {video ? (
              <div 
                className="border border-gray-200 rounded-lg overflow-hidden cursor-pointer w-fit hover:shadow-md"
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
              <p className="text-gray-500 italic">No video available</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductView;