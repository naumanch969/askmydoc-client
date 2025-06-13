"use client"

import { SERVER_URL } from '@/constants'
import axios from 'axios'
import { Upload, FileText } from 'lucide-react'
import React, { useRef, useState } from 'react'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

const FileUpload = () => {
    const inputRef = useRef<HTMLInputElement>(null)
    const [uploadedFile, setUploadedFile] = useState<string | null>(null)
    const [isUploading, setIsUploading] = useState(false)

    const handleClick = () => {
        inputRef.current?.click()
    }

    const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > MAX_FILE_SIZE) {
            alert('File size exceeds 10 MB limit.')
            e.target.value = '' // Reset input
            return
        }

        setIsUploading(true)
        const formData = new FormData()
        formData.append('pdf', file)

        try {
            const { data } = await axios.post(
                `${SERVER_URL}/upload/pdf`,
                formData
            )
            setUploadedFile(file.name)
            console.log('data', data)
        } catch (error: unknown) {
            alert('Upload failed.')
            console.log('error', error)
        } finally {
            setIsUploading(false)
        }

        // Reset input so the same file can be selected again later
        e.target.value = ''
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
                        <span className="text-gray-400 text-sm">PDF, DOCX, or TXT files</span>
                        <input
                            ref={inputRef}
                            type="file"
                            className="hidden"
                            accept=".pdf,.docx,.txt"
                            onChange={handleChange}
                        />
                    </label>
                )}
                {isUploading && (
                    <div className="mt-4 text-sm text-gray-400">
                        Uploading...
                    </div>
                )}
            </div>
        </div>
    )
}

export default FileUpload