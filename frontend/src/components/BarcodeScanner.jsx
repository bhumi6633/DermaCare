import React, { useEffect, useRef } from 'react'
import Quagga from 'quagga'

const BarcodeScanner = ({ onBarcodeDetected, onError }) => {
  const scannerRef = useRef(null)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    
    Quagga.init({
      inputStream: {
        name: "Live",
        type: "LiveStream",
        target: scannerRef.current,
        constraints: {
          width: 640,
          height: 480,
          facingMode: "environment"
        },
      },
      decoder: {
        readers: ["ean_reader", "upc_reader", "ean_8_reader", "code_128_reader"]
      },
      locate: true,
      debug: false,
    }, (err) => {
      if (err) {
        console.error('[Scanner] Quagga initialization failed:', err)
        if (isMounted.current) {
          onError('Failed to initialize camera. Please grant camera permissions and refresh the page.')
        }
        return
      }
      Quagga.start()
    })

    const handleDetected = (result) => {
      const barcode = result.codeResult.code
      console.log('[Scanner] Barcode detected:', barcode)
      Quagga.stop()
      if (isMounted.current) {
        onBarcodeDetected(barcode)
      }
    }

    Quagga.onDetected(handleDetected)

    return () => {
      isMounted.current = false
      Quagga.offDetected(handleDetected)
      Quagga.stop()
    }
  }, [onBarcodeDetected, onError])

  return (
    <div ref={scannerRef} className="w-full h-full rounded-lg border-4 border-custom-pink">
      {/* Quagga will inject the video stream here, and the border will frame it. */}
    </div>
  )
}

export default BarcodeScanner 