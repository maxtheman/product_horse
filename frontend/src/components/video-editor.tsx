import React, { useState, useEffect, useRef } from 'react'
import {
  Search,
  SkipForward,
  SkipBack,
  Save,
  X,
  Check,
  Scissors,
  GripVertical,
  Trash2,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { createSwapy, Swapy } from 'swapy'
import { create } from 'zustand'

interface Word {
  hidden: boolean // set to false at start for all words
  text: string
  start: number
  end: number
  id: string
}

interface Clip {
  id: string
  title: string
  speaker: string
  words: Word[]
  inTimeline: boolean
  preview: boolean
  fromSearch: string
}

const exampleClips: Clip[] = [
  {
    id: '1',
    title: 'women_music',
    speaker: 'Speaker A',
    words: [
      { text: 'Hey,', start: 0, end: 0.5, hidden: false, id: '1' },
      { text: 'this', start: 0.5, end: 0.7, hidden: false, id: '2' },
      { text: 'is', start: 0.7, end: 0.8, hidden: false, id: '3' },
      { text: 'Ren', start: 0.8, end: 1.0, hidden: false, id: '4' },
      { text: 'and', start: 1.0, end: 1.2, hidden: false, id: '5' },
      { text: "I'm", start: 1.2, end: 1.4, hidden: false, id: '6' },
      { text: 'testing', start: 1.4, end: 1.8, hidden: false, id: '7' },
      { text: 'this', start: 1.8, end: 2.0, hidden: false, id: '8' },
      { text: 'tool', start: 2.0, end: 2.3, hidden: false, id: '9' },
      { text: 'called', start: 2.3, end: 2.6, hidden: false, id: '10' },
      { text: 'Descript.', start: 2.6, end: 3.0, hidden: false, id: '11' },
    ],
    inTimeline: false,
    preview: false,
    fromSearch: 'women_music',
  },
  {
    id: '2',
    title: 'women_m...',
    speaker: 'Speaker B',
    words: [
      { text: 'This', start: 0, end: 0.3, hidden: false, id: '12' },
      { text: 'text', start: 0.3, end: 0.6, hidden: false, id: '13' },
      { text: "won't", start: 0.6, end: 0.9, hidden: false, id: '14' },
      { text: 'be', start: 0.9, end: 1.1, hidden: false, id: '15' },
      { text: 'audible', start: 1.1, end: 1.5, hidden: false, id: '16' },
      { text: 'because', start: 1.5, end: 1.8, hidden: false, id: '17' },
      { text: 'I', start: 1.8, end: 1.9, hidden: false, id: '18' },
      { text: 'typed', start: 1.9, end: 2.2, hidden: false, id: '19' },
      { text: 'it', start: 2.2, end: 2.3, hidden: false, id: '20' },
      { text: 'in.', start: 2.3, end: 2.5, hidden: false, id: '26' },
    ],
    inTimeline: false,
    preview: false,
    fromSearch: 'women_music',
  },
  {
    id: '3',
    title: 'Lo...',
    speaker: 'Speaker A',
    words: [
      { text: 'Lorem', start: 0, end: 0.5, hidden: false, id: '21' },
      { text: 'ipsum', start: 0.5, end: 1.0, hidden: false, id: '22' },
      { text: 'dolor', start: 1.0, end: 1.5, hidden: false, id: '23' },
      { text: 'sit', start: 1.5, end: 1.8, hidden: false, id: '24' },
      { text: 'amet,', start: 1.8, end: 2.2, hidden: false, id: '25' },
    ],
    inTimeline: false,
    preview: false,
    fromSearch: 'women_music',
  },
]

interface HighlightedWords {
  clipId: string
  startId: string | null
  endId: string | null
}

interface VideoEditorStore {
  swapyRef: Swapy | null
  setSwapyRef: (ref: Swapy) => void
  currentTimelineDuration: number
  setCurrentTimelineDuration: (duration: number) => void
  currentSeek: number
  setCurrentSeek: (seek: number) => void
  clips: Clip[]
  clipsInTimeline: Clip[]
  clipsWithPreview: Clip[]
  clipsInSearch: Clip[]
  currentSearch: string
  setCurrentSearch: (search: string) => void
  videoTitle: string
  setClips: (clips: Clip[]) => void
  highlightedWords: HighlightedWords | null
  setHighlightedWords: (clipId: string, wordId: string) => void
  trimFromHighlightedWords: (clipId: string) => void
  toggleClipFromTimeline: (clipId: string) => void
  refreshClipText: (clipId: string) => void
  setPreview: (clipId: string) => void
  wordIdAtCurrentSeek: string
  setWordIdAtCurrentSeek: (wordId: string) => void
  enableDropZones: boolean
  setEnableDropZones: (enable: boolean) => void
  clipDragged: string | null
  setClipDragged: (clipId: string | null) => void
  clipIsDragging: boolean
  setClipIsDragging: (isDragging: boolean) => void
  handleSwap: (event: {
    data: { array: { slotId: string; itemId: string | null }[] }
  }) => void
  mostRecentSwapEvent: {
    data: { array: { slotId: string; itemId: string | null }[] }
  } | null
  setMostRecentSwapEvent: (event: {
    data: { array: { slotId: string; itemId: string | null }[] }
  }) => void
}

const useVideoEditorStore = create<VideoEditorStore>((set) => ({
  swapyRef: null,
  setSwapyRef: (ref: Swapy) => set({ swapyRef: ref }),
  currentTimelineDuration: 0,
  setCurrentTimelineDuration: (duration: number) =>
    set({ currentTimelineDuration: duration }),
  currentSeek: 0,
  setCurrentSeek: (seek: number) => {
    const { clipsInTimeline } = useVideoEditorStore.getState()
    const getCurrentWord = () => {
      let accumulatedTime = 0
      for (const clip of clipsInTimeline) {
        for (let i = 0; i < clip.words.length; i++) {
          const word = clip.words[i]
          if (accumulatedTime + word.end > seek) {
            return { clipId: clip.id, wordIndex: i.toString() }
          }
        }
        accumulatedTime += clip.words[clip.words.length - 1]?.end || 0
      }
    }
    set({ currentSeek: seek })
    set({ wordIdAtCurrentSeek: getCurrentWord()?.wordIndex || '' })
  },
  clips: exampleClips, // Initialize with example clips for now
  clipsInTimeline: [],
  clipsWithPreview: [],
  clipDragged: null,
  setClipDragged: (clipId: string | null) => set({ clipDragged: clipId }),
  clipIsDragging: false,
  setClipIsDragging: (isDragging: boolean) =>
    set({ clipIsDragging: isDragging }),
  enableDropZones: false,
  setEnableDropZones: (enable: boolean) => set({ enableDropZones: enable }),
  currentSearch: 'women_music',
  clipsInSearch: [],
  setCurrentSearch: (search: string) => {
    const { clips } = useVideoEditorStore.getState()
    const filteredClips = clips.filter((clip) => clip.fromSearch === search)
    set({ clipsInSearch: filteredClips })
    set({ currentSearch: search })
  },
  videoTitle: 'Example Video',
  setClips: (clips) => set({ clips }),
  highlightedWords: null,
  setHighlightedWords: (clipId: string, wordId: string) => {
    const highlightedWordsNow = useVideoEditorStore.getState().highlightedWords
    if (!highlightedWordsNow || highlightedWordsNow.clipId !== clipId) {
      set({ highlightedWords: { clipId, startId: wordId, endId: wordId } })
    } else if (highlightedWordsNow.clipId === clipId) {
      if (!highlightedWordsNow.startId) {
        // if start is null, set it to the wordId
        set({ highlightedWords: { ...highlightedWordsNow, startId: wordId } })
      } else if (highlightedWordsNow.startId && !highlightedWordsNow.endId) {
        // if start is not null, set end to the wordId
        set({ highlightedWords: { ...highlightedWordsNow, endId: wordId } })
      } else if (highlightedWordsNow.startId && highlightedWordsNow.endId) {
        // if start and end are not null, set start to the wordId and end to null
        set({ highlightedWords: { clipId, startId: wordId, endId: null } })
      } else {
        // if none of the above, set highlightedWords to null
        console.log(
          'weird state detected in highlightedWords',
          highlightedWordsNow
        )
        set({ highlightedWords: null })
      }
    }
  },
  trimFromHighlightedWords: (clipId: string) => {
    const { clips, highlightedWords } = useVideoEditorStore.getState()
    const clipToTrim = clips.find((clip) => clip.id === clipId)
    if (
      !clipToTrim ||
      !highlightedWords ||
      !highlightedWords.startId ||
      !highlightedWords.endId
    )
      return
    const clipWords = clipToTrim.words
    const startIndex = clipWords.findIndex(
      (word) => word.id === highlightedWords.startId
    )
    const endIndex = clipWords.findIndex(
      (word) => word.id === highlightedWords.endId
    )
    const wordsToHide = clipWords.slice(startIndex, endIndex)
    const updatedClip = {
      ...clipToTrim,
      words: clipToTrim.words.map((word) => ({
        ...word,
        hidden: wordsToHide.some((word) => word.id === word.id),
      })),
    }
    set({ clips: [...clips, updatedClip] })
    set({ highlightedWords: null })
  },
  toggleClipFromTimeline: (clipId: string) => {
    const { clips, currentSearch } = useVideoEditorStore.getState()
    const clipToUpdateOrRemove = clips.find((clip) => clip.id === clipId)
    if (!clipToUpdateOrRemove) return
    if (clipToUpdateOrRemove.fromSearch === currentSearch) {
      const updatedClip = {
        ...clipToUpdateOrRemove,
        inTimeline: !clipToUpdateOrRemove.inTimeline,
        preview: false, // turn off preview if it is on
      }
      const updatedClips = clips.map((clip) =>
        clip.id === clipId ? updatedClip : clip
      )
      set({ clips: updatedClips })
      set({ clipsInTimeline: updatedClips.filter((clip) => clip.inTimeline) })
    } else {
      // if the clip is not from the current search, remove it from the clips array
      const updatedClips = clips.filter((clip) => clip.id !== clipId)
      set({ clips: updatedClips })
    }
  },
  refreshClipText: (clipId: string) => {
    const { clips } = useVideoEditorStore.getState()
    const clipToRefresh = clips.find((clip) => clip.id === clipId)
    if (!clipToRefresh) return
    const updatedClip = {
      ...clipToRefresh,
      words: clipToRefresh.words.map((word) => ({ ...word, hidden: false })),
    }
    set({ clips: [...clips, updatedClip] })
  },
  setPreview: (clipId: string) => {
    // sets preview to true if it is false, and vice versa
    const { clips } = useVideoEditorStore.getState()
    const clipToUpdate = clips.find((clip) => clip.id === clipId)
    console.log('clipToUpdate', clipToUpdate)
    if (!clipToUpdate) return
    if (clipToUpdate.inTimeline) {
      throw new Error('Cannot set preview for clip that is in timeline')
    }
    const updatedClip = {
      ...clipToUpdate,
      preview: !clipToUpdate.preview,
    }
    const updatedClips = clips.map((clip) =>
      clip.id === clipId ? updatedClip : clip
    )
    set({ clips: updatedClips })
    set({ clipsWithPreview: updatedClips.filter((clip) => clip.preview) })
  },
  wordIdAtCurrentSeek: '',
  setWordIdAtCurrentSeek: (wordId: string) =>
    set({ wordIdAtCurrentSeek: wordId }),
  mostRecentSwapEvent: null,
  setMostRecentSwapEvent: (event: {
    data: { array: { slotId: string; itemId: string | null }[] }
  }) => set({ mostRecentSwapEvent: event }),
  handleSwap: (event: {
    data: { array: { slotId: string; itemId: string | null }[] }
  }) => {
    const {
      toggleClipFromTimeline,
      setClipDragged,
      setClipIsDragging,
      setEnableDropZones,
      setPreview,
      swapyRef,
    } = useVideoEditorStore.getState()
    console.log('swapy.onSwap', event)
    if (!useVideoEditorStore.getState().clipIsDragging) {
      console.log(event)
      console.log('swapy locked on while dragging event', event)
      const swapyData = event.data.array
      const timelineEmpty = swapyData.find(
        (item) => item.slotId === 'timeline-empty'
      )
      const previewDropZone = swapyData.find(
        (item) => item.slotId === 'preview-drop-zone'
      )
      // console.log('timelineEmpty', timelineEmpty)
      // console.log('previewDropZone', previewDropZone)
      if (timelineEmpty && timelineEmpty.itemId != null) {
        console.log('timelineEmpty', timelineEmpty)
        const clip = useVideoEditorStore.getState().clipDragged
        if (clip && clip == timelineEmpty.itemId) {
          console.log('cliTogglefromTimelinep', clip)
          toggleClipFromTimeline(clip)
          setClipDragged(null)
          setClipIsDragging(false)
        }
        setEnableDropZones(false)
      } else if (previewDropZone && previewDropZone.itemId != null) {
        const clip = useVideoEditorStore.getState().clipDragged
        if (clip && clip == previewDropZone.itemId) {
          console.log('clipToPreview', clip)
          setPreview(clip)
          setClipDragged(null)
          setClipIsDragging(false)
        } else {
          console.log('clip dragged but not dropped anywhere')
        }
        // swapyRef?.setData({ array: swapyData })
      }
    }
  },
}))

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

interface SearchBinProps {
  searchBinWidth: number
  handleSearchBinResize: (e: React.MouseEvent) => void
}

const DropZone = ({
  defaultText,
  swapySlot,
}: {
  defaultText: string
  swapySlot: string
}) => {
  return (
    <>
      <div
        className="flex items-center justify-center h-full text-center text-gray-500 bg-gray-100 border-2 border-gray-300 border-dashed rounded-lg select-none"
        data-swapy-slot={swapySlot}
      >
        {defaultText}
      </div>
    </>
  )
}

const SearchBin = ({
  searchBinWidth,
  handleSearchBinResize,
}: SearchBinProps) => {
  const {
    clipsInSearch,
    setEnableDropZones,
    setClipDragged,
    setClipIsDragging,
    clipIsDragging,
    setCurrentSearch,
    handleSwap,
  } = useVideoEditorStore()
  const dragListener = (e: React.DragEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    const swapyItem = target.closest('[data-swapy-item]')?.getAttribute('data-swapy-item')
    console.log('target', swapyItem)
    if (swapyItem) {
      setClipDragged(swapyItem)
    }
    setClipIsDragging(true)
    setEnableDropZones(true)
    console.log(`dragging ${useVideoEditorStore.getState().clipDragged}`)
  }
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    const swapyItem = target.closest('[data-swapy-item]')?.getAttribute('data-swapy-item')
    if (
      clipIsDragging && useVideoEditorStore.getState().clipDragged == swapyItem
    ) {
      setClipIsDragging(false)
      const mostRecentSwapEvent =
        useVideoEditorStore.getState().mostRecentSwapEvent
      if (mostRecentSwapEvent) {
        handleSwap(mostRecentSwapEvent)
      }
      setEnableDropZones(false)
    }
  }
  const clipResultList = clipsInSearch.map((clip, index) => (
    <span
      key={`search-spot-${index}`}
      data-swapy-slot={`search-spot-${index}`}
      onMouseDown={dragListener}
      onMouseUp={handleDrop}
      className="cursor-move select-none"
    >
      <div
        key={clip.id}
        data-swapy-item={clip.id}
        className="p-4 border border-gray-200 rounded-lg shadow-sm cursor-move bg-gray-50"
      >
        <div className="font-semibold" data-swapy-text>
          {clip.title}
        </div>
        <div className="text-sm text-gray-600" data-swapy-text>
          {clip.speaker}
        </div>
        <div className="mt-1 text-xs text-gray-500" data-swapy-text>
          {formatTime(clip.words[clip.words.length - 1]?.end || 0)}
        </div>
        <div
          className="mt-2 text-sm text-gray-700 line-clamp-2"
          data-swapy-text
        >
          {clip.words.map((w) => w.text).join(' ')}
        </div>
      </div>
    </span>
  ))
  return (
    <div
      className={`bg-white p-4 border-r border-gray-200 relative`}
      style={{ width: `${searchBinWidth}%` }}
    >
      <div className="mb-4">
        <div className="flex items-center space-x-2">
          <Input
            type="search"
            placeholder="Search for clips"
            className="flex-1"
          />
          <Button
            size="icon"
            variant="secondary"
            className="bg-gray-200 hover:bg-gray-300"
            onClick={() => setCurrentSearch('women_music')}
          >
            <Search className="w-4 h-4" />
            <span className="sr-only">Search</span>
          </Button>
        </div>
      </div>
      <div className="space-y-4">{clipResultList}</div>
      {/* Resize handle */}
      <div
        className="absolute top-0 right-0 w-1 h-full bg-gray-300 cursor-col-resize hover:bg-gray-400"
        onMouseDown={handleSearchBinResize}
      >
        <div className="absolute right-0 p-1 transform -translate-y-1/2 bg-gray-400 rounded-l top-1/2">
          <GripVertical className="w-3 h-3 text-white" />
        </div>
      </div>
    </div>
  )
}

const ClipContextMenu: React.FC<{
  clip: Clip
  highlightedWords: HighlightedWords | null
}> = ({ clip, highlightedWords }) => {
  const {
    setHighlightedWords,
    trimFromHighlightedWords,
    toggleClipFromTimeline,
    refreshClipText,
    wordIdAtCurrentSeek,
  } = useVideoEditorStore()
  const anyWordsHidden: boolean = clip.words.some((word) => word.hidden)
  const anyWordsHighlighted: boolean = highlightedWords
    ? highlightedWords.clipId === clip.id
    : false
  let startHighlightTime: number | null = null
  let endHighlightTime: number | null = null
  if (anyWordsHighlighted && highlightedWords) {
    const startIndex = clip.words.findIndex(
      (word) => word.id === highlightedWords.startId
    )
    const endIndex = clip.words.findIndex(
      (word) => word.id === highlightedWords.endId
    )
    startHighlightTime = clip.words[startIndex].start
    endHighlightTime = clip.words[endIndex].end
  }
  const handleWordSelection = (e: React.MouseEvent, index: number) => {
    const word = clip.words[index]
    if (e.buttons === 1) {
      setHighlightedWords(clip.id, word.id)
    }
  }
  const setWordColor = (word: Word, clip: Clip): string | undefined => {
    return `cursor-pointer ${
      wordIdAtCurrentSeek === word.id ? 'bg-green-200' : ''
    } ${
      highlightedWords &&
      highlightedWords.clipId === clip.id &&
      ((startHighlightTime && word.start >= startHighlightTime) ||
        (endHighlightTime && word.end <= endHighlightTime))
        ? 'bg-yellow-200'
        : ''
    }`
  }
  return (
    <ContextMenu key={clip.id}>
      <ContextMenuTrigger>
        <div className="mb-4">
          <h3 className="mb-2 text-lg font-semibold">{clip.title}</h3>
          <p>
            {clip.words
              .filter((word) => !word.hidden)
              .map((word, index) => (
                <span
                  key={index}
                  className={setWordColor(word, clip)}
                  onMouseDown={(e) => handleWordSelection(e, index)}
                  onMouseEnter={(e) => {
                    if (e.buttons === 1) {
                      handleWordSelection(e, index)
                    }
                  }}
                >
                  {word.text}{' '}
                </span>
              ))}
          </p>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        {anyWordsHidden && (
          <ContextMenuItem onClick={() => refreshClipText(clip.id)}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Text
          </ContextMenuItem>
        )}
        {anyWordsHighlighted && (
          <ContextMenuItem onClick={() => trimFromHighlightedWords(clip.id)}>
            <Scissors className="w-4 h-4 mr-2" />
            Trim
          </ContextMenuItem>
        )}
        <ContextMenuItem onClick={() => toggleClipFromTimeline(clip.id)}>
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Clip
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
const TextEditor = () => {
  const {
    videoTitle,
    setPreview,
    highlightedWords,
    enableDropZones,
    clipsInTimeline,
    clipsWithPreview,
  } = useVideoEditorStore()
  const [activeTab, setActiveTab] = useState(videoTitle)

  return (
    <div className="flex flex-col flex-1 p-4 overflow-hidden bg-white">
      {enableDropZones && (
        <DropZone
          defaultText="Drop here to preview"
          swapySlot="preview-drop-zone"
        />
      )}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsList className="p-1 mb-4 bg-gray-100 rounded-lg">
          <TabsTrigger
            value={videoTitle}
            className="data-[state=active]:bg-white"
          >
            {videoTitle}
          </TabsTrigger>
          {clipsWithPreview.map((clip) => (
            <TabsTrigger
              key={clip.id}
              value={`clip-${clip.id}`}
              className="data-[state=active]:bg-white"
            >
              {clip.title}
              <Button
                size="icon"
                variant="ghost"
                className="w-5 h-5 ml-2 hover:bg-gray-200"
                onClick={() => setPreview(clip.id)}
              >
                <X className="w-3 h-3" />
                <span className="sr-only">Close tab</span>
              </Button>
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent
          value={videoTitle}
          className="flex-1 p-6 overflow-auto bg-white border border-gray-200 rounded-lg shadow-sm"
        >
          {clipsInTimeline.length === 0 ? (
            <div className="text-gray-500 text-start">
              <h2 className="mb-4 text-2xl font-bold">
                Welcome to the Video Editor
              </h2>
              <p className="mb-2">To get started:</p>
              <ol className="mb-4 list-decimal list-inside">
                <li>Search for clips using the search bar on the left</li>
                <li>Click on a clip to preview it in a new tab</li>
                <li>Drag clips from the left sidebar to the timeline below</li>
                <li>
                  Use the context menu (right-click) to trim or delete clips
                </li>
                <li>Adjust the timeline using the playback controls</li>
              </ol>
              <p>Happy editing!</p>
            </div>
          ) : (
            <>
              <h2 className="mb-4 text-2xl font-bold">{videoTitle}</h2>
              {clipsInTimeline.map((clip) => (
                <ClipContextMenu
                  key={clip.id}
                  clip={clip}
                  highlightedWords={highlightedWords}
                />
              ))}
            </>
          )}
        </TabsContent>
        {clipsWithPreview.map((clip) => (
          <TabsContent
            key={clip.id}
            value={`clip-${clip.id}`}
            className="flex-1 p-6 overflow-auto bg-white border border-gray-200 rounded-lg shadow-sm"
          >
            <h2 className="mb-4 text-2xl font-bold">{clip.title}</h2>
            <ClipContextMenu
              key={clip.id}
              clip={clip}
              highlightedWords={highlightedWords}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

const Timeline = () => {
  const [displayInlineContact, setDisplayInlineContact] = useState(false)
  const {
    clipsInTimeline,
    currentTimelineDuration,
    currentSeek,
    setCurrentSeek,
  } = useVideoEditorStore()
  const timelineRef = useRef<HTMLDivElement>(null)
  const getClipColor = (speaker: string) => {
    const colors = [
      'bg-gray-300',
      'bg-gray-400',
      'bg-gray-500',
      'bg-gray-600',
      'bg-gray-700',
      'bg-gray-800',
      'bg-gray-900',
    ]
    return colors[speaker.length % colors.length]
  }
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return
    const rect = timelineRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const newTime = (x / rect.width) * currentTimelineDuration
    setCurrentSeek(newTime)
  }

  const handleSkipForward = () => {
    let newTime = currentSeek
    for (const clip of clipsInTimeline) {
      const clipEnd = clip.words[clip.words.length - 1]?.end || 0
      if (clipEnd > currentSeek) {
        newTime = clipEnd
        break
      }
    }
    setCurrentSeek(newTime)
  }

  const handleSkipBackward = () => {
    let newTime = 0
    for (let i = clipsInTimeline.length - 1; i >= 0; i--) {
      const clipStart =
        i > 0
          ? clipsInTimeline[i - 1].words[
              clipsInTimeline[i - 1].words.length - 1
            ]?.end || 0
          : 0
      if (clipStart < currentSeek) {
        newTime = clipStart
        break
      }
    }
    setCurrentSeek(newTime)
  }

  return (
    <div className="p-4 bg-white border-t border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Button
            size="icon"
            variant="outline"
            className="w-8 h-8 bg-white hover:bg-gray-100"
            onClick={handleSkipBackward}
          >
            <SkipBack className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="w-10 h-10 bg-white hover:bg-gray-100"
            // onClick={() => setIsPlaying(!isPlaying)}
          >
            {/* {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5" />
            )} */}
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="w-8 h-8 bg-white hover:bg-gray-100"
            onClick={handleSkipForward}
          >
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            className={`flex items-center space-x-2 ${displayInlineContact ? 'bg-blue-50 border-blue-500' : ''}`}
            onClick={() => setDisplayInlineContact(!displayInlineContact)}
          >
            <div
              className={`w-4 h-4 border rounded flex items-center justify-center ${displayInlineContact ? 'bg-blue-500 border-blue-500' : 'border-gray-400'}`}
            >
              {displayInlineContact && <Check className="w-3 h-3 text-white" />}
            </div>
            <span>Inline Contact Info</span>
          </Button>
          <Button className="text-white bg-blue-500 hover:bg-blue-600">
            <Save className="w-4 h-4 mr-2" /> Save
          </Button>
        </div>
      </div>
      <div className="relative mx-4" style={{ height: '120px' }}>
        {clipsInTimeline.length === 0 ? (
          <DropZone
            defaultText="Drag and drop clips here to create your video timeline"
            swapySlot="timeline-empty"
          />
        ) : (
          <>
            {/* Time markers */}
            <div
              className="relative flex justify-between mb-1"
              style={{ height: '20px' }}
            >
              <div
                className="absolute text-xs text-gray-500"
                style={{ left: '0%', transform: 'translateX(-50%)' }}
              >
                {formatTime(0)}
              </div>
              {Array.from({ length: 3 }, (_, i) => (
                <div
                  key={i}
                  className="absolute text-xs text-gray-500"
                  style={{
                    left: `${((i + 1) / 4) * 100}%`,
                    transform: 'translateX(-50%)',
                  }}
                >
                  {formatTime(((i + 1) / 4) * currentTimelineDuration)}
                </div>
              ))}
              <div
                className="absolute text-xs text-gray-500"
                style={{ right: '0%', transform: 'translateX(50%)' }}
              >
                {formatTime(currentTimelineDuration)}
              </div>
            </div>

            {/* Ticks */}
            <div
              className="relative flex justify-between mb-1"
              style={{ height: '10px' }}
            >
              {Array.from(
                { length: Math.ceil(currentTimelineDuration) + 1 },
                (_, i) => (
                  <div
                    key={i}
                    className="absolute bg-gray-300"
                    style={{
                      left: `${(i / currentTimelineDuration) * 100}%`,
                      height: '5px',
                      width: '1px',
                      bottom: '0',
                    }}
                  />
                )
              )}
            </div>

            {/* Timeline */}
            <div
              ref={timelineRef}
              className="relative h-16 bg-gray-100 rounded-lg cursor-pointer"
              onClick={handleTimelineClick}
            >
              {/* Clips */}
              {clipsInTimeline.map((clip, index) => {
                const clipStart = clipsInTimeline
                  .slice(0, index)
                  .reduce(
                    (total, c) =>
                      total + (c.words[c.words.length - 1]?.end || 0),
                    0
                  )
                const clipDuration = clip.words[clip.words.length - 1]?.end || 0
                return (
                  <span
                    data-swapy-slot={`clip-space-${clip.id}`}
                    key={`clip-space-${clip.id}`}
                  >
                    <ContextMenu key={clip.id} data-swapy-item={clip.id}>
                      <ContextMenuTrigger>
                        <div
                          className={`absolute h-full ${getClipColor(clip.speaker)} rounded-md flex flex-col justify-between p-1`}
                          style={{
                            left: `${(clipStart / currentTimelineDuration) * 100}%`,
                            width: `${(clipDuration / currentTimelineDuration) * 100}%`,
                            top: '2px',
                            bottom: '2px',
                          }}
                        >
                          <div className="text-xs font-semibold truncate">
                            {clip.title}
                          </div>
                          <div className="text-xs text-gray-600 truncate">
                            {clip.words
                              .filter((w) => !w.hidden)
                              .map((w) => w.text)
                              .join(' ')}
                          </div>
                          <div className="text-xs text-gray-500">
                            {clip.speaker}
                          </div>
                        </div>
                      </ContextMenuTrigger>
                      <ContextMenuContent>
                        <ContextMenuItem
                        // onClick={() => handleClipDelete(clip.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Clip
                        </ContextMenuItem>
                        <ContextMenuItem
                        // onClick={() => handleRefreshText(clip.id)}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Refresh Text
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  </span>
                )
              })}

              {/* Cursor */}
              <div
                className="absolute top-0 w-0.5 bg-green-500 h-full"
                style={{
                  left: `${(currentSeek / currentTimelineDuration) * 100}%`,
                }}
              />
            </div>

            {/* Current time flag */}
            <div
              className="absolute top-0 flex items-center justify-center py-1 mt-5 text-xs text-white bg-green-500 rounded"
              style={{
                left: `${(currentSeek / currentTimelineDuration) * 100}%`,
                transform: 'translateX(-50%)',
                width: '48px',
                height: '18px',
              }}
            >
              {formatTime(currentSeek)}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function VideoEditor() {
  const [searchBinWidth, setSearchBinWidth] = useState(25) // 25% of the screen width
  const { setMostRecentSwapEvent, swapyRef, setSwapyRef } = useVideoEditorStore()
  const handleSearchBinResize = (e: React.MouseEvent) => {
    const startX = e.clientX
    const startWidth = searchBinWidth

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startX
      const newWidth = Math.max(
        10,
        Math.min(50, startWidth + (delta / window.innerWidth) * 100)
      )
      setSearchBinWidth(newWidth)
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }
  useEffect(() => {
    const container = document.getElementById('swapy-container')
    if (container) {
      const swapy = createSwapy(container, {
        animation: 'dynamic', // or spring or none
        continuousMode: false, // doesn't work with empty drop zones?
        manualSwap: true,
      })
      setSwapyRef(swapy)
      swapy.enable(true)
      swapy.onSwap((event) => {
        setMostRecentSwapEvent(event)
      })
    }
    return () => {
      if (swapyRef) {
        swapyRef.destroy()
      }
    }
  }, [])

  return (
    <div
      className="flex flex-col max-w-screen-lg border-2 rounded-sm w-svw h-[800px]"
      id="swapy-container"
    >
      <div className="flex h-full">
        <SearchBin
          searchBinWidth={searchBinWidth}
          handleSearchBinResize={handleSearchBinResize}
        />
        <TextEditor />
      </div>
      <Timeline />
    </div>
  )
}
