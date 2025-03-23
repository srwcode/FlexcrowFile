import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import config from '../../../config';

interface Product {
  product_id: string;
  user_id: string;
  name: string;
  status: 1 | 2;
  type: 1 | 2;
  description: string;
  price: GLfloat;
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
  const navigate = useNavigate();
  const [product, setProduct] = React.useState<Product | null>(null);
  const [username, setUsername] = useState<string>('');
  const [loadingUsername, setLoadingUsername] = useState<boolean>(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [images, setImages] = useState<ImageData[]>([]);
  const [video, setVideo] = useState<VideoData | null>(null);

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

  useEffect(() => {
    const fetchUsername = async () => {
      const userId = product?.user_id;

      if (userId) {
        setLoadingUsername(true);

        try {
          const token = localStorage.getItem('token');
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
          setUsername(data.username);
        } catch (error) {
          console.error('Error fetching username:', error);
          setUsername('Unknown User');
        } finally {
          setLoadingUsername(false);
        }
      }
    };

    if (product && product.user_id) {
      fetchUsername();
    }
  }, [product]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${format(date, "dd MMMM yyyy | HH:mm", { locale: enUS })} (${formatDistanceToNow(date, { addSuffix: true, locale: enUS })})`;
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!product) return <div>Product not found</div>;

  return (
    <>
      <div className="rounded-sm border border-stroke bg-white px-8 py-6 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-6">Product Details</h1>

        <div className="space-y-5">
          <div>
            <p className="font-medium text-gray-600 mb-1">ID</p>
            <p>{product.product_id}</p>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">Name</p>
            <p>{product.name}</p>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">User</p>
            <p>
              {loadingUsername ? (
                <span className="text-gray-400">Loading...</span>
              ) : (
                <a className="text-blue-500 hover:underline" href={`/admin/users/${product.user_id}`}>
                  {username || "Unknown User"}
                </a>
              )}
            </p>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">Status</p>
            <p>
              {product.status === 1 ? (
                <span className="text-green-500">Active</span>
              ) : product.status === 2 ? (
                <span className="text-red-500">Inactive</span>
              ) : null}
            </p>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">Type</p>
            <p>
              {product.type === 1 ? (
                <span>New</span>
              ) : product.type === 2 ? (
                <span>Used</span>
              ) : null}
            </p>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">Price</p>
            <p>฿{product.price.toFixed(2)}</p>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">Description</p>
            <p className="whitespace-pre-wrap">{product.description}</p>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">Images</p>
            {images.length !== 0 ? (
              <div className="grid grid-cols-3 gap-4 p-4">
                {images.map((image, index) => (
                  <img
                    key={image.id || index}
                    src={image.url} 
                    alt={`Product ${index + 1}`} 
                    className="w-auto h-auto max-w-full max-h-30 object-contain"
                  />
                ))}
              </div>
            ) : (
              <p>No image</p>
            )}
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">Video</p>
            {video ? (
              <video 
                src={video.url}
                className="w-[80%] object-contain"
                controls
              />
            ) : (
              <p>No video</p>
            )}
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">Created</p>
            <p>{formatDate(product.created_at)}</p>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">Updated</p>
            <p>{formatDate(product.updated_at)}</p>
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <button
            onClick={() => navigate(`/admin/products/${product_id}/edit`)}
            className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
          >
            Edit
          </button>
          <button
            onClick={() => navigate('/admin/products')}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Back
          </button>
        </div>

      </div>
    </>
  );
};

export default ProductView;