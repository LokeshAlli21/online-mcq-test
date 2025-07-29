import React from 'react'

function NotFoundPage() {
  return (
  <div className="max-w-4xl mx-auto p-8 text-center">
    <h1 className="text-6xl font-bold text-gray-400 mb-4">404</h1>
    <h2 className="text-2xl font-semibold text-gray-600 mb-4">Page Not Found</h2>
    <p className="text-gray-500 mb-8">
      The page you're looking for doesn't exist or has been moved.
    </p>
    <button 
      onClick={() => window.location.href = '/'}
      className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
    >
      Go Back Home
    </button>
  </div>
  )
}

export default NotFoundPage