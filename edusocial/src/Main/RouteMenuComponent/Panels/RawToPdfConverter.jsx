import React, { useState, useRef, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const RawToPdfConverter = ({ rawContent, fileType, fileName, onConversionComplete }) => {
  const [convertedPdfUrl, setConvertedPdfUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    if (rawContent) {
      convertToPdf();
    }
  }, [rawContent]);

  const convertToPdf = async () => {
    setLoading(true);
    try {
      if (fileType === 'text' || fileType === 'code') {
        // For text content
        const doc = new jsPDF();
        
        // Split text into lines that fit the page
        const lines = doc.splitTextToSize(rawContent, 180);
        
        // Add text to PDF
        doc.text(lines, 10, 10);
        const pdfBlob = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        setConvertedPdfUrl(pdfUrl);
        onConversionComplete(pdfUrl);
      } else if (fileType === 'html') {
        // For HTML content
        if (contentRef.current) {
          const canvas = await html2canvas(contentRef.current);
          const imgData = canvas.toDataURL('image/png');
          const doc = new jsPDF();
          const imgProps = doc.getImageProperties(imgData);
          const pdfWidth = doc.internal.pageSize.getWidth();
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
          
          doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          const pdfBlob = doc.output('blob');
          const pdfUrl = URL.createObjectURL(pdfBlob);
          setConvertedPdfUrl(pdfUrl);
          onConversionComplete(pdfUrl);
        }
      }
    } catch (error) {
      console.error('Error converting to PDF:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
        <span className="ml-2 text-neutral-400">Converting to PDF...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Hidden div for HTML conversion */}
      {fileType === 'html' && (
        <div ref={contentRef} style={{ position: 'absolute', left: '-9999px' }} dangerouslySetInnerHTML={{ __html: rawContent }} />
      )}
      
      {convertedPdfUrl && (
        <div className="mt-4">
          <a 
            href={convertedPdfUrl} 
            download={`${fileName || 'converted'}.pdf`}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-amber-500 rounded-lg text-white hover:from-purple-500 hover:to-amber-400 transition-all flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Converted PDF
          </a>
        </div>
      )}
    </div>
  );
};

export default RawToPdfConverter;