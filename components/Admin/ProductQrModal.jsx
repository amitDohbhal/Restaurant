import React, { useRef } from 'react';
import QRCode from 'react-qr-code';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '../ui/dialog';
// Using native img tag instead of next/image for canvas operations
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
export default function ProductQrModal({
  open, onOpenChange, qrUrl, productTitle,
  productCode, categoryType, sizes, colors, price, oldPrice, logoUrl, productDescription, coupon
}) {
  const qrRef = useRef();
  const contentRef = useRef(); // For capturing modal content

  // Enhanced download function to capture all product details with proper styling
  const handleDownload = async () => {
    const downloadBtn = document.querySelector('.download-btn');
    const originalText = downloadBtn?.textContent;
    
    try {
      if (downloadBtn) {
        downloadBtn.textContent = 'Preparing...';
        downloadBtn.disabled = true;
      }

      // Create a temporary div to render the content for capture
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.width = '400px';
      container.style.padding = '20px';
      container.style.backgroundColor = 'white';
      container.style.borderRadius = '8px';
      container.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
      
      // Clone the content we want to capture
      const contentToCapture = contentRef.current.cloneNode(true);
      
      // Remove the download and close buttons from the clone
      const buttons = contentToCapture.querySelectorAll('button');
      buttons.forEach(btn => btn.remove());
      
      // Ensure proper spacing for the description
      const description = contentToCapture.querySelector('.description-container');
      if (description) {
        description.style.minHeight = '40px';
        description.style.overflow = 'hidden';
      }

      // Fix color swatches alignment
      const colorCells = contentToCapture.querySelectorAll('td');
      colorCells.forEach(cell => {
        if (cell.textContent?.trim() === 'Color :') {
          cell.style.verticalAlign = 'middle';
          cell.style.paddingTop = '8px';
          cell.style.paddingBottom = '8px';
        }
      });

      // Fix price strikethrough alignment
      const oldPrice = contentToCapture.querySelector('s');
      if (oldPrice) {
        oldPrice.style.verticalAlign = 'middle';
        oldPrice.style.marginLeft = '8px';
      }

      container.appendChild(contentToCapture);
      document.body.appendChild(container);

      // Use html2canvas to capture the content
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(container, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher resolution
        useCORS: true,
        allowTaint: true,
        logging: true,
        onclone: (clonedDoc) => {
          // Ensure all fonts are loaded before capture
          const style = document.createElement('style');
          style.textContent = `
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
            * { font-family: 'Inter', sans-serif; }
          `;
          clonedDoc.head.appendChild(style);
        }
      });

      // Clean up
      document.body.removeChild(container);

      // Create download link
      const link = document.createElement('a');
      link.download = `${productTitle || 'product'}-details.png`;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error('Error generating image:', error);
    } finally {
      if (downloadBtn) {
        downloadBtn.textContent = originalText || 'Download QR';
        downloadBtn.disabled = false;
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col items-center max-w-md bg-white rounded-xl border border-gray-300 p-6">
        {/* Main content to capture for download */}
        <div ref={contentRef} className="w-full flex flex-col items-center">

          {/* Visually hidden title for accessibility */}
          <VisuallyHidden>
            <DialogTitle>Product QR Code</DialogTitle>
          </VisuallyHidden>
          {/* QR Code */}
          <div ref={qrRef} className="mb-4 flex justify-center">
            <QRCode value={qrUrl} size={180} />
          </div>
          <hr className="w-full my-2 border-gray-300" />
          {/* Product Info */}
          <div className="w-full text-left font-serif text-sm">
            {/* Product Title */}
            <div className="text-xl font-semibold mb-2">
              {productTitle}
            </div>

            {/* Description with HTML content */}
            <div className="text-xs text-gray-700 pb-5">
              <div 
                className="h-10 overflow-x-hidden"
                dangerouslySetInnerHTML={{ 
                  __html: productDescription || ''
                }} 
              />
            </div>

            {/* Details Table */}
            <table className="w-full mb-2">
              <tbody>
              <tr>
                  <td className="font-bold p-2 w-1/3">Product Code:</td>
                  <td>{productCode}</td>
                </tr>
                <tr>
                  <td className="font-bold p-2">Size :</td>
                  <td>{Array.isArray(sizes) ? sizes.join(' , ') : sizes}</td>
                </tr>
                <tr>
                  <td className="font-bold py-2">Color :</td>
                  <td className="flex items-center gap-2 ">
                    {colors?.map((clr, i) => (
                      <span
                        key={i}
                        className="inline-block w-4 h-4 rounded-full border"
                        style={{ backgroundColor: clr }}
                      ></span>
                    ))}
                  </td>
                </tr>
                <tr>
                  <td className="align-top p-2 font-bold">Price :</td>
                  <td className="align-top">
                    <div className="flex items-baseline">
                      <span className="text-lg font-bold text-black">₹{price}</span>
                      {oldPrice && price !== oldPrice && (
                        <span className="text-gray-500 line-through text-sm ml-2">₹{oldPrice}</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-600">inclusive of all taxes</div>
                  </td>
                  <td className="text-right" rowSpan={6}>
                    {logoUrl && (
                    <img 
                      src={logoUrl} 
                      alt="Logo" 
                      width={150} 
                      height={50} 
                      className="inline-block object-contain"
                      crossOrigin="anonymous"
                    />
                  )}  
                  </td>
                </tr>
              </tbody>
            </table>
            <hr className="w-full my-2 border-gray-300" />
            <div className="text-md text-center w-full">www.info@adventureaxis.in</div>
          </div>

        </div>
        <DialogFooter className="w-full flex flex-col gap-2 mt-2">
          <Button onClick={handleDownload} className="download-btn w-full bg-blue-600 hover:bg-blue-700 text-white">Download QR</Button>
          <DialogClose asChild>
            <Button variant="outline" className="w-full">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
