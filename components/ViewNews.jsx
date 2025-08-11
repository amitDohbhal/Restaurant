// News modal for viewing news details. Usage: <ViewNews news={newsObj} onClose={fn} />
export default function ViewNews({ news, onClose }) {
  if (!news) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="rounded-2xl bg-white shadow-2xl w-full max-w-lg h-[90vh] relative flex flex-col overflow-y-auto animate-fadeIn">
        {/* Close Button */}
        <button
          aria-label="Close"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-gray-200 hover:bg-gray-400 rounded-full p-2"
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
        {/* News Image */}
        {news.image?.url && (
          <div className="w-full h-64 relative rounded-t-2xl overflow-hidden">
            <img src={news.image.url} alt="News Image" className="w-full h-full object-cover" />
          </div>
        )}
        {/* News Content */}
        <div className="flex flex-col items-start px-6 py-4 flex-1 overflow-y-auto">
          <div className="font-bold text-2xl mb-2 text-gray-900">{news.title}</div>
          {news.date && <div className="text-sm border bg-yellow-200 rounded-xl px-2 text-gray-700 mb-2">{news.date}</div>}
          <div className="text-base text-gray-800 mb-4 whitespace-pre-line">{news.description}</div>
        </div>
        <div className="flex justify-end pt-2 px-6 pb-4">
          <button onClick={onClose} className="bg-black text-white px-6 py-2 rounded-full hover:bg-gray-800 shadow">Close</button>
        </div>
      </div>
    </div>
  );
}

