"use client"

import { useUser } from '@clerk/nextjs'
import { Upload, FileText } from 'lucide-react'
import React, { useRef, useState } from 'react'
import { documentApi } from '@/api'
import type { Document } from '@/lib/interfaces'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

interface FileUploadProps {
    onDocumentUploaded?: (document: Document) => void;
    onError?: (error: string) => void;
}

const LeftBar: React.FC<FileUploadProps> = ({ onDocumentUploaded, onError }) => {
    const inputRef = useRef<HTMLInputElement>(null)
    const { user } = useUser();

    const [uploadedFile, setUploadedFile] = useState<string | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)

    const handleClick = () => {
        inputRef.current?.click()
    }

    const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > MAX_FILE_SIZE) {
            onError?.('File size exceeds 10 MB limit.')
            e.target.value = '' // Reset input
            return
        }

        setIsUploading(true)
        setUploadProgress(0)

        try {
            // Upload document
            const { data: document } = await documentApi.upload(file, user?.id || '')
            setUploadedFile(file.name)

            // Notify parent component
            onDocumentUploaded?.(document)

            // Simulate upload progress
            const interval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(interval)
                        return 100
                    }
                    return prev + 10
                })
            }, 200)

        } catch (error: unknown) {
            const axiosError = error as Error & { response?: { data?: { message?: string } } };
            const errorMessage = axiosError?.response?.data?.message || axiosError?.message || 'Upload failed.';
            onError?.(errorMessage);
        } finally {
            setIsUploading(false)
            e.target.value = '' // Reset input
        }
    }

    return (
        <div className="h-full flex justify-center items-center">
            <div className="bg-gray-800 text-white shadow-2xl flex flex-col justify-center items-center p-8 rounded-lg w-full max-w-md mx-auto">
                {uploadedFile ? (
                    <div className="flex items-center space-x-3 p-4 bg-gray-700 rounded-lg">
                        <FileText className="text-blue-400" size={24} />
                        <span className="text-sm">{uploadedFile}</span>
                    </div>
                ) : (
                    <label
                        onClick={handleClick}
                        className="flex flex-col items-center cursor-pointer hover:bg-gray-700 transition-colors p-6 rounded-lg border-2 border-dashed border-gray-600 w-full"
                    >
                        <Upload size={40} className="mb-2 text-gray-400" />
                        <span className="font-semibold text-lg mb-1">Click to upload</span>
                        <span className="text-gray-400 text-sm">PDF files only</span>
                        <input
                            ref={inputRef}
                            type="file"
                            className="hidden"
                            accept=".pdf"
                            onChange={handleChange}
                        />
                    </label>
                )}
                {isUploading && (
                    <div className="mt-4 w-full">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-400">Uploading...</span>
                            <span className="text-sm text-gray-400">{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default LeftBar