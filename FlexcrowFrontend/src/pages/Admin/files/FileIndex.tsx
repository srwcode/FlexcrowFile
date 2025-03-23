import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { formatDistanceToNow } from "date-fns";
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
}

interface PaginatedResponse {
  total_count: number;
  file_items: File[];
}

const FileIndex = () => {
  const [files, setFiles] = React.useState<File[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);
  const recordsPerPage = 10;

  React.useEffect(() => {
    const fetchFiles = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${config.API_URL}/files?page=${currentPage}&recordPerPage=${recordsPerPage}&startIndex=${(currentPage - 1) * recordsPerPage}`, {
          headers: {
            'Content-Type': 'application/json',
            'token': token || ''
          }
        });

        if (!response.ok) {
          setFiles([]);
          setTotalCount(0);
          return;
        }
  
        const data: PaginatedResponse = await response.json();
        setFiles(data.file_items || []);
        setTotalCount(data.total_count || 0);
      } catch (err) {
        setFiles([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, [currentPage]);

  const handleDelete = async (fileId: string) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.API_URL}/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'token': token || ''
        }
      });

      if (!response.ok) throw new Error('Failed to delete file');

      toast.success('File deleted successfully');
      setFiles(files.filter(file => file.file_id !== fileId));
      
      if (files.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete file');
    }
  };

  const totalPages = Math.ceil(totalCount / recordsPerPage);

  const renderPagination = () => {
    return (
      <div className="flex justify-between items-center mt-8">
        <button
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-6 py-1.5 rounded-md border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        <span className="hidden md:block px-4 py-1.5">
          Page {currentPage} of {totalPages}
        </span>

        <button
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-6 py-1.5 rounded-md border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${formatDistanceToNow(date, { addSuffix: true, locale: enUS })}`;
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-10 shadow-default sm:px-7.5">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Files ({totalCount})</h1>
      </div>

      <div className="max-w-full overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-2 text-left">
              <th className="min-w-[120px] py-4 px-4 font-medium text-black pl-6">Thumbnail</th>
              <th className="min-w-[120px] py-4 px-4 font-medium text-black">Type</th>
              <th className="min-w-[120px] py-4 px-4 font-medium text-black">Size</th>
              <th className="min-w-[120px] py-4 px-4 font-medium text-black">Created</th>
              <th className="min-w-[120px] py-4 px-4 font-medium text-black">Actions</th>
            </tr>
          </thead>
          <tbody>
          {files.length === 0 ? (
            <tr>
              <td colSpan={5} className="text-center py-20 text-gray-500">
                No data
              </td>
            </tr>
          ) : (
            files.map(file => (
              <tr key={file.file_id} className="hover:bg-gray-50">
                <td className="border-b border-[#eee] py-5 px-4 pl-6">
                  {file.file_type.startsWith('image/') ? (
                    <img
                      src={file.cloud_url}
                      className="w-[120px] h-[90px] rounded-md object-cover"
                    ></img>
                  ) : (
                    <video
                      src={file.cloud_url}
                      className="w-[120px] h-[90px] rounded-md object-cover"
                    ></video>
                  )}
                </td>
                <td className="border-b border-[#eee] py-5 px-4">{file.file_type}</td>
                <td className="border-b border-[#eee] py-5 px-4">{typeof file?.size === "number" ? (file.size / (1024 * 1024)).toFixed(2) + " MB" : "N/A"}</td>
                <td className="border-b border-[#eee] py-5 px-4">{formatDate(file.created_at)}</td>
                <td className="border-b border-[#eee] py-5 px-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/admin/files/${file.file_id}`)}
                      className="bg-blue-500 text-white px-4 py-1.5 rounded hover:bg-blue-600"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDelete(file.file_id)}
                      className="bg-red-500 text-white px-4 py-1.5 rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
          </tbody>
        </table>
      </div>

      {files.length !== 0 && (
        <>
          {renderPagination()}
        </>
      )}

    </div>
  );
};

export default FileIndex;