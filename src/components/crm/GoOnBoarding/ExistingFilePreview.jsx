import React from 'react'

// Existing file preview component for files from database
const ExistingFilePreview = ({ file, onRemove, index }) => {
    const isImage = file.fileUrl && /\.(jpg|jpeg|png|gif|webp)$/i.test(file.fileName || file.fileUrl);
    const isPDF = file.fileUrl && file.fileUrl.includes('.pdf');
    const isDocument = file.fileName && (file.fileName.endsWith('.doc') || file.fileName.endsWith('.docx'));

    const pdfIcon = "https://static.thehosteller.com/Hostel/Media/image-1747118479586.png";
    const docIcon = "https://cdn-icons-png.flaticon.com/512/337/337946.png";

    const handleOpenInNewTab = () => {
        if (file.fileUrl) {
            window.open(file.fileUrl, '_blank');
        }
    };

    const getFileIcon = () => {
        if (isImage && file.fileUrl) {
            return (
                <img
                    src={file.fileUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        // If image fails to load, show fallback
                        e.target.style.display = 'none';
                    }}
                />
            );
        } else if (isPDF) {
            return (
                <div className="flex flex-col items-center justify-center p-2">
                    <img
                        src={pdfIcon}
                        alt="PDF"
                        className="w-12 h-12 object-contain mb-1"
                    />
                    <span className="text-xs text-blue-600 font-medium">PDF</span>
                </div>
            );
        } else if (isDocument) {
            return (
                <div className="flex flex-col items-center justify-center p-2">
                    <img
                        src={docIcon}
                        alt="Document"
                        className="w-10 h-10 object-contain mb-1"
                    />
                    <span className="text-xs text-green-600 font-medium">DOC</span>
                </div>
            );
        } else {
            return (
                <div className="flex flex-col items-center justify-center p-2">
                    <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center mb-1">
                        <span className="text-lg">📄</span>
                    </div>
                    <span className="text-xs text-gray-600">
                        {file.fileName?.split('.').pop()?.toUpperCase() || 'FILE'}
                    </span>
                </div>
            );
        }
    };

    return (
        <div className="relative inline-block m-2">
            {/* Main Preview - Click to open in new tab */}
            <div
                className="w-24 h-24 border-2 border-gray-200 rounded-lg overflow-hidden flex items-center justify-center bg-white cursor-pointer hover:border-blue-500 hover:shadow-md transition-all duration-200 group"
                onClick={handleOpenInNewTab}
                title={`Click to open ${file.fileName}`}
            >
                {getFileIcon()}

                {/* Hover Actions */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex flex-col items-center">
                        <span className="text-white text-sm font-semibold mb-2">
                            Open
                        </span>
                    </div>
                </div>
            </div>

            {/* Remove Button */}
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    onRemove(index);
                }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 z-10 shadow-lg border-2 border-white"
                title="Remove file"
            >
                ×
            </button>

            {/* File Info */}
            <div className="mt-2 text-center">
                <div className="text-xs text-gray-700 font-medium truncate max-w-24">
                    {file.fileName?.length > 18 ? file.fileName.substring(0, 15) + '...' : file.fileName}
                </div>
                <div className="text-xs text-gray-500">
                    Existing file
                </div>
            </div>
        </div>
    );
};

export default ExistingFilePreview;