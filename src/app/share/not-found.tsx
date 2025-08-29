import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Shared Grid Not Found</h2>
        <p className="text-gray-600 mb-6">
          The shared grid you&apos;re looking for doesn&apos;t exist or may have been removed.
        </p>
        <Link 
          href="/" 
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create Your Own Grid
        </Link>
      </div>
    </div>
  )
}
