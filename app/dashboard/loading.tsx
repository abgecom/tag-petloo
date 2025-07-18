export default function Loading() {
  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-48"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded w-24"></div>
        </div>

        {/* Statistics Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg border">
              <div className="flex justify-between items-center mb-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-4 w-4 bg-gray-200 rounded"></div>
              </div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>

        {/* Filters Skeleton */}
        <div className="flex gap-4">
          <div className="flex-1 h-10 bg-gray-200 rounded"></div>
          <div className="w-48 h-10 bg-gray-200 rounded"></div>
        </div>

        {/* Orders Table Skeleton */}
        <div className="bg-white rounded-lg border">
          <div className="p-6 border-b">
            <div className="h-6 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex justify-between items-center p-4 border rounded">
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                    <div className="h-4 bg-gray-200 rounded w-12"></div>
                  </div>
                  <div className="space-y-1">
                    <div className="h-3 bg-gray-200 rounded w-48"></div>
                    <div className="h-3 bg-gray-200 rounded w-32"></div>
                    <div className="h-3 bg-gray-200 rounded w-40"></div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
