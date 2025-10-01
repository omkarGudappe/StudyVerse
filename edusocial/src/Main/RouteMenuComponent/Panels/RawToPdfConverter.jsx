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
      if (content.startsWith('http')) {
        await handleUrlContent(content);
      } else {
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
      
      // Check content type from response headers
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('pdf') || url.toLowerCase().endsWith('.pdf')) {
        // For PDF files, we'll show a message that we can't extract text
        setFileType('pdf');
        setTextContent('This is a PDF file. PDF text extraction is not available in this version. Please download the original file to view it.');
        convertToReadablePDF('This is a PDF file. PDF text extraction is not available in this version. Please download the original file to view it.');
      } else {
        // Try as text file
        const text = await response.text();
        if (text.length > 0 && !text.includes('�')) {
          setFileType('text');
          setTextContent(text);
          convertToReadablePDF(text);
        } else {
          // If text extraction fails, treat it as binary/unreadable
          setFileType('binary');
          setTextContent('This file contains binary data that cannot be displayed as text. Please download the original file.');
          convertToReadablePDF('This file contains binary data that cannot be displayed as text. Please download the original file.');
        }
      }
    } catch (error) {
      console.error('Error processing URL:', error);
      setError('Unable to process this file. Please try downloading the original file.');
      setLoading(false);
    }
  };

  const handleRawTextContent = async (rawContent) => {
    try {
      // Check if it looks like a PDF by signature
      const isPdf = rawContent.startsWith('%PDF') || 
        (rawContent.length > 4 &&
          rawContent.charCodeAt(0) === 0x25 && 
          rawContent.charCodeAt(1) === 0x50 && 
          rawContent.charCodeAt(2) === 0x44 && 
          rawContent.charCodeAt(3) === 0x46);

      if (isPdf) {
        setFileType('pdf');
        setTextContent('This appears to be a PDF file. PDF text extraction is not available in this version. Please download the original file.');
        convertToReadablePDF('This appears to be a PDF file. PDF text extraction is not available in this version. Please download the original file.');
      } else {
        // Try to decode as text
        setFileType('text');
        setTextContent(rawContent);
        convertToReadablePDF(rawContent);
      }
    } catch (error) {
      console.error('Error processing raw content:', error);
      setError('Failed to process the content.');
      setLoading(false);
    }
  };

  const convertToReadablePDF = (text) => {
    if (!text || text.trim().length === 0) {
      setError('No readable text content found.');
      setLoading(false);
      return;
    }
    
    try {
      const doc = new jsPDF();
      
      doc.setProperties({
        title: fileName || 'Study Material',
        subject: 'Extracted text content',
        author: 'StudyVerse'
      });
      
      doc.setFont('helvetica');
      doc.setFontSize(12);
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      const maxWidth = pageWidth - (2 * margin);
      
      const cleanText = text
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\t/g, '    ')
        .replace(/\n\s*\n\s*\n/g, '\n\n')
        .substring(0, 50000);
      
      if (fileName) {
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(fileName, margin, 20);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
      }
      
      const lines = doc.splitTextToSize(cleanText, maxWidth);
      
      let yPosition = fileName ? 35 : 20;
      const lineHeight = 7;
      const pageHeight = doc.internal.pageSize.getHeight();
      
      for (let i = 0; i < lines.length; i++) {
        if (yPosition + lineHeight > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
        
        doc.text(lines[i], margin, yPosition);
        yPosition += lineHeight;
      }
      
      const pdfBlob = doc.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
      
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
      const link = document.createElement('a');
      link.href = content;
      link.download = fileName || 'original-file';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
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
          ) : (
            <div className="space-y-6">
              {/* Text Preview */}
              <div className="bg-neutral-900/50 rounded-xl p-4 max-h-96 overflow-y-auto">
                <div className="text-sm text-neutral-400 mb-2">
                  {fileType === 'pdf' ? 'PDF File Information' : 'Text Content'} 
                  ({textContent.length} characters)
                </div>
                <div className="text-neutral-200 whitespace-pre-wrap text-sm bg-neutral-800/30 p-3 rounded-lg max-h-64 overflow-y-auto">
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
                  onClick={downloadOriginal}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
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
          )}
        </div>
      </div>
    </div>
  );
};

export default RawToPdfConverter;