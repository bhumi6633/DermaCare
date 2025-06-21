import React, { useEffect, useRef, useState } from 'react'
import Quagga from 'quagga'
import axios from 'axios' 

const BarcodeScanner = ({ onBarcodeDetected, onError }) => {
  const scannerRef = useRef(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState(null)

  const startScanner = () => {
    setIsScanning(true)
    setError(null)
    console.log('[Scanner] Initializing Quagga...')
    
    Quagga.init({
      inputStream: {
        name: "Live",
        type: "LiveStream",
        target: scannerRef.current,
        constraints: {
          width: 640,
          height: 480,
          facingMode: "environment" // Use back camera on mobile
        },
      },
      decoder: {
        readers: [
          "ean_reader",
          "ean_8_reader",
          "code_128_reader",
          "code_39_reader",
          "upc_reader",
          "upc_e_reader"
        ]
      },
      locate: true
    }, (err) => {
      if (err) {
        console.error('[Scanner] Quagga initialization failed:', err)
        setError('Failed to initialize camera. Please check camera permissions.')
        setIsScanning(false)
        return
      }
      
      console.log('Quagga initialized successfully')
      Quagga.start()
      console.log('[Scanner] Quagga started')
    })

    // Handle barcode detection
    Quagga.onDetected((result) => {
      const barcode = result.codeResult.code
      console.log('[Scanner] Barcode detected:', barcode)
      Quagga.stop()
      setIsScanning(false)
    
      // 🔽 Send to backend
      axios.post("http://localhost:5000/analyze", {
        barcode: barcode
      })
      
      .then((res) => {
        console.log("Analysis result:", res.data)
        // Show result to user here
      })
      .catch((err) => {
        console.error("Error from backend:", err)
      })
    
      onBarcodeDetected && onBarcodeDetected(barcode)
    })

    // Handle errors
    Quagga.onProcessed((result) => {
      if (result) {
        if (result.codeResult && result.codeResult.code) {
          console.log('[Scanner] Frame processed, code:', result.codeResult.code)
        } else {
          console.log('[Scanner] Frame processed, no code found')
        }
      }
    })
  }

  const stopScanner = () => {
    if (isScanning) {
      Quagga.stop()
      setIsScanning(false)
      console.log('[Scanner] Quagga stopped')
    }
  }

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (isScanning) {
        Quagga.stop()
        console.log('[Scanner] Quagga stopped on unmount')
      }
    }
  }, [isScanning])

  const handleStartScan = () => {
    startScanner()
  }

  const handleStopScan = () => {
    stopScanner()
  }

  return (
    <div className="scanner-container">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Scan Product Barcode
        </h2>
        <p className="text-gray-600">
          Position the barcode within the frame to scan
        </p>
      </div>

      {/* Scanner Controls */}
      <div className="flex justify-center gap-4 mb-4">
        {!isScanning ? (
          <button
            onClick={handleStartScan}
            className="btn-primary"
          >
            📷 Start Scanner
          </button>
        ) : (
          <button
            onClick={handleStopScan}
            className="btn-secondary"
          >
            ⏹️ Stop Scanner
          </button>
        )}
      </div>

      {/* Visual scanning indicator */}
      {isScanning && (
        <div className="flex justify-center items-center mb-4">
          <span className="animate-spin mr-2 h-5 w-5 border-2 border-primary-600 border-t-transparent rounded-full"></span>
          <span className="text-primary-600 font-medium">Scanning...</span>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Scanner Viewport */}
      <div className="relative">
        <div
          ref={scannerRef}
          className="w-full max-w-md mx-auto bg-gray-900 rounded-lg overflow-hidden"
          style={{ height: '300px' }}
        >
          {!isScanning && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-400">
                <div className="text-4xl mb-2">📷</div>
                <p>Click "Start Scanner" to begin</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Scanning Overlay */}
        {isScanning && (
          <div className="scanner-overlay">
            <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-primary-500"></div>
            <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-primary-500"></div>
            <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-primary-500"></div>
            <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-primary-500"></div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-4 text-center text-sm text-gray-500">
        <p>💡 Tip: Ensure good lighting and hold the barcode steady</p>
      </div>
    </div>
  )
}

export default BarcodeScanner 