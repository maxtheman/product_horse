import React, { useState, useEffect, useRef } from 'react'
import {
  Search,
  SkipForward,
  SkipBack,
  Save,
  X,
  Check,
  Scissors,
  Trash2,
  RefreshCw,
  GripVertical,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { cn } from '@/lib/utils'
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
      { text: 'Max', start: 0.8, end: 1.0, hidden: false, id: '4' },
      { text: 'and', start: 1.0, end: 1.2, hidden: false, id: '5' },
      { text: "I'm", start: 1.2, end: 1.4, hidden: false, id: '6' },
      { text: 'testing', start: 1.4, end: 1.8, hidden: false, id: '7' },
      { text: 'this', start: 1.8, end: 2.0, hidden: false, id: '8' },
      { text: 'tool', start: 2.0, end: 2.3, hidden: false, id: '9' },
      { text: 'called', start: 2.3, end: 2.6, hidden: false, id: '10' },
      { text: 'ProductHorse.', start: 2.6, end: 3.0, hidden: false, id: '11' },
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

function mockQuery(query: string): Promise<Clip[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('mockQuery', query)
      resolve(exampleClips)
    }, 100)
  })
}

interface HighlightedWords {
  clipId: string
  startId: string | null
  endId: string | null
}

enum ZoneCurrent {
  SEARCH,
  PREVIEW,
  TIMELINE_NEW,
  TIMELINE_EXTEND,
  OTHER,
}

interface VideoEditorStore {
  mousePosition: { x0: number; y0: number; x1: number; y1: number }
  allSpeakers: { name: string; color: string; clipIds: string[] }[]
  saveSpeaker: (clipId: string, speaker: string) => void
  updateSpeakerName: (currentName: string, newName: string) => void
  getSpeakerColor: () => string
  setMousePosition: (position: {
    x0: number
    y0: number
    x1: number
    y1: number
  }) => void
  swapyRef: Swapy | null
  setSwapyRef: (ref: Swapy) => void
  currentTimelineDuration: number
  setCurrentTimelineDuration: (duration: number) => void
  currentSeek: number
  clipWithSeek: () => { clipId: string; wordIndex: string } | null
  setCurrentSeek: (seek: number) => void
  clips: Clip[]
  clipsInTimeline: () => Clip[]
  clipsWithPreview: () => Clip[]
  clipsInSearch: () => Clip[]
  currentSearch: string
  getNewClips: (search: string) => Promise<void>
  setCurrentSearch: (search: string) => void
  videoTitle: string
  setClips: (clips: Clip[]) => void
  error: string | null
  setError: (error: string) => void
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
  currentZone: ZoneCurrent
  setCurrentZone: (zone: ZoneCurrent) => void
}

const useVideoEditorStore = create<VideoEditorStore>((set, get) => ({
  mousePosition: { x0: 0, y0: 0, x1: 0, y1: 0 },
  allSpeakers: [],
  getSpeakerColor: (): string => {
    const colors = [
      'bg-blue-300',
      'bg-green-300',
      'bg-yellow-300',
      'bg-red-300',
      'bg-purple-300',
      'bg-orange-300',
      'bg-pink-300',
      'bg-gray-300',
    ]
    const randomColor = colors[Math.floor(Math.random() * colors.length)]
    return randomColor
  },
  updateSpeakerName: (currentName: string, newName: string) => {
    const { allSpeakers } = useVideoEditorStore.getState()
    const speakerToUpdate = allSpeakers.find(
      (speaker) => speaker.name === currentName
    )
    if (speakerToUpdate) {
      set(() => {
        return {
          allSpeakers: allSpeakers.map((speaker) =>
            speaker.name === currentName
              ? { ...speaker, name: newName }
              : speaker
          ),
        }
      })
    }
  },
  saveSpeaker: (clipId: string, speaker: string) => {
    const { allSpeakers, getSpeakerColor } = useVideoEditorStore.getState()
    set(() => {
      const existingSpeaker = allSpeakers.find((s) => s.name === speaker)
      if (existingSpeaker) {
        return {
          allSpeakers: allSpeakers.map((s) =>
            s.name === speaker ? { ...s, clipIds: [...s.clipIds, clipId] } : s
          ),
        }
      } else {
        const newColor = getSpeakerColor()
        return {
          allSpeakers: [
            ...allSpeakers,
            { name: speaker, color: newColor, clipIds: [clipId] },
          ],
        }
      }
    })
  },
  setMousePosition: (position: {
    x0: number
    y0: number
    x1: number
    y1: number
  }) => set({ mousePosition: position }),
  swapyRef: null,
  setSwapyRef: (ref: Swapy) => set({ swapyRef: ref }),
  currentTimelineDuration: 0,
  setCurrentTimelineDuration: (duration: number) =>
    set({ currentTimelineDuration: duration }),
  currentSeek: 0,
  clipWithSeek: (): { clipId: string; wordIndex: string } | null => {
    const { clipsInTimeline, currentSeek } = useVideoEditorStore.getState()
    for (const clip of clipsInTimeline()) {
      for (const word of clip.words) {
        if (currentSeek >= word.start && currentSeek < word.end) {
          return { clipId: clip.id, wordIndex: word.id }
        }
      }
    }
    return null
  },
  setCurrentSeek: (seek: number) => {
    const { clipsInTimeline } = useVideoEditorStore.getState()
    const getCurrentWord = () => {
      let accumulatedTime = 0
      for (const clip of clipsInTimeline()) {
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
  clips: [],
  clipsInTimeline: (): Clip[] => {
    const { clips } = useVideoEditorStore.getState()
    if (clips.length === 0) return []
    const clipsInTimeline = clips.filter((clip) => clip.inTimeline)
    return clipsInTimeline
  },
  clipsWithPreview: (): Clip[] => {
    const { clips } = useVideoEditorStore.getState()
    if (clips.length === 0) return []
    const clipsWithPreview = clips.filter((clip) => clip.preview)
    return clipsWithPreview
  },
  clipDragged: null,
  setClipDragged: (clipId: string | null) => set({ clipDragged: clipId }),
  clipIsDragging: false,
  setClipIsDragging: (isDragging: boolean) =>
    set({ clipIsDragging: isDragging }),
  enableDropZones: false,
  setEnableDropZones: (enable: boolean) => set({ enableDropZones: enable }),
  currentSearch: 'women_music',
  clipsInSearch: (): Clip[] => {
    const { clips } = useVideoEditorStore.getState()
    if (clips.length === 0) return []
    const clipsInSearch = clips.filter((clip) => clip.fromSearch)
    return clipsInSearch
  },
  getNewClips: async (search: string) => {
    try {
      const newClips = await mockQuery(search)
      const { clipsInTimeline, clipsWithPreview } = useVideoEditorStore.getState()
      const filteredClips = newClips.filter(
        (clip) =>
          !clipsInTimeline().some((c) => c.id === clip.id) &&
          !clipsWithPreview().some((c) => c.id === clip.id)
      )
      const allClipsDeDuped = [...clipsInTimeline(), ...clipsWithPreview(), ...filteredClips]
      set({ clips: allClipsDeDuped, currentSearch: search })
      console.log('clipsInSearch', get().clipsInSearch())
    } catch (error) {
      console.error('Error fetching new clips', error)
      set({ error: 'Error fetching new clips' })
    }
  },
  setCurrentSearch: (search: string) => {
    set({ currentSearch: search })
    get().getNewClips(search)    
  },
  error: null,
  setError: (error: string) => set({ error }),
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
    const { clips, currentSearch, setCurrentTimelineDuration, saveSpeaker } =
      useVideoEditorStore.getState()
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
      const speakers = updatedClips
        .filter((clip) => clip.inTimeline)
        .map((clip) => clip.speaker)
      const uniqueSpeakers = [...new Set(speakers)]
      for (const speaker of uniqueSpeakers) {
        saveSpeaker(clipId, speaker)
      }
      console.log('updatedClips', updatedClips)
      set({ clips: updatedClips })
      // remove the clip from searchbin
      const sumOfClipDurations = updatedClips
        .filter((clip) => clip.inTimeline)
        .reduce((sum, clip) => sum + clip.words[clip.words.length - 1].end, 0)
      setCurrentTimelineDuration(sumOfClipDurations)
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
      setMostRecentSwapEvent,
      currentZone,
      setPreview,
      setCurrentZone,
      swapyRef,
    } = useVideoEditorStore.getState()
    if (!useVideoEditorStore.getState().clipIsDragging) {
      const swapyData = event.data.array
      console.log('swapyData', swapyData)
      if (currentZone == ZoneCurrent.TIMELINE_EXTEND) {
        console.log('timeline extend')
        const clipId = useVideoEditorStore.getState().clipDragged
        const swapyDataToSet = swapyData.filter(
          (item) => item.slotId !== 'timeline-extend' || item.itemId !== null
        )
        swapyDataToSet.push(
          { slotId: 'timeline-extend', itemId: null },
          { slotId: `timeline-${clipId}`, itemId: clipId }
        )
        if (clipId) {
          toggleClipFromTimeline(clipId)
          setClipDragged(null)
          setClipIsDragging(false)
          swapyRef?.setData({ array: swapyDataToSet })
          setMostRecentSwapEvent({ data: { array: swapyDataToSet } })
          setCurrentZone(ZoneCurrent.OTHER)
        }
      }
      if (currentZone == ZoneCurrent.PREVIEW) {
        console.log('preview')
        const clipId = useVideoEditorStore.getState().clipDragged
        if (clipId) {
          setPreview(clipId)
          const swapyDataToSet = swapyData.filter(
            (item) => item.slotId !== 'preview' || item.itemId !== null
          )
          const itemToRemove = swapyDataToSet.find(
            (item) => item.itemId === clipId
          )
          if (itemToRemove) {
            swapyDataToSet.splice(swapyDataToSet.indexOf(itemToRemove), 1)
          }
          swapyDataToSet.push({ slotId: 'preview', itemId: null })
          swapyRef?.setData({ array: swapyDataToSet })
          setMostRecentSwapEvent({ data: { array: swapyDataToSet } })
          setCurrentZone(ZoneCurrent.OTHER)
        }
      }
      if (currentZone == ZoneCurrent.TIMELINE_NEW) {
        console.log('timeline new')
        const clipId = useVideoEditorStore.getState().clipDragged
        if (clipId) {
          console.log('clipId', clipId)
          const swapyDataToSet = swapyData.filter(
            (item) => item.slotId !== 'timeline-new'
          )
          swapyData.filter(
            (item) => item.itemId !== null
          )
          swapyDataToSet.push(
            { slotId: 'timeline-new', itemId: null },
            { slotId: `timeline-${clipId}`, itemId: clipId }
          )
          toggleClipFromTimeline(clipId)
          setClipDragged(null)
          setClipIsDragging(false)
          console.log('swapyDataToSet', swapyDataToSet)
          swapyRef?.setData({ array: swapyDataToSet })
          setMostRecentSwapEvent({ data: { array: swapyDataToSet } })
          setCurrentZone(ZoneCurrent.OTHER)
        } else {
          console.log('swapyData, clipId not found', clipId, swapyData)
        }
        setEnableDropZones(false)
      }
    }
  },
  currentZone: ZoneCurrent.OTHER,
  setCurrentZone: (zone: ZoneCurrent) => set({ currentZone: zone }),
}))

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

const DropZone = ({
  defaultText,
  swapySlot,
  zone,
}: {
  defaultText: string
  swapySlot: string
  zone: ZoneCurrent
}) => {
  const { setCurrentZone, mousePosition } = useVideoEditorStore()
  const [mouseIsInside, setMouseIsInside] = useState(false)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const dropZone = dropZoneRef.current
    if (!dropZone) return

    const rect = dropZone.getBoundingClientRect()
    const isMouseInside =
      mousePosition.x0 <= rect.right &&
      mousePosition.x1 >= rect.left &&
      mousePosition.y0 <= rect.bottom &&
      mousePosition.y1 >= rect.top

    setMouseIsInside(isMouseInside)

    if (isMouseInside) {
      setCurrentZone(zone)
    } else if (zone === useVideoEditorStore.getState().currentZone) {
      setTimeout(() => {
        setCurrentZone(ZoneCurrent.OTHER)
      }, 100)
    }
  }, [mousePosition, zone, setCurrentZone, setMouseIsInside])

  return (
    <div
      ref={dropZoneRef}
      className={cn(
        'flex items-center font-bold capitalize justify-center h-full min-h-20 p-2 text-center text-gray-500 bg-gray-100 border-2 border-gray-400 border-dashed rounded-lg select-none',
        mouseIsInside && 'bg-yellow-100'
      )}
      data-swapy-slot={swapySlot}
    >
      {defaultText}
    </div>
  )
}
const SearchBin = () => {
  const {
    clipsInSearch,
    setEnableDropZones,
    setClipDragged,
    setClipIsDragging,
    clipIsDragging,
    setCurrentSearch,
    handleSwap,
    setMousePosition,
  } = useVideoEditorStore()
  const [draggedItem, setDraggedItem] = useState<HTMLElement | null>(null)
  const dragListener = (e: React.DragEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    const swapyItem = target
      .closest('[data-swapy-item]')
      ?.getAttribute('data-swapy-item')
    if (swapyItem) {
      setClipDragged(swapyItem)
    }
    setDraggedItem(target)
    setClipIsDragging(true)
    setEnableDropZones(true)
  }
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    const swapyItem = target
      .closest('[data-swapy-item]')
      ?.getAttribute('data-swapy-item')
    if (
      clipIsDragging &&
      useVideoEditorStore.getState().clipDragged == swapyItem
    ) {
      setClipIsDragging(false)
      const mostRecentSwapEvent =
        useVideoEditorStore.getState().mostRecentSwapEvent
      if (mostRecentSwapEvent) {
        handleSwap(mostRecentSwapEvent)
      }
      setDraggedItem(null)
      setEnableDropZones(false)
    }
  }
  useEffect(() => {
    if (clipIsDragging && draggedItem) {
      const handleMouseMove = () => {
        const rect = draggedItem?.getBoundingClientRect()
        if (rect) {
          setMousePosition({
            x0: rect.left,
            y0: rect.top,
            x1: rect.right,
            y1: rect.bottom,
          })
        }
      }
      window.addEventListener('mousemove', handleMouseMove)

      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
      }
    }
  }, [draggedItem])
  const clipResultList = clipsInSearch().map((clip, index) => (
    <span
      key={`search-spot-${index}`}
      data-swapy-slot={`search-spot-${index}`}
      onMouseDown={dragListener}
      onMouseUp={handleDrop}
      className="flex cursor-move select-none"
    >
      <div
        key={clip.id}
        data-swapy-item={clip.id}
        className="w-full p-4 border border-gray-200 rounded-lg shadow-sm bg-gray-50 max-h-40 text-ellipsis"
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
    <div className="h-full p-4 bg-white border-r border-gray-200">
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
      <div className="space-y-2">{clipResultList}</div>
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
    <div className="flex flex-col flex-1 h-full p-4 bg-white">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        {enableDropZones ? (
          <div className="flex items-center justify-center ">
            <div className="w-full mb-4 h-2/3">
              <DropZone
                defaultText="Drop clip here to preview"
                swapySlot="preview"
                zone={ZoneCurrent.PREVIEW}
              />
            </div>
          </div>
        ) : (
          <TabsList className="p-1 mb-4 bg-gray-100 rounded-lg">
            <TabsTrigger
              value={videoTitle}
              className="data-[state=active]:bg-white"
            >
              {videoTitle}
            </TabsTrigger>
            {clipsWithPreview().map((clip) => (
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
        )}
        <div className="flex-1 p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
          <TabsContent value={videoTitle}>
            {clipsInTimeline().length === 0 ? (
              <div className="text-gray-500 text-start">
                <h2 className="mb-4 text-2xl font-bold">
                  Welcome to the Video Editor
                </h2>
                <p className="mb-2">To get started:</p>
                <ol className="mb-4 list-decimal list-inside">
                  <li>Search for clips using the search bar on the left</li>
                  <li>Click on a clip to preview it in a new tab</li>
                  <li>
                    Drag clips from the left sidebar to the timeline below
                  </li>
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
                {clipsInTimeline().map((clip) => (
                  <ClipContextMenu
                    key={clip.id}
                    clip={clip}
                    highlightedWords={highlightedWords}
                  />
                ))}
              </>
            )}
          </TabsContent>
          {clipsWithPreview().map((clip) => (
            <TabsContent key={clip.id} value={`clip-${clip.id}`}>
              <h2 className="mb-4 text-2xl font-bold">{clip.title}</h2>
              <ClipContextMenu
                key={clip.id}
                clip={clip}
                highlightedWords={highlightedWords}
              />
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  )
}

const TimelineClip = ({
  clip,
  index,
  currentTimelineDuration,
}: {
  clip: Clip
  index: number
  currentTimelineDuration: number
}) => {
  const { setCurrentSeek, allSpeakers, clipsInTimeline } = useVideoEditorStore()
  const [speakerColor, setSpeakerColor] = useState('')
  const clipDuration = clip.words[clip.words.length - 1]?.end || 0
  const [clipWidth, setClipWidth] = useState(
    (clipDuration / currentTimelineDuration) * 100
  )
  const clipStart = clipsInTimeline()
    .slice(0, index)
    .reduce(
      (total: number, c: Clip) =>
        total + (c.words[c.words.length - 1]?.end || 0),
      0
    )
  const handleSeek = (e: React.MouseEvent) => {
    const clipElement = e.currentTarget as HTMLDivElement
    const relativeX = e.clientX - clipElement.getBoundingClientRect().left
    const percentageX = relativeX / clipElement.offsetWidth
    const timeInClip = percentageX * clipDuration

    const closestWord = clip.words.reduce((prev, curr) => {
      return Math.abs(curr.start - timeInClip) <
        Math.abs(prev.start - timeInClip)
        ? curr
        : prev
    })

    setCurrentSeek(clipStart + closestWord.start)
  }
  useEffect(() => {
    if (currentTimelineDuration > 0) {
      setClipWidth((clipDuration / currentTimelineDuration) * 100)
      console.log('clipWidth', clipWidth)
    }
  }, [clipDuration, currentTimelineDuration])

  useEffect(() => {
    for (const speaker of allSpeakers) {
      if (clip.speaker === speaker.name) {
        setSpeakerColor(speaker.color)
      }
    }
  }, [allSpeakers])

  return (
    <span
      className="relative flex flex-col justify-between flex-grow px-6 py-2 space-y-2 bg-gray-200 border border-gray-400 rounded-lg"
      style={{
        width: `${clipWidth}%`,
        height: 'calc(100% - 4px)', // Subtract 4px to give some space for rounded corners
        margin: '2px 0', // Add vertical margin
      }}
      data-swapy-slot={`timeline-${clip.id}`}
      key={`timeline-${clip.id}`}
      data-swapy-item={clip.id}
      onMouseUp={(e) => handleSeek(e)}
    >
      <div className="absolute top-0 right-0 p-1 cursor-move" data-swapy-handle>
        <GripVertical className="w-4 h-4 text-gray-500" />
      </div>
      <ContextMenu>
        <ContextMenuTrigger>
          <div data-swapy-text>
            <div
              className="text-xs font-semibold truncate select-none max-w-2/3 text-ellipsis"
              data-swapy-text
            >
              {clip.title}
            </div>
            <div
              className="text-xs text-gray-600 truncate select-none"
              data-swapy-text
            >
              {clip.words
                .filter((w) => !w.hidden)
                .map((w) => w.text)
                .join(' ')}
            </div>
            <Badge
              className={`text-xs select-none ${speakerColor} text-black ml-[-10px]`}
              data-swapy-text
            >
              {clip.speaker}
            </Badge>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent data-swapy-text>
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
}

const Timeline = () => {
  const [displayInlineContact, setDisplayInlineContact] = useState(false)
  const {
    clipsInTimeline,
    currentTimelineDuration,
    currentSeek,
    setCurrentSeek,
    enableDropZones,
    clipWithSeek,
  } = useVideoEditorStore()
  const timelineRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleSkipForward = () => {
      let newTime = currentSeek
      const clipsInTimelineNow = useVideoEditorStore.getState().clipsInTimeline()
      for (const clip of clipsInTimelineNow) {
        const clipEnd = clip.words[clip.words.length - 1]?.end || 0
        if (clipEnd > currentSeek) {
          newTime = clipEnd
          break
        }
        if (currentSeek === clipEnd) {
          const nextClipIndex = clipsInTimelineNow.indexOf(clip) + 1
          if (nextClipIndex < clipsInTimelineNow.length) {
            newTime = clipsInTimelineNow[nextClipIndex].words[0]?.start || 0
          }
        }
      }
      setCurrentSeek(newTime)
    }

    const handleSkipBackward = () => {
      let newTime = currentSeek
      const clipsInTimelineNow = useVideoEditorStore.getState().clipsInTimeline()

      for (let i = clipsInTimelineNow.length - 1; i >= 0; i--) {
        const clip = clipsInTimelineNow[i]
        const clipEnd = clip.words[clip.words.length - 1]?.end || 0

        if (clipEnd < currentSeek) {
          newTime = clipEnd
          break
        }

        if (currentSeek === clipEnd) {
          const previousClipIndex = i - 1
          if (previousClipIndex >= 0) {
            const previousClip = clipsInTimelineNow[previousClipIndex]
            newTime =
              previousClip.words[previousClip.words.length - 1]?.end || 0
          }
          break
        }
      }

      setCurrentSeek(newTime)
    }
    const skipOneWordForward = () => {
      const currentClip = clipWithSeek()
      if (currentClip) {
        const currentClipData = clipsInTimeline().find(
          (clip) => clip.id === currentClip.clipId
        )
        if (!currentClipData) return
        const currentWordIndex = currentClipData.words.findIndex(
          (word) => word.start <= currentSeek && word.end > currentSeek
        )
        const lastWordIndex = currentClipData.words.length - 1
        if (currentWordIndex === lastWordIndex) {
          const nextClipIndex =
            clipsInTimeline().findIndex(
              (clip) => clip.id === currentClip.clipId
            ) + 1
          if (nextClipIndex < clipsInTimeline().length) {
            const nextClip = clipsInTimeline()[nextClipIndex]
            setCurrentSeek(nextClip.words[0]?.start || 0)
          }
        } else if (currentWordIndex < lastWordIndex) {
          const nextWordIndex = currentWordIndex + 1
          const nextWord = currentClipData.words[nextWordIndex]
          setCurrentSeek(nextWord.start)
        }
      }
    }

    const skipOneWordBackward = () => {
      const currentClip = clipWithSeek()
      if (currentClip) {
        const currentClipData = clipsInTimeline().find(
          (clip) => clip.id === currentClip.clipId
        )
        if (!currentClipData) return
        const currentWordIndex = currentClipData.words.findIndex(
          (word) => word.start <= currentSeek && word.end > currentSeek
        )
        if (currentWordIndex === 0) {
          const currentClipIndex = clipsInTimeline().findIndex(
            (clip) => clip.id === currentClip.clipId
          )
          if (currentClipIndex > 0) {
            const previousClip = clipsInTimeline()[currentClipIndex - 1]
            const lastWord = previousClip.words[previousClip.words.length - 1]
            setCurrentSeek(lastWord.start)
          }
        } else if (currentWordIndex > 0) {
          const previousWord = currentClipData.words[currentWordIndex - 1]
          setCurrentSeek(previousWord.start)
        }
      }
    }

    document
      .getElementById('skip-backward')
      ?.addEventListener('click', handleSkipBackward)
    document
      .getElementById('skip-forward')
      ?.addEventListener('click', handleSkipForward)
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        skipOneWordBackward()
      }
      if (event.key === 'ArrowRight') {
        skipOneWordForward()
      }
    }

    document.addEventListener('keydown', handleKeyPress)

    // Clean up the event listener when the component unmounts
    return () => {
      document.removeEventListener('keydown', handleKeyPress)
      document
        .getElementById('skip-backward')
        ?.removeEventListener('click', handleSkipBackward)
      document
        .getElementById('skip-forward')
        ?.removeEventListener('click', handleSkipForward)
    }

    // document.getElementById('play-pause')?.addEventListener('click', handlePlayPause)
  }, [clipsInTimeline, currentSeek, setCurrentSeek])

  return (
    <div className="w-full p-6 overflow-hidden bg-white border-t border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            size="icon"
            variant="outline"
            id="skip-backward"
            className="w-8 h-8 bg-white hover:bg-gray-100"
          >
            <SkipBack className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="w-10 h-10 bg-white hover:bg-gray-100"
            id="play-pause"
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
            id="skip-forward"
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
            <span>Display Contact Info in Video?</span>
          </Button>
          <Button className="text-white bg-blue-500 hover:bg-blue-600">
            <Save className="w-4 h-4 mr-2" /> Save
          </Button>
        </div>
      </div>
      <div className="h-32 p-6">
        {clipsInTimeline().length === 0 ? (
          <DropZone
            defaultText="Drag and drop clip to create timeline"
            swapySlot="timeline-new"
            zone={ZoneCurrent.TIMELINE_NEW}
          />
        ) : (
          <div className="relative">
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
              className="flex h-24 overflow-hidden bg-gray-100 rounded-lg cursor-pointer"
            >
              {/* Clips */}
              {clipsInTimeline().map((clip, index) => (
                <TimelineClip
                  key={clip.id}
                  clip={clip}
                  index={index}
                  currentTimelineDuration={currentTimelineDuration}
                />
              ))}
              {/* Cursor under flag */}
              <div
                className="absolute top-6 w-0.5 h-full bg-gradient-to-b from-green-500 to-transparent"
                style={{
                  left: `${(currentSeek / currentTimelineDuration) * 100}%`,
                }}
              />
              {enableDropZones && (
                <div className="w-48 ml-2">
                  <DropZone
                    defaultText="Add clip here"
                    swapySlot="timeline-extend"
                    zone={ZoneCurrent.TIMELINE_EXTEND}
                  />
                </div>
              )}
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
          </div>
        )}
      </div>
    </div>
  )
}

export default function VideoEditor() {
  const { setMostRecentSwapEvent, swapyRef, setSwapyRef } =
    useVideoEditorStore()
  useEffect(() => {
    const container = document.getElementById('swapy-container')
    if (container) {
      const swapy = createSwapy(container, {
        animation: 'none', // dynamicor spring or none
        continuousMode: false, // doesn't work with empty drop zones?
        manualSwap: true,
      })
      setSwapyRef(swapy)
      swapy.enable(true)
      swapy.onSwap((event) => {
        console.log('mostRecentSwapEvent', event)
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
      <div className="flex flex-grow h-2/3">
        <div className="z-10 w-1/3 isolate">
          <SearchBin />
        </div>
        <div className="z-0 w-2/3">
          <TextEditor />
        </div>
      </div>
      <div className="flex flex-grow w-full h-1/3">
        <Timeline />
      </div>
    </div>
  )
}
