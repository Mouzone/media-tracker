import { Fragment, useState } from 'react'
import { Listbox, Transition, Combobox } from '@headlessui/react'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import clsx from 'clsx'
import { STATUS_LABELS, STATUS_VALUES } from '../types'
import { suggestTags } from '../data/selectors'
import type { LibraryFilter, SortOption, StatusFilter } from '../data/selectors'

interface Option<T> {
  value: T
  label: string
}

const SORT_OPTIONS: Option<SortOption>[] = [
  { value: 'date_added', label: 'Date Added' },
  { value: 'date_finished', label: 'Date Finished' },
  { value: 'title', label: 'Title' },
  { value: 'rating', label: 'Rating' },
]

const STATUS_OPTIONS: Option<StatusFilter>[] = [
  { value: 'all', label: 'All Status' },
  ...STATUS_VALUES.map((value) => ({ value, label: STATUS_LABELS[value] })),
]

const FIELD_CLASSES =
  'focus-ring relative h-[42px] w-full cursor-pointer rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-4 pr-10 text-left font-semibold text-gray-900 shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:border-gray-600 dark:hover:bg-gray-700 sm:text-sm'

/**
 * These open **upward**. The filter bar lives in a panel pinned to the bottom of
 * the viewport, so a downward dropdown renders past the bottom edge — and because
 * the panel is `fixed`, there is nothing to scroll to reach it. Options below the
 * fold were simply unreachable.
 *
 * The height is capped against the viewport as well as at 15rem so the list still
 * fits (and scrolls) on short screens.
 */
const OPTIONS_CLASSES =
  'absolute bottom-full z-40 mb-1.5 max-h-[min(15rem,45vh)] w-full overflow-y-auto overscroll-contain rounded-xl border border-gray-200 bg-white py-1 text-base shadow-lg focus:outline-none dark:border-gray-700 dark:bg-gray-800 sm:text-sm'

const LABEL_CLASSES =
  'mb-1.5 block pl-1 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400'

/** Shared single-select field — the status and sort pickers were near-identical copies. */
function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
}: {
  label: string
  value: T
  options: Option<T>[]
  onChange: (value: T) => void
  className?: string
}) {
  return (
    <div className={className}>
      <Listbox value={value} onChange={onChange}>
        <Listbox.Label className={LABEL_CLASSES}>{label}</Listbox.Label>
        <div className="relative">
          <Listbox.Button className={FIELD_CLASSES}>
            <span className="block truncate">
              {options.find((option) => option.value === value)?.label}
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
            <Listbox.Options className={OPTIONS_CLASSES}>
              {options.map((option) => (
                <Listbox.Option
                  key={option.value}
                  value={option.value}
                  className={({ active }) =>
                    clsx(
                      'relative cursor-pointer select-none py-2.5 pl-10 pr-4 transition-colors',
                      active
                        ? 'bg-gray-50 text-gray-900 dark:bg-gray-700 dark:text-white'
                        : 'text-gray-700 dark:text-gray-300',
                    )
                  }
                >
                  {({ selected }) => (
                    <>
                      <span
                        className={clsx(
                          'block truncate',
                          selected
                            ? 'font-bold text-gray-900 dark:text-white'
                            : 'font-medium text-gray-900 dark:text-gray-300',
                        )}
                      >
                        {option.label}
                      </span>
                      {selected && (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-900 dark:text-white">
                          <Check className="h-4 w-4" aria-hidden="true" />
                        </span>
                      )}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  )
}

interface FilterBarProps {
  filter: LibraryFilter
  onChange: (patch: Partial<LibraryFilter>) => void
  availableTags: string[]
  onReset: () => void
  canReset: boolean
}

export function FilterBar({ filter, onChange, availableTags, onReset, canReset }: FilterBarProps) {
  const [tagQuery, setTagQuery] = useState('')

  // Searches every tag in the library, ranked. Selected tags stay in the list so
  // they can be toggled back off from here.
  const filteredTags = suggestTags(availableTags, tagQuery)

  return (
    <div className="flex flex-col items-start gap-4 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm transition-colors dark:border-gray-800 dark:bg-gray-900 md:flex-row md:items-end">
      <SelectField
        label="Status"
        value={filter.status}
        options={STATUS_OPTIONS}
        onChange={(status) => onChange({ status })}
        className="z-10 w-full md:w-44"
      />

      <SelectField
        label="Sort By"
        value={filter.sort}
        options={SORT_OPTIONS}
        onChange={(sort) => onChange({ sort })}
        className="z-20 w-full md:w-44"
      />

      {/* Stacking runs bottom-up to match the upward dropdowns: each field's list
          opens over the fields above it. */}
      <div className="z-30 min-w-[200px] flex-1">
        <Combobox
          value={filter.tags}
          onChange={(tags) => {
            onChange({ tags })
            setTagQuery('')
          }}
          multiple
        >
          <Combobox.Label className={LABEL_CLASSES}>Filter by Tags</Combobox.Label>
          <div className="relative">
            <div className="relative w-full cursor-text overflow-hidden rounded-xl border border-gray-200 bg-gray-50 text-left shadow-sm transition-colors focus-within:border-primary-500/50 focus-within:ring-2 focus-within:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-800 sm:text-sm">
              <div className="flex min-h-[42px] flex-wrap items-center gap-1.5 p-1.5">
                {filter.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-md bg-gray-200 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-gray-800 dark:bg-gray-700 dark:text-gray-100"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        onChange({ tags: filter.tags.filter((t) => t !== tag) })
                      }}
                      className="focus-ring ml-1.5 rounded transition-colors hover:text-red-500 dark:hover:text-red-400"
                      aria-label={`Remove tag ${tag}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <Combobox.Input
                  className="w-full min-w-[80px] flex-1 border-none bg-transparent px-2 py-1 text-sm font-medium leading-5 text-gray-900 placeholder-gray-400 outline-none focus:ring-0 dark:text-gray-100"
                  onChange={(event) => setTagQuery(event.target.value)}
                  placeholder={filter.tags.length === 0 ? 'Select tags...' : ''}
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
              <Combobox.Options className={OPTIONS_CLASSES}>
                {filteredTags.length === 0 ? (
                  <div className="relative select-none px-4 py-2.5 font-medium text-gray-500 dark:text-gray-300">
                    No matching tags.
                  </div>
                ) : (
                  filteredTags.map((tag) => (
                    <Combobox.Option
                      key={tag}
                      value={tag}
                      className={({ active }) =>
                        clsx(
                          'relative cursor-pointer select-none py-2.5 pl-10 pr-4 transition-colors',
                          active
                            ? 'bg-gray-50 text-gray-900 dark:bg-gray-700 dark:text-white'
                            : 'text-gray-700 dark:text-gray-300',
                        )
                      }
                    >
                      <span
                        className={clsx(
                          'block truncate',
                          filter.tags.includes(tag)
                            ? 'font-bold text-gray-900 dark:text-white'
                            : 'font-medium text-gray-900 dark:text-gray-300',
                        )}
                      >
                        {tag}
                      </span>
                      {filter.tags.includes(tag) && (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-900 dark:text-white">
                          <Check className="h-4 w-4" aria-hidden="true" />
                        </span>
                      )}
                    </Combobox.Option>
                  ))
                )}
              </Combobox.Options>
            </Transition>
          </div>
        </Combobox>
        {filter.tags.length > 1 && (
          <p className="mt-1.5 pl-1 text-[10px] font-medium text-gray-400">
            Showing items with all {filter.tags.length} tags
          </p>
        )}
      </div>

      <div className="z-10 flex items-center md:ml-auto md:pb-2">
        <button
          type="button"
          onClick={onReset}
          disabled={!canReset}
          className="focus-ring flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-bold uppercase tracking-widest text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
        >
          <X className="h-4 w-4" /> Reset
        </button>
      </div>
    </div>
  )
}
