import { useState, useEffect, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = 
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.3.93/pdf.worker.min.js`;

function PdfViewer({ fileUrl, className = "" }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scale, setScale] = useState(1.0);
  const [documentLoaded, setDocumentLoaded] = useState(false);
  
  const hasFetchedRef = useRef(false);
  const currentFileUrlRef = useRef(null);

  useEffect(() => {
    // Skip if already fetched or same URL
    if (hasFetchedRef.current && currentFileUrlRef.current === fileUrl) {
      return;
    }

    const fetchAndCreatePdf = async () => {
      try {
        setLoading(true);
        setError(null);
        setDocumentLoaded(false);
        hasFetchedRef.current = true;
        currentFileUrlRef.current = fileUrl;

        console.log('Fetching PDF from:', fileUrl);
        
        // Fetch the raw content from Cloudinary
        const response = await fetch(fileUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status}`);
        }
        
        // Get the content as blob
        const blob = await response.blob();
        
        // Create a proper PDF blob with correct MIME type
        const pdfBlob = new Blob([blob], { type: 'application/pdf' });
        const objectUrl = URL.createObjectURL(pdfBlob);
        
        setPdfBlobUrl(objectUrl);
        console.log('PDF blob URL created successfully');
        
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError(`Failed to load document: ${err.message}`);
        setLoading(false);
        hasFetchedRef.current = false;
      }
    };

    fetchAndCreatePdf();

    // Cleanup function
    return () => {
      // Cleanup will happen in the separate effect
    };
  }, [fileUrl]);

  // Separate cleanup effect
  useEffect(() => {
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, []);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setLoading(false);
    setDocumentLoaded(true);
    console.log('PDF loaded successfully, pages:', numPages);
  };

  const onDocumentLoadError = (error) => {
    console.error('PDF document load error:', error);
    
    // More specific error handling
    if (error.message && error.message.includes('API version')) {
      setError('PDF viewer configuration error. Please try downloading the file or opening in new tab.');
    } else {
      setError('Failed to load PDF document. The file may be corrupted or in an unsupported format.');
    }
    
    setLoading(false);
    hasFetchedRef.current = false;
  };

  const onPageLoadSuccess = () => {
    console.log('Page loaded successfully');
  };

  const onPageLoadError = (error) => {
    console.error('PDF page load error:', error);
  };

  const goToPreviousPage = () => {
    setPageNumber(prev => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(prev + 1, numPages || 1));
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3.0));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  const resetZoom = () => {
    setScale(1.0);
  };

  const downloadFile = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = 'document.pdf';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openInNewTab = () => {
    if (pdfBlobUrl) {
      window.open(pdfBlobUrl, '_blank');
    } else {
      window.open(fileUrl, '_blank');
    }
  };

  const retryLoad = () => {
    setError(null);
    setLoading(true);
    setDocumentLoaded(false);
    hasFetchedRef.current = false;
    
    // Clear existing blob URL
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }
  };

  // Show loading state
  if (loading && !pdfBlobUrl) {
    return (
      <div className={`flex flex-col items-center justify-center bg-neutral-800 rounded-lg p-8 ${className}`}>
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-neutral-300">Loading document...</p>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center bg-neutral-800 rounded-lg p-8 ${className}`}>
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-white font-semibold mb-2">Failed to Load Document</h3>
        <p className="text-neutral-400 text-center mb-4 max-w-md">{error}</p>
        <div className="flex space-x-3 flex-wrap justify-center gap-2">
          <button
            onClick={retryLoad}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={openInNewTab}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
          >
            Open in New Tab
          </button>
          <button
            onClick={downloadFile}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-amber-500 text-white rounded-lg hover:from-purple-500 hover:to-amber-400 transition-colors"
          >
            Download
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-neutral-900 rounded-xl overflow-hidden border border-neutral-700/50 ${className}`}>
      {/* Controls Header */}
      <div className="bg-neutral-800/80 backdrop-blur-sm border-b border-neutral-700/50 p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center space-x-3">
            {/* Navigation */}
            {documentLoaded && numPages > 1 && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={goToPreviousPage}
                  disabled={pageNumber <= 1}
                  className={`p-2 rounded-lg transition-colors ${
                    pageNumber <= 1
                      ? "bg-neutral-700/30 text-neutral-500 cursor-not-allowed"
                      : "bg-neutral-700/50 text-neutral-300 hover:bg-neutral-600/50 hover:text-white"
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <span className="text-sm text-neutral-300 min-w-[80px] text-center">
                  Page {pageNumber} of {numPages}
                </span>

                <button
                  onClick={goToNextPage}
                  disabled={pageNumber >= numPages}
                  className={`p-2 rounded-lg transition-colors ${
                    pageNumber >= numPages
                      ? "bg-neutral-700/30 text-neutral-500 cursor-not-allowed"
                      : "bg-neutral-700/50 text-neutral-300 hover:bg-neutral-600/50 hover:text-white"
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}

            {/* Zoom Controls */}
            {documentLoaded && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={zoomOut}
                  disabled={scale <= 0.5}
                  className={`p-2 rounded-lg transition-colors ${
                    scale <= 0.5
                      ? "bg-neutral-700/30 text-neutral-500 cursor-not-allowed"
                      : "bg-neutral-700/50 text-neutral-300 hover:bg-neutral-600/50 hover:text-white"
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>

                <span className="text-sm text-neutral-300 min-w-[60px] text-center">
                  {Math.round(scale * 100)}%
                </span>

                <button
                  onClick={zoomIn}
                  disabled={scale >= 3.0}
                  className={`p-2 rounded-lg transition-colors ${
                    scale >= 3.0
                      ? "bg-neutral-700/30 text-neutral-500 cursor-not-allowed"
                      : "bg-neutral-700/50 text-neutral-300 hover:bg-neutral-600/50 hover:text-white"
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>

                <button
                  onClick={resetZoom}
                  className="p-2 bg-neutral-700/50 text-neutral-300 rounded-lg hover:bg-neutral-600/50 hover:text-white transition-colors text-xs"
                >
                  Reset
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={openInNewTab}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span>New Tab</span>
            </button>
            <button
              onClick={downloadFile}
              className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-amber-500 text-white rounded-lg hover:from-purple-500 hover:to-amber-400 transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Download</span>
            </button>
          </div>
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex-1 overflow-auto bg-neutral-800/20 min-h-[400px] max-h-[600px]">
        <div className="flex justify-center p-4">
          {pdfBlobUrl && (
            <Document
              file={pdfBlobUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-3 text-neutral-400">Rendering PDF...</span>
                </div>
              }
              error={
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-2xl mb-4 border border-red-500/30">
                    <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">Unable to Display PDF</h4>
                  <p className="text-neutral-400 mb-4">Please use the options below to view the document.</p>
                  <div className="flex space-x-3 justify-center flex-wrap gap-2">
                    <button
                      onClick={openInNewTab}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
                    >
                      Open in New Tab
                    </button>
                    <button
                      onClick={downloadFile}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-amber-500 text-white rounded-lg hover:from-purple-500 hover:to-amber-400 transition-colors"
                    >
                      Download PDF
                    </button>
                  </div>
                </div>
              }
            >
              <Page 
                pageNumber={pageNumber} 
                scale={scale}
                onLoadSuccess={onPageLoadSuccess}
                onLoadError={onPageLoadError}
                loading={
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                }
                error={
                  <div className="text-center py-8 text-yellow-400">
                    <p>Failed to render page {pageNumber}</p>
                    <button
                      onClick={retryLoad}
                      className="mt-2 px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-500"
                    >
                      Try Again
                    </button>
                  </div>
                }
                className="shadow-lg"
              />
            </Document>
          )}
        </div>
      </div>

      {/* Footer */}
      {documentLoaded && (
        <div className="bg-neutral-800/50 border-t border-neutral-700/30 p-3">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>PDF Viewer</span>
            <span>Page {pageNumber} of {numPages}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default PdfViewer;