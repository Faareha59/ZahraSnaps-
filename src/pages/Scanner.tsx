import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import { Camera } from 'lucide-react';

const Scanner = () => {
  const [scannedResult, setScannedResult] = useState('');
  const scannerRef = useRef<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    scannerRef.current = new Html5QrcodeScanner(
      'reader',
      {
        qrbox: {
          width: 250,
          height: 250,
        },
        fps: 5,
      },
      false
    );

    scannerRef.current.render(onScanSuccess, onScanError);

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, []);

  const onScanSuccess = (decodedText: string) => {
    setScannedResult(decodedText);
    // Handle the scanned QR code - navigate to photo or folder
    if (decodedText.includes('/photos/') || decodedText.includes('/folders/')) {
      navigate(decodedText);
    }
  };

  const onScanError = (error: any) => {
    console.warn(error);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto px-4 py-8"
    >
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Camera className="w-16 h-16 text-pink-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Scan QR Code
          </h1>
          <p className="text-gray-600">
            Point your camera at a QR code to view special photos!
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div id="reader" className="w-full"></div>
          {scannedResult && (
            <div className="mt-4 p-4 bg-pink-50 rounded-lg">
              <p className="text-gray-800">
                Scanned QR Code: {scannedResult}
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Scanner;