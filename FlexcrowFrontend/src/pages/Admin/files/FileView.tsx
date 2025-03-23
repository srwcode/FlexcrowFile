import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import config from '../../../config';

interface File {
  file_id: string;
  original_name: string;
  cloud_url: string;
  cloud_id: string;
  file_type: string;
  size: string;
  created_at: string;
  updated_at: string;
}

const FileView = () => {
  const { file_id } = useParams<{ file_id: string }>();
  const navigate = useNavigate();
  const [file, setFile] = React.useState<File | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchFile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${config.API_URL}/files/${file_id}`, {
          headers: {
            'Content-Type': 'application/json',
            'token': token || ''
          }
        });

        if (!response.ok) throw new Error('Failed to fetch file');
        const data = await response.json();
        setFile(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load file');
      } finally {
        setLoading(false);
      }
    };

    fetchFile();
  }, [file_id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${format(date, "dd MMMM yyyy | HH:mm", { locale: enUS })} (${formatDistanceToNow(date, { addSuffix: true, locale: enUS })})`;
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!file) return <div>File not found</div>;

  return (
    <>
      <div className="rounded-sm border border-stroke bg-white px-8 py-6 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-6">File Details</h1>

        <div className="space-y-5">
          <div>
            {file.file_type.startsWith('image/') ? (
              <img
                src={file.cloud_url}
                className="w-auto h-auto max-w-full max-h-50 object-contain"
              ></img>
            ) : (
              <video
                src={file.cloud_url}
                className="w-auto h-auto max-w-full max-h-50 object-contain"
                controls
              ></video>
            )}
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">ID</p>
            <p>{file.file_id}</p>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">Name</p>
            <p>{file.original_name}</p>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">URL</p>
            <p className="max-w-lg overflow-hidden">
              <a className="text-blue-500 hover:underline" href={file.cloud_url} target="_blank">{file.cloud_url}</a>
            </p>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">Cloud ID</p>
            <p>{file.cloud_id}</p>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">Type</p>
            <p>{file.file_type}</p>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">Size</p>
            <p>{typeof file?.size === "number" ? (file.size / (1024 * 1024)).toFixed(2) + " MB" : "N/A"}</p>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">Created</p>
            <p>{formatDate(file.created_at)}</p>
          </div>
          <div>
            <p className="font-medium text-gray-600 mb-1">Updated</p>
            <p>{formatDate(file.updated_at)}</p>
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <button
            onClick={() => navigate('/admin/files')}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Back
          </button>
        </div>

      </div>
    </>
  );
};

export default FileView;