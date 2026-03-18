import React from 'react'

// File preview component
const FilePreview = ({ file, onRemove, index }) => {
    const isImage = file.type.startsWith('image/');
    const isPDF = file.type === 'application/pdf';
    const isDocument = file.type.includes('document') || file.name.endsWith('.doc') || file.name.endsWith('.docx');

    const pdfIcon = "https://static.thehosteller.com/Hostel/Media/image-1747118479586.png";
    const docIcon = "https://cdn-icons-png.flaticon.com/512/337/337946.png"; // Document icon

    const fileUrl = URL.createObjectURL(file);

    const handleOpenInNewTab = () => {
        // For images and PDFs, open directly in new tab
        if (isImage || isPDF) {
            const newWindow = window.open(fileUrl, '_blank');
            if (newWindow) newWindow.focus();
        } else {
            // For other files, offer download
            handleDownload();
        }
    };

    const handleDownload = (e) => {
        if (e) e.stopPropagation();

        const a = document.createElement('a');
        a.href = fileUrl;
        a.download = file.name;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const getFileIcon = () => {
        if (isImage) {
            return (
                <img
                    src={fileUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
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
                        {file.name.split('.').pop()?.toUpperCase() || 'FILE'}
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
                title={`Click to ${isImage || isPDF ? 'open' : 'download'} ${file.name}`}
            >
                {getFileIcon()}

                {/* Hover Actions */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex flex-col items-center">
                        <span className="text-white text-sm font-semibold mb-2">
                            {isImage || isPDF ? 'Open' : 'Download'}
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownload(e);
                                }}
                                className="w-8 h-8 bg-blue-600 text-white rounded-full text-sm flex items-center justify-center hover:bg-blue-700 shadow-lg"
                                title="Download"
                            >
                                ⬇
                            </button>
                        </div>
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
                    {file.name.length > 18 ? file.name.substring(0, 15) + '...' : file.name}
                </div>
                <div className="text-xs text-gray-500">
                    {(file.size / 1024).toFixed(1)} KB
                </div>
            </div>
        </div>
    );
};

export default FilePreview