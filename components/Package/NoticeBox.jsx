'use client'

import { X } from 'lucide-react';
import { useState, useEffect } from 'react';

export function DismissableInfoBox({ packages }) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [sanitizedHtml, setSanitizedHtml] = useState('');

  useEffect(() => {
    import('dompurify').then((mod) => {
      const DOMPurify = mod.default;
      setSanitizedHtml(DOMPurify.sanitize(packages?.basicDetails?.notice || ''));
    });
  }, [packages?.basicDetails?.notice]);

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  if (isDismissed) return null;

  return (
    <div className="relative bg-red-100 text-red-700 border-l-4 border-red-500 m-4 p-4 flex items-center justify-between rounded-md shadow-md">
      <div className="flex flex-col items-start">
        <span className="mr-3 text-lg font-semibold">Important Notice:</span>
        {sanitizedHtml && (
          <div className="[&_a]:font-semibold [&_a]:underline text-sm md:text-base">
            <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
          </div>
        )}
      </div>
      <button onClick={handleDismiss} className="absolute top-4 right-4 ml-4 text-red-700 hover:text-red-900">
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}