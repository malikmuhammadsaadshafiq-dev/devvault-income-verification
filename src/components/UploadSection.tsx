'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { 
  Upload, 
  FileText, 
  X,
  FileIcon,
  CheckCircle,
  AlertCircle,
  Loader
} from '@phosphor-icons/react';
import { clsx } from 'clsx';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  progress: number;
}

const acceptedFormats = {
  'text/csv': '.csv',
  'application/pdf': '.pdf'
};

export function UploadSection({ standalone = false }: { standalone?: boolean }) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragAccept, setIsDragAccept] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      const newFile: UploadedFile = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'uploading',
        progress: 0
      };

      setUploadedFiles(prev => [...prev, newFile]);

      // Simulate upload progress
      const uploadInterval = setInterval(() => {
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === newFile.id 
              ? { ...f, progress: Math.min(f.progress + 10, 100) }
              : f
          )
        );
      }, 300);

      // Simulate processing
      setTimeout(() => {
        clearInterval(uploadInterval);
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === newFile.id 
              ? { ...f, status: 'processing', progress: 0 }
              : f
          )
        );

        setTimeout(() => {
          setUploadedFiles(prev => 
            prev.map(f => 
              f.id === newFile.id 
                ? { ...f, status: 'complete', progress: 100 }
                : f
            )
          );
        }, 2000);
      }, 3000);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: acceptedFormats,
    maxFiles: 5,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'application/pdf': return FileIcon;
      case 'text/csv': return FileText;
      default: return FileIcon;
    }
  };

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading': return <Upload className="w-4 h-4 animate-spin" />;
      case 'processing': return <Loader className="w-4 h-4 animate-spin" />;
      case 'complete': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  return (
    <section className={standalone ? "mt-8" : ""}>
      {!standalone && (
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Upload Bank Statements</h2>
          <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            see history
          </button>
        </div>
      )}
      
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Upload Area */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div 
              {...getRootProps()} 
              className={clsx(
                'border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer',
                isDragActive 
                  ? 'border-indigo-400 bg-indigo-50' 
                  : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
              )}
            >
              <input {...getInputProps()} />
              
              <motion.div
                animate={{ scale: isDragActive ? 1.05 : 1 }}
                transition={{ duration: 0.2 }}
              >
                <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {isDragActive ? 'Drop files here' : 'Upload bank statements'}
                </h3>
                <p className="text-slate-600 mb-4">
                  Drag and drop your .csv or .pdf files, or click to browse
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                  <FileText className="w-4 h-4" />
                  CSV • PDF • Max 10MB
                </div>
              </motion.div>
            </div>

            {fileRejections.length > 0 && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-600">
                  {fileRejections[0].errors[0].message}
                </p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Uploaded Files */}
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Recent Uploads
          </h3>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {uploadedFiles.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No files uploaded yet</p>
              </div>
            ) : (
              uploadedFiles.map((file) => {
                const FileIcon = getFileIcon(file.type);
                return (
                  <motion.div
                    key={file.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="bg-white border border-slate-200 rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileIcon className="w-5 h-5 text-slate-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(file.id)}
                        className="text-slate-400 hover:text-slate-600 flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-600">
                          {file.status === 'uploading' && `Uploading ${file.progress}%`}
                          {file.status === 'processing' && 'Processing...'}
                          {file.status === 'complete' && 'Processing complete'}
                          {file.status === 'error' && 'Failed to process'}
                        </span>
                        {getStatusIcon(file.status)}
                      </div>
                      
                      {(file.status === 'uploading' || file.status === 'processing') && (
                        <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-indigo-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${file.progress}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </section>
  );
}