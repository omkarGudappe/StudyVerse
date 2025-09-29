import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';

const RawToPdfConverter = ({ 
  content, 
  type, 
  fileName, 
  convertedPdfUrl, 
  onConversionComplete, 
  onClose 
}) => {
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(convertedPdfUrl);
  const [textContent, setTextContent] = useState('');
  const [error, setError] = useState(null);
  const [fileType, setFileType] = useState('unknown');

  useEffect(() => {
    if (content && !convertedPdfUrl) {
      processContent();
    }
  }, [content, convertedPdfUrl]);

  const processContent = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // If it's a URL, fetch the content
      if (content.startsWith('http')) {
        await handleUrlContent(content);
      } else {
        // If it's raw text content
        await handleRawTextContent(content);
      }
    } catch (err) {
      console.error('Error processing content:', err);
      setError('Failed to process the content. Please try downloading the original file.');
      setLoading(false);
    }
  };

  const handleUrlContent = async (url) => {
    try {
      const response = await fetch(url);
      
      // Check if it's a PDF by content type or URL pattern
      const contentType = response.headers.get('content-type');
      const isPdf = contentType === 'application/pdf' || 
                   url.includes('.pdf') || 
                   url.includes('/raw/upload/') && url.includes('.pdf');
      
      if (isPdf) {
        // For PDF files, we'll handle them differently
        setFileType('pdf');
        setTextContent('This is a PDF file. PDF files are best viewed in their original format.');
        setLoading(false);
        return;
      }
      
      // For text files, extract the content
      const text = await response.text();
      
      // Check if the response is actually a PDF by looking for PDF signature
      if (text.startsWith('%PDF') || text.includes('%PDF')) {
        setFileType('pdf');
        setTextContent('This file is a PDF document. Please download it to view properly.');
        setLoading(false);
        return;
      }
      
      // It's a text file
      setFileType('text');
      setTextContent(text);
      convertToReadablePDF(text);
      
    } catch (error) {
      throw new Error('Failed to fetch content from URL');
    }
  };

  const handleRawTextContent = async (rawContent) => {
    // Check if it's a PDF by looking for PDF signature
    if (rawContent.startsWith('%PDF') || rawContent.includes('%PDF')) {
      setFileType('pdf');
      setTextContent('This appears to be PDF content. PDF files cannot be displayed as text.');
      setLoading(false);
      return;
    }
    
    // It's regular text content
    setFileType('text');
    setTextContent(rawContent);
    convertToReadablePDF(rawContent);
  };

  const convertToReadablePDF = (text) => {
    if (!text || text.trim().length === 0) {
      setError('No readable text content found.');
      setLoading(false);
      return;
    }
    
    try {
      const doc = new jsPDF();
      
      // Set document properties
      doc.setProperties({
        title: fileName || 'Study Material',
        subject: 'Extracted text content',
        author: 'StudyVerse'
      });
      
      // Set font
      doc.setFont('helvetica');
      doc.setFontSize(12);
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      const maxWidth = pageWidth - (2 * margin);
      
      // Clean the text
      const cleanText = text
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\t/g, '    ')
        .substring(0, 100000); // Limit to 100k characters
      
      // Add title if we have a file name
      if (fileName) {
        doc.setFontSize(16);
        doc.text(fileName, margin, 20);
        doc.setFontSize(12);
      }
      
      // Split text into lines that fit the page width
      const lines = doc.splitTextToSize(cleanText, maxWidth);
      
      let yPosition = fileName ? 35 : 20;
      const lineHeight = 7;
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Add text to PDF
      for (let i = 0; i < lines.length; i++) {
        // Add new page if needed
        if (yPosition + lineHeight > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
        
        doc.text(lines[i], margin, yPosition);
        yPosition += lineHeight;
      }
      
      // Generate the PDF URL
      const pdfBlob = doc.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
      
      // Notify parent component
      if (onConversionComplete) {
        onConversionComplete(url);
      }
      
    } catch (error) {
      console.error('Error creating PDF:', error);
      setError('Failed to create PDF document');
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = () => {
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `${fileName || 'study-material'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const downloadOriginal = () => {
    if (content.startsWith('http')) {
      // For URLs, create a direct download link
      const link = document.createElement('a');
      link.href = content;
      link.download = fileName || 'original-file';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // For raw text content, create a text file
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName || 'content'}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const viewInBrowser = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-800/95 backdrop-blur-lg rounded-2xl border border-neutral-700/50 max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-neutral-700/50 flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">
            {fileName || 'Study Material'}
          </h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-neutral-700/50 rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6">
          {error ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-2xl mb-4 border border-red-500/30">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Error</h4>
              <p className="text-red-400 mb-4">{error}</p>
              <div className="flex justify-center space-x-4 flex-wrap gap-3">
                <button
                  onClick={downloadOriginal}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
                >
                  Download Original
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-neutral-700/50 text-neutral-300 rounded-lg hover:bg-neutral-600/50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
              <span className="ml-3 text-neutral-400">
                Processing content...
              </span>
            </div>
          ) : fileType === 'pdf' ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-500/20 rounded-2xl mb-4 border border-amber-500/30">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">PDF File</h4>
              <p className="text-neutral-400 mb-6 max-w-md mx-auto">
                {textContent || 'This is a PDF document. PDF files are best viewed in their original format.'}
              </p>
              <div className="flex justify-center space-x-4 flex-wrap gap-3">
                <button
                  onClick={downloadOriginal}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-amber-500 text-white rounded-lg hover:from-purple-500 hover:to-amber-400 transition-colors"
                >
                  Download PDF
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-neutral-700/50 text-neutral-300 rounded-lg hover:bg-neutral-600/50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Text Preview */}
              <div className="bg-neutral-900/50 rounded-xl p-4 max-h-96 overflow-y-auto">
                <div className="text-sm text-neutral-400 mb-2">
                  Text Preview ({textContent.length} characters)
                </div>
                <div className="text-neutral-200 whitespace-pre-wrap text-sm bg-neutral-800/30 p-3 rounded-lg max-h-64 overflow-y-auto font-mono">
                  {textContent || 'No content available.'}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-center space-x-4 flex-wrap gap-3">
                <button
                  onClick={viewInBrowser}
                  disabled={!pdfUrl}
                  className={`px-6 py-3 rounded-lg transition-all flex items-center ${
                    pdfUrl 
                      ? 'bg-gradient-to-r from-green-600 to-blue-500 text-white hover:from-green-500 hover:to-blue-400'
                      : 'bg-neutral-700/30 text-neutral-500 cursor-not-allowed'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View PDF
                </button>
                
                <button
                  onClick={downloadPdf}
                  disabled={!pdfUrl}
                  className={`px-6 py-3 rounded-lg transition-all flex items-center ${
                    pdfUrl 
                      ? 'bg-gradient-to-r from-purple-600 to-amber-500 text-white hover:from-purple-500 hover:to-amber-400'
                      : 'bg-neutral-700/30 text-neutral-500 cursor-not-allowed'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download PDF
                </button>
                
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-neutral-700/50 text-neutral-300 rounded-lg hover:bg-neutral-600/50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RawToPdfConverter;