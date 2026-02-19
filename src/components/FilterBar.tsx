
import { Fragment, useState } from 'react'
import { Listbox, Transition, Combobox } from '@headlessui/react'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import clsx from 'clsx'

type SortOption = 'date' | 'title' | 'rating'
type StatusOption = 'finished' | 'dropped' | 'all'

interface FilterBarProps {
  status: StatusOption
  setStatus: (status: StatusOption) => void
  sortBy: SortOption
  setSortBy: (sort: SortOption) => void
  selectedTags: string[]
  setSelectedTags: (tags: string[]) => void
  availableTags: string[]
}

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'date', label: 'Date Added' },
  { value: 'title', label: 'Title' },
  { value: 'rating', label: 'Rating' },
]

const statusOptions: { value: StatusOption; label: string }[] = [
  { value: 'all', label: 'All Status' },
  { value: 'finished', label: 'Finished' },
  { value: 'dropped', label: 'Dropped' },
]

export function FilterBar({ 
  status, 
  setStatus, 
  sortBy, 
  setSortBy, 
  selectedTags, 
  setSelectedTags,
  availableTags 
}: FilterBarProps) {
  const [tagQuery, setTagQuery] = useState('')

  const filteredTags =
    tagQuery === ''
      ? availableTags
      : availableTags.filter((tag) =>
          tag.toLowerCase().includes(tagQuery.toLowerCase())
        )

  const addTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag])
    }
    setTagQuery('')
  }

  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tag))
  }

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      
      {/* Status Filter */}
      <div className="w-full md:w-48">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
        <Listbox value={status} onChange={setStatus}>
          <div className="relative mt-1">
            <Listbox.Button className="relative w-full cursor-default rounded-lg bg-gray-100 dark:bg-gray-700 py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm">
              <span className="block truncate text-gray-900 dark:text-gray-100">
                {statusOptions.find(opt => opt.value === status)?.label}
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronsUpDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </span>
            </Listbox.Button>
            <Transition
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className="absolute mt-1 max-h-60 w-full z-10 overflow-auto rounded-md bg-white dark:bg-gray-700 py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
                {statusOptions.map((opt) => (
                  <Listbox.Option
                    key={opt.value}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                        active ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-900 dark:text-indigo-100' : 'text-gray-900 dark:text-gray-100'
                      }`
                    }
                    value={opt.value}
                  >
                    {({ selected }) => (
                      <>
                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                          {opt.label}
                        </span>
                        {selected ? (
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-600 dark:text-indigo-400">
                            <Check className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>
        </Listbox>
      </div>

       {/* Sort Filter */}
       <div className="w-full md:w-48">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sort By</label>
        <Listbox value={sortBy} onChange={setSortBy}>
          <div className="relative mt-1">
            <Listbox.Button className="relative w-full cursor-default rounded-lg bg-gray-100 dark:bg-gray-700 py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm">
              <span className="block truncate text-gray-900 dark:text-gray-100">
                {sortOptions.find(opt => opt.value === sortBy)?.label}
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronsUpDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </span>
            </Listbox.Button>
            <Transition
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className="absolute mt-1 max-h-60 w-full z-10 overflow-auto rounded-md bg-white dark:bg-gray-700 py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
                {sortOptions.map((opt) => (
                  <Listbox.Option
                    key={opt.value}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                        active ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-900 dark:text-indigo-100' : 'text-gray-900 dark:text-gray-100'
                      }`
                    }
                    value={opt.value}
                  >
                    {({ selected }) => (
                      <>
                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                          {opt.label}
                        </span>
                        {selected ? (
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-600 dark:text-indigo-400">
                            <Check className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>
        </Listbox>
      </div>

      {/* Tags Filter */}
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Filter by Tags</label>
        <div className="w-full">
            <Combobox value={selectedTags} onChange={setSelectedTags} multiple>
            <div className="relative mt-1">
              <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700 text-left shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm">
                <div className="flex flex-wrap gap-1 p-1">
                    {selectedTags.map(tag => (
                        <span key={tag} className="inline-flex items-center px-2 py-1 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-xs font-medium">
                            {tag}
                            <button onClick={(e) => { e.stopPropagation(); removeTag(tag); }} className="ml-1 hover:text-indigo-500">
                                <X className="h-3 w-3" />
                            </button>
                        </span>
                    ))}
                    <Combobox.Input
                    className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 dark:text-gray-100 bg-transparent focus:ring-0"
                    onChange={(event) => setTagQuery(event.target.value)}
                    placeholder={selectedTags.length === 0 ? "Select tags..." : ""}
                    displayValue={() => tagQuery} 
                    value={tagQuery}
                    />
                </div>
              </div>
              <Transition
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
                afterLeave={() => setTagQuery('')}
              >
                <Combobox.Options className="absolute mt-1 max-h-60 w-full z-10 overflow-auto rounded-md bg-white dark:bg-gray-700 py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
                  {filteredTags.length === 0 && tagQuery !== '' ? (
                    <Combobox.Option
                        className="relative cursor-default select-none py-2 px-4 text-gray-700 dark:text-gray-300 ui-active:bg-indigo-100 ui-active:text-indigo-900"
                        value={tagQuery}
                    >
                      Create "{tagQuery}"
                    </Combobox.Option>
                  ) : (
                    filteredTags.map((tag) => (
                      <Combobox.Option
                        key={tag}
                        className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-10 pr-4 ${
                            active ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-900 dark:text-indigo-100' : 'text-gray-900 dark:text-gray-100'
                          }`
                        }
                        value={tag}
                      >
                        {({ selected, active }) => (
                          <>
                            <span
                              className={`block truncate ${
                                selectedTags.includes(tag) ? 'font-medium' : 'font-normal'
                              }`}
                            >
                              {tag}
                            </span>
                            {selectedTags.includes(tag) ? (
                              <span
                                className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                  active ? 'text-white' : 'text-teal-600'
                                }`}
                              >
                                <Check className="h-5 w-5" aria-hidden="true" />
                              </span>
                            ) : null}
                          </>
                        )}
                      </Combobox.Option>
                    ))
                  )}
                </Combobox.Options>
              </Transition>
            </div>
          </Combobox>
        </div>
      </div>
    </div>
  )
}
