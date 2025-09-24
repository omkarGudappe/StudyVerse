// Enhanced RawToPdfConverter.jsx
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

  useEffect(() => {
    if (content && !convertedPdfUrl) {
      extractTextFromContent(content);
    }
  }, [content, convertedPdfUrl]);

  const extractTextFromContent = async (urlOrContent) => {
    setLoading(true);
    setError(null);
    
    try {
      let extractedText = '';
      
      if (urlOrContent.startsWith('http')) {
        // It's a URL - check if it's PDF or text
        if (urlOrContent.endsWith('.pdf') || urlOrContent.includes('.pdf')) {
          // Use Cloudinary's text extraction feature
          extractedText = await extractTextFromPDF(urlOrContent);
        } else {
          // It's a text file - fetch directly
          const response = await fetch(urlOrContent);
          extractedText = await response.text();
        }
      } else {
        // It's already text content
        extractedText = urlOrContent;
      }
      
      setTextContent(extractedText);
      convertToReadablePDF(extractedText);
      
    } catch (err) {
      console.error('Error extracting text:', err);
      setError('Failed to extract text content. The file may be corrupted or in an unsupported format.');
      setLoading(false);
    }
  };

  const extractTextFromPDF = async (pdfUrl) => {
    try {
      // Method 1: Try Cloudinary's OCR/text extraction
      const cloudinaryUrl = pdfUrl.replace('/upload/', '/upload/fl_attachment:study-material.txt/');
      
      const response = await fetch(cloudinaryUrl);
      if (response.ok) {
        const text = await response.text();
        if (text && text.length > 100 && !text.startsWith('%PDF')) {
          return text;
        }
      }
      
      // Method 2: Use a PDF text extraction service
      return await extractWithPDFLib(pdfUrl);
      
    } catch (error) {
      throw new Error('PDF text extraction failed');
    }
  };

  const extractWithPDFLib = async (pdfUrl) => {
    // Simple client-side PDF text extraction
    try {
      const response = await fetch(pdfUrl);
      const arrayBuffer = await response.arrayBuffer();
      
      // Basic PDF structure parsing (simplified)
      const uint8Array = new Uint8Array(arrayBuffer);
      const pdfText = extractTextFromPDFBytes(uint8Array);
      
      return pdfText || 'Unable to extract text from this PDF. Please download the file to view it.';
    } catch (error) {
      return 'PDF content cannot be displayed as text. Download the file to view it properly.';
    }
  };

  const extractTextFromPDFBytes = (uint8Array) => {
    // Simple PDF text extraction (basic implementation)
    const decoder = new TextDecoder('iso-8859-1');
    const pdfString = decoder.decode(uint8Array);
    
    // Extract text between text operators
    const textMatches = pdfString.match(/\((.*?)\)/g);
    if (textMatches) {
      return textMatches.map(match => 
        match.slice(1, -1) // Remove parentheses
            .replace(/\\\(/g, '(') // Unescape characters
            .replace(/\\\)/g, ')')
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '\r')
            .replace(/\\t/g, '\t')
      ).join(' ').substring(0, 5000); // Limit length
    }
    
    return null;
  };

  const convertToReadablePDF = (text) => {
    if (!text) return;
    
    try {
      const doc = new jsPDF();
      doc.setFont('helvetica');
      doc.setFontSize(11);
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      const maxWidth = pageWidth - (2 * margin);
      
      // Clean and format the text
      const cleanText = text
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\t/g, '    ')
        .replace(/[^\x20-\x7E\n\r]/g, '') // Remove non-printable characters
        .substring(0, 50000); // Limit text length
      
      // Add title
      doc.setFontSize(16);
      doc.text(fileName || 'Study Material', margin, 20);
      doc.setFontSize(11);
      
      // Split text into lines
      const lines = doc.splitTextToSize(cleanText, maxWidth);
      
      let yPosition = 35;
      const lineHeight = 6;
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Add text line by line
      for (let i = 0; i < lines.length; i++) {
        if (yPosition + lineHeight > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
        
        doc.text(lines[i], margin, yPosition);
        yPosition += lineHeight;
      }
      
      // Add footer
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`Page ${i} of ${totalPages} - Extracted from ${fileName || 'original file'}`, 
                pageWidth - margin, pageHeight - 10, { align: 'right' });
      }
      
      const pdfBlob = doc.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
      onConversionComplete(url);
      
    } catch (error) {
      console.error('Error creating PDF:', error);
      setError('Failed to create readable PDF');
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = () => {
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `${fileName || 'study-material'}.pdf`;
      link.click();
    }
  };

  const downloadOriginal = () => {
    if (content.startsWith('http')) {
      const link = document.createElement('a');
      link.href = content;
      link.download = fileName || 'original-file';
      link.click();
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
              <h4 className="text-lg font-semibold text-white mb-2">Conversion Failed</h4>
              <p className="text-red-400 mb-4">{error}</p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={downloadOriginal}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500"
                >
                  Download Original
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-neutral-700/50 text-neutral-300 rounded-lg hover:bg-neutral-600/50"
                >
                  Close
                </button>
              </div>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
              <span className="ml-3 text-neutral-400">Extracting text content...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Text Preview */}
              <div className="bg-neutral-900/50 rounded-xl p-4 max-h-96 overflow-y-auto">
                <div className="text-sm text-neutral-400 mb-2">
                  Extracted Text Content ({textContent.length} characters)
                </div>
                <pre className="text-neutral-200 whitespace-pre-wrap text-sm font-mono bg-neutral-800/30 p-3 rounded-lg">
                  {textContent || 'No text content could be extracted.'}
                </pre>
                {!textContent && (
                  <p className="text-amber-400 text-sm mt-2">
                    This file doesn't contain extractable text. It may be a scanned document or image-based PDF.
                  </p>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-center space-x-4 flex-wrap gap-3">
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
                  Download Extracted PDF
                </button>
                
                <button
                  onClick={downloadOriginal}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Original File
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