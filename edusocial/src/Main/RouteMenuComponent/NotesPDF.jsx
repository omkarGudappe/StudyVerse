import React, { useState, useEffect } from 'react'
import { useParams, useLocation } from 'react-router-dom';
import PdfViewer from './SmallComponents/PDFViewer';
import axios from "axios";

const NotesPDF = () => {
  const { id } = useParams();
  const location = useLocation();
  const [pdfUrl, setPdfUrl] = useState(null);
  
  useEffect(() => {
    
          const content = location.state?.content ?? null;
          setPdfUrl(content);

      if(!content) {
        fetchPdfUrl();
      }

    }, [id, location.state]);
          
    const fetchPdfUrl = async () => {
        try {
          const res = await axios.get(`${import.meta.env.VITE_API_URL}/Notes/${id}/pdf`);
          setPdfUrl(res.data.note.files.url);
        } catch (error) {
        }
      };
      

    if (!pdfUrl) {
      return (
        <div className="min-h-screen bg-neutral-900 w-full flex items-center justify-center text-center px-4">
          <div>
            <p className="text-white text-lg font-semibold mb-2">No PDF available</p>
            <p className="text-neutral-400">This note was opened without PDF data.</p>
            <p className="text-neutral-500 text-sm mt-3">Note ID: {id}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-neutral-900 w-full flex items-center justify-center">
        <PdfViewer 
          fileUrl={pdfUrl} 
          className="w-full h-screen"
        />
      </div>
    )
}

export default NotesPDF
