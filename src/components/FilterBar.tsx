
import { Fragment, useState } from 'react'
import { Listbox, Transition, Combobox } from '@headlessui/react'
import { Check, ChevronsUpDown, X } from 'lucide-react'

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

  // Add Tag (removed unused function)

  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tag))
  }

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl shadow-sm items-start md:items-end transition-colors">
      
      {/* Status Filter */}
      <div className="w-full md:w-48 z-30">
        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 pl-1">Status</label>
        <Listbox value={status} onChange={setStatus}>
          <div className="relative">
            <Listbox.Button className="relative w-full cursor-pointer rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 py-2.5 pl-4 pr-10 text-left transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-gray-100/10 focus:border-gray-300 dark:focus:border-gray-500 sm:text-sm text-gray-900 dark:text-gray-100 font-semibold shadow-sm h-[42px]">
              <span className="block truncate text-gray-900 dark:text-gray-100">
                {statusOptions.find(opt => opt.value === status)?.label}
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <ChevronsUpDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
              </span>
            </Listbox.Button>
            <Transition
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className="absolute mt-1.5 max-h-60 w-full z-40 overflow-auto rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 py-1 text-base shadow-lg focus:outline-none sm:text-sm">
                {statusOptions.map((opt) => (
                  <Listbox.Option
                    key={opt.value}
                    className={({ active }) =>
                      `relative cursor-pointer select-none py-2.5 pl-10 pr-4 transition-colors ${
                        active ? 'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                      }`
                    }
                    value={opt.value}
                  >
                    {({ selected }) => (
                      <>
                        <span className={`block truncate ${selected ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-900 dark:text-gray-300'}`}>
                          {opt.label}
                        </span>
                        {selected ? (
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-900 dark:text-white">
                            <Check className="h-4 w-4" aria-hidden="true" />
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
       <div className="w-full md:w-48 z-20">
        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 pl-1">Sort By</label>
        <Listbox value={sortBy} onChange={setSortBy}>
          <div className="relative">
            <Listbox.Button className="relative w-full cursor-pointer rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 py-2.5 pl-4 pr-10 text-left transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-gray-100/10 focus:border-gray-300 dark:focus:border-gray-500 sm:text-sm text-gray-900 dark:text-gray-100 font-semibold shadow-sm h-[42px]">
              <span className="block truncate text-gray-900 dark:text-gray-100">
                {sortOptions.find(opt => opt.value === sortBy)?.label}
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <ChevronsUpDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
              </span>
            </Listbox.Button>
            <Transition
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className="absolute mt-1.5 max-h-60 w-full z-40 overflow-auto rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 py-1 text-base shadow-lg focus:outline-none sm:text-sm">
                {sortOptions.map((opt) => (
                  <Listbox.Option
                    key={opt.value}
                    className={({ active }) =>
                      `relative cursor-pointer select-none py-2.5 pl-10 pr-4 transition-colors ${
                        active ? 'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                      }`
                    }
                    value={opt.value}
                  >
                    {({ selected }) => (
                      <>
                        <span className={`block truncate ${selected ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-900 dark:text-gray-300'}`}>
                          {opt.label}
                        </span>
                        {selected ? (
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-900 dark:text-white">
                            <Check className="h-4 w-4" aria-hidden="true" />
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
      <div className="flex-1 min-w-[200px] z-10">
        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 pl-1">Filter by Tags</label>
        <div className="w-full">
            <Combobox value={selectedTags} onChange={setSelectedTags} multiple>
            <div className="relative">
              <div className="relative w-full cursor-text overflow-hidden rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-left transition-colors focus-within:ring-2 focus-within:ring-gray-900/10 dark:focus-within:ring-gray-100/10 focus-within:border-gray-300 dark:focus-within:border-gray-600 shadow-sm sm:text-sm">
                <div className="flex flex-wrap items-center gap-1.5 p-1.5 min-h-[42px]">
                    {selectedTags.map(tag => (
                        <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-xs font-bold uppercase tracking-wide">
                            {tag}
                            <button onClick={(e) => { e.stopPropagation(); removeTag(tag); }} className="ml-1.5 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                                <X className="h-3 w-3" />
                            </button>
                        </span>
                    ))}
                    <Combobox.Input
                    className="flex-1 w-full border-none px-2 py-1 text-sm leading-5 text-gray-900 dark:text-gray-100 font-medium placeholder-gray-400 dark:placeholder-gray-400 bg-transparent focus:ring-0 outline-none min-w-[80px]"
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
                <Combobox.Options className="absolute mt-1.5 max-h-60 w-full z-40 overflow-auto rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 py-1 text-base shadow-lg focus:outline-none sm:text-sm">
                  {filteredTags.length === 0 && tagQuery !== '' ? (
                    <div className="relative cursor-default select-none py-2.5 px-4 text-gray-500 dark:text-gray-300 font-medium">
                      Nothing found.
                    </div>
                  ) : (
                    filteredTags.map((tag) => (
                      <Combobox.Option
                        key={tag}
                        className={({ active }) =>
                          `relative cursor-pointer select-none py-2.5 pl-10 pr-4 transition-colors ${
                            active ? 'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                          }`
                        }
                        value={tag}
                      >
                        {() => (
                          <>
                            <span
                              className={`block truncate ${
                                selectedTags.includes(tag) ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-900 dark:text-gray-300'
                              }`}
                            >
                              {tag}
                            </span>
                            {selectedTags.includes(tag) ? (
                              <span
                                className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-900 dark:text-white"
                              >
                                <Check className="h-4 w-4" aria-hidden="true" />
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
