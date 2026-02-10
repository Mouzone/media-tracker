import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

export const Route = createFileRoute('/_layout/$category')({
  component: CategoryView,
  validateSearch: z.object({
    sort: z.enum(['date', 'title', 'rating']).optional(),
    filter: z.string().optional(),
  }),
})

function CategoryView() {
  const { category } = Route.useParams()
  // const { sort, filter } = Route.useSearch()

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold capitalize mb-4">{category}</h1>
      <div className="flex gap-4 mb-4">
        {/* Placeholder for controls */}
        <select className="border p-2 rounded dark:bg-gray-800 dark:border-gray-700">
          <option value="date">Date Finished</option>
          <option value="title">Title</option>
          <option value="rating">Rating</option>
        </select>
        <input 
          type="text" 
          placeholder="Filter..." 
          className="border p-2 rounded dark:bg-gray-800 dark:border-gray-700" 
        />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {/* Placeholder Grid */}
        <p>Showing {category} items...</p>
      </div>
    </div>
  )
}
