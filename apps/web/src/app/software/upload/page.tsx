'use client';
import { useState } from 'react';
import { Upload, X, File, CheckCircle } from 'lucide-react';
import { SOFTWARE_CATEGORIES } from '@winrepo/shared';

export default function UploadSoftware() {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    version: '',
    vendor: '',
    category: SOFTWARE_CATEGORIES[0]
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert("Please select a file to upload");
      return;
    }
    
    setUploading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError("You must be logged in to upload software. Please login first.");
        setUploading(false);
        return;
      }

      const form = new FormData();
      form.append('name', formData.name);
      form.append('version', formData.version);
      form.append('vendor', formData.vendor);
      form.append('category', formData.category);
      form.append('file', file);

      const res = await fetch('/api/software', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: form,
      });

      const data = await res.json();
      
      if (data.success) {
        alert("Upload successful!");
        window.location.href = `/software/${data.data.id}`;
      } else {
        setError(data.error?.message || 'Upload failed');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred during upload');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Upload Software Package</h1>
      
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Package Name *</label>
              <input type="text" name="name" id="name" required value={formData.name} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm" placeholder="e.g., Google Chrome" />
            </div>

            <div>
              <label htmlFor="version" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Version *</label>
              <input type="text" name="version" id="version" required value={formData.version} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm" placeholder="e.g., 124.0.0" />
            </div>

            <div>
              <label htmlFor="vendor" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Vendor</label>
              <input type="text" name="vendor" id="vendor" value={formData.vendor} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm" placeholder="e.g., Google" />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
              <select name="category" id="category" value={formData.category} onChange={handleChange} className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm">
                {SOFTWARE_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Package File (EXE, MSI, ZIP, BAT, PS1)</label>
            
            {!file ? (
              <div 
                className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors ${dragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600 dark:text-gray-400 justify-center">
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-transparent rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                      <span>Upload a file</span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={(e) => e.target.files && setFile(e.target.files[0])} accept=".exe,.msi,.zip,.bat,.ps1" />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">Max file size: 2GB</p>
                </div>
              </div>
            ) : (
              <div className="mt-1 flex items-center justify-between p-4 border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 rounded-md">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-100 dark:bg-green-800 p-2 rounded-full">
                    <File className="h-6 w-6 text-green-600 dark:text-green-300" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-300">{file.name}</p>
                    <p className="text-xs text-green-600 dark:text-green-400">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                </div>
                <button type="button" onClick={() => setFile(null)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>

          {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md text-sm">{error}</div>}

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
             <button
              type="submit"
              disabled={!file || uploading}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading...' : 'Upload and Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
