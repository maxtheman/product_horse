import React, {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useCallback,
  useMemo,
} from 'react'
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
  Play,
  Pause,
  Loader2,
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
import { createPortal } from 'react-dom'

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
    id: '1asdf',
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
    id: '2asdf',
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
    id: '3asdf',
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
  {
    id: '4asdf',
    title: 'new_music',
    speaker: 'Speaker C',
    words: [
      { text: 'Welcome', start: 0, end: 0.6, hidden: false, id: '27' },
      { text: 'to', start: 0.6, end: 0.8, hidden: false, id: '28' },
      { text: 'the', start: 0.8, end: 1.0, hidden: false, id: '29' },
      { text: 'future', start: 1.0, end: 1.5, hidden: false, id: '30' },
      { text: 'of', start: 1.5, end: 1.7, hidden: false, id: '31' },
      { text: 'technology.', start: 1.7, end: 2.2, hidden: false, id: '32' },
    ],
    inTimeline: false,
    preview: false,
    fromSearch: 'women_music',
  },
  {
    id: '5asdf',
    title: 'adventure_story',
    speaker: 'Speaker D',
    words: [
      { text: 'Once', start: 0, end: 0.5, hidden: false, id: '33' },
      { text: 'upon', start: 0.5, end: 0.8, hidden: false, id: '34' },
      { text: 'a', start: 0.8, end: 0.9, hidden: false, id: '35' },
      { text: 'time,', start: 0.9, end: 1.2, hidden: false, id: '36' },
      { text: 'in', start: 1.2, end: 1.3, hidden: false, id: '37' },
      { text: 'a', start: 1.3, end: 1.4, hidden: false, id: '38' },
      { text: 'land', start: 1.4, end: 1.6, hidden: false, id: '39' },
      { text: 'far', start: 1.6, end: 1.8, hidden: false, id: '40' },
      { text: 'away,', start: 1.8, end: 2.1, hidden: false, id: '41' },
      { text: 'there', start: 2.1, end: 2.3, hidden: false, id: '42' },
      { text: 'lived', start: 2.3, end: 2.5, hidden: false, id: '43' },
      { text: 'a', start: 2.5, end: 2.6, hidden: false, id: '44' },
      { text: 'brave', start: 2.6, end: 2.8, hidden: false, id: '45' },
      { text: 'knight.', start: 2.8, end: 3.2, hidden: false, id: '46' },
    ],
    inTimeline: false,
    preview: false,
    fromSearch: 'women_music',
  },
]

function mockQuery(search: string): Promise<Clip[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
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
  TIMELINE_CURRENT,
  OTHER,
}

interface VideoEditorStore {
  activeTab: string
  setActiveTab: (tab: string) => void
  isPlaying: boolean
  setIsPlaying: (isPlaying: boolean) => void
  draggedClipPosition: { x0: number; y0: number; x1: number; y1: number }
  allSpeakers: { name: string; color: string; clipIds: string[] }[]
  saveSpeaker: (clipId: string, speaker: string) => void
  updateSpeakerName: (currentName: string, newName: string) => void
  getSpeakerColor: () => string
  setDraggedClipPosition: (position: {
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
  setVideoTitle: (title: string) => void
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
  updateSwapySlotList: (slotId: string, itemId: string | null) => void
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
  lastHighlightedDropZone: string | null
  setLastHighlightedDropZone: (dropZone: string | null) => void
  setMostRecentSwapEvent: (event: {
    data: { array: { slotId: string; itemId: string | null }[] }
  }) => void
  currentZone: ZoneCurrent
  setCurrentZone: (zone: ZoneCurrent) => void
  timelineClipIds: string[]
  setTimelineClipIds: (clipIds: string[]) => void
  lastTimelineClipHighlighted: string | null
  setLastTimelineClipHighlighted: (clipId: string | null) => void
  resetClipStyles: boolean
}

const useVideoEditorStore = create<VideoEditorStore>((set, get) => ({
  lastTimelineClipHighlighted: null,
  setLastTimelineClipHighlighted: (clipId: string | null) =>
    set({ lastTimelineClipHighlighted: clipId }),
  lastHighlightedDropZone: null,
  setLastHighlightedDropZone: (dropZone: string | null) =>
    set({ lastHighlightedDropZone: dropZone }),
  activeTab: 'video',
  setActiveTab: (tab: string) => set({ activeTab: tab }),
  isPlaying: false,
  setIsPlaying: (isPlaying: boolean) => set({ isPlaying: isPlaying }),
  draggedClipPosition: { x0: 0, y0: 0, x1: 0, y1: 0 },
  allSpeakers: [],
  resetClipStyles: false,
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
  setDraggedClipPosition: (position: {
    x0: number
    y0: number
    x1: number
    y1: number
  }) => set({ draggedClipPosition: position }),
  swapyRef: null,
  setSwapyRef: (ref: Swapy) => set({ swapyRef: ref }),
  currentTimelineDuration: 0,
  setCurrentTimelineDuration: (duration: number) =>
    set({ currentTimelineDuration: duration }),
  currentSeek: 0,
  clipWithSeek: (): { clipId: string; wordIndex: string } | null => {
    const { currentSeek, clipsInTimeline } = get()
    const currentClips = clipsInTimeline()
    for (const clip of currentClips) {
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
    const { clips, timelineClipIds } = useVideoEditorStore.getState()
    const newTimeline = timelineClipIds
      .map((clipId) => clips.find((clip) => clip.id === clipId))
      .filter((clip): clip is Clip => clip !== undefined)
    return newTimeline
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
    const { clips, currentSearch, clipsInTimeline, clipsWithPreview } = get()
    if (clips.length === 0) return []
    const clipsInSearch = clips
      .filter((clip) => clip.fromSearch === currentSearch)
      .filter(
        (clip) =>
          !clipsInTimeline().some((c) => c.id === clip.id) &&
          !clipsWithPreview().some((c) => c.id === clip.id)
      )
    return clipsInSearch
  },
  getNewClips: async (search: string) => {
    try {
      const newClips = await mockQuery(search)
      const { clipsInTimeline, clipsWithPreview } =
        useVideoEditorStore.getState()
      const filteredClips = newClips.filter(
        (clip) =>
          !clipsInTimeline().some((c) => c.id === clip.id) &&
          !clipsWithPreview().some((c) => c.id === clip.id)
      )
      const allClipsDeDuped = [
        ...clipsInTimeline(),
        ...clipsWithPreview(),
        ...filteredClips,
      ]
      set({ clips: allClipsDeDuped, currentSearch: search })
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
  setVideoTitle: (title: string) => set({ videoTitle: title }),
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
    if (startIndex === -1 || endIndex === -1) return
    // Ensure correct order of indices
    const [fromIndex, toIndex] =
      startIndex < endIndex ? [startIndex, endIndex] : [endIndex, startIndex]
    const wordsToHide = clipWords.slice(fromIndex, toIndex + 1) // Include endIndex word
    const updatedClip = {
      ...clipToTrim,
      words: clipToTrim.words.map((word) => ({
        ...word,
        hidden: wordsToHide.some((wordToHide) => wordToHide.id === word.id),
      })),
    }
    // Update the clip in the clips array
    set({
      clips: clips.map((clip) => (clip.id === clipId ? updatedClip : clip)),
    })
    set({ highlightedWords: null })
  },
  toggleClipFromTimeline: (clipId: string) => {
    const {
      clips,
      timelineClipIds,
      setTimelineClipIds,
      setCurrentTimelineDuration,
      saveSpeaker,
    } = useVideoEditorStore.getState()
    const clipToUpdate = clips.find((clip) => clip.id === clipId)
    if (!clipToUpdate) return
    const updatedClip = {
      ...clipToUpdate,
      inTimeline: !clipToUpdate.inTimeline,
      preview: false, // turn off preview if it is on
    }
    const updatedClips = clips.map((clip) =>
      clip.id === clipId ? updatedClip : clip
    )
    let newTimelineClipIds = [...timelineClipIds]
    if (updatedClip.inTimeline) {
      newTimelineClipIds.push(clipId)
    } else {
      newTimelineClipIds = newTimelineClipIds.filter((id) => id !== clipId)
    }
    set({ clips: updatedClips })
    setTimelineClipIds(newTimelineClipIds)
    // Update timeline duration
    const sumOfClipDurations = newTimelineClipIds
      .map((id) => {
        const clip = updatedClips.find((clip) => clip.id === id)
        return clip ? clip.words[clip.words.length - 1].end : 0
      })
      .reduce((sum, duration) => sum + duration, 0)
    setCurrentTimelineDuration(sumOfClipDurations)
    // Save speaker (existing functionality)
    const speakers = updatedClips
      .filter((clip) => clip.inTimeline)
      .map((clip) => clip.speaker)
    const uniqueSpeakers = [...new Set(speakers)]
    for (const speaker of uniqueSpeakers) {
      saveSpeaker(clipId, speaker)
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
    set({
      clips: clips.map((clip) => (clip.id === clipId ? updatedClip : clip)),
    })
  },
  setPreview: (clipId: string) => {
    // sets preview to true if it is false, and vice versa
    const { clips, setActiveTab } = useVideoEditorStore.getState()
    const clipToUpdate = clips.find((clip) => clip.id === clipId)
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
    // change tab in text editor
    setActiveTab(`clip-${clipId}`)
  },
  wordIdAtCurrentSeek: '',
  setWordIdAtCurrentSeek: (wordId: string) =>
    set({ wordIdAtCurrentSeek: wordId }),
  mostRecentSwapEvent: null,
  setMostRecentSwapEvent: (event: {
    data: { array: { slotId: string; itemId: string | null }[] }
  }) => set({ mostRecentSwapEvent: event }),
  updateSwapySlotList: (slotId: string, itemId: string | null) => {
    const { swapyRef, mostRecentSwapEvent, setMostRecentSwapEvent } =
      useVideoEditorStore.getState()
    const swapyDataToSet = mostRecentSwapEvent?.data.array || []
    const mergedArray = [...swapyDataToSet, { slotId: slotId, itemId: itemId }]
    setMostRecentSwapEvent({ data: { array: mergedArray } })
    if (swapyRef) {
      swapyRef.setData({ array: mergedArray })
    }
  },
  currentZone: ZoneCurrent.OTHER,
  setCurrentZone: (zone: ZoneCurrent) => set({ currentZone: zone }),
  timelineClipIds: [],
  setTimelineClipIds: (clipIds: string[]) => set({ timelineClipIds: clipIds }),
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
      setCurrentZone,
      setPreview,
      swapyRef,
      setDraggedClipPosition,
      setLastTimelineClipHighlighted,
      lastTimelineClipHighlighted,
      clipDragged,
      timelineClipIds,
      lastHighlightedDropZone,
      setLastHighlightedDropZone,
    } = useVideoEditorStore.getState()
    set({ resetClipStyles: true })

    const swapyData = event.data.array
    const clipId = useVideoEditorStore.getState().clipDragged

    if (!clipId) {
      setClipDragged(null)
      setClipIsDragging(false)
      return
    }
    const zoneForSwitch = currentZone
    const lastTimelineClipHighlightedId = lastTimelineClipHighlighted
    if (lastTimelineClipHighlightedId) {
      setLastTimelineClipHighlighted(null)
    }
    const lastHighlightedDropZoneId = lastHighlightedDropZone
    if (lastHighlightedDropZoneId) {
      setLastHighlightedDropZone(null)
    }
    setCurrentZone(ZoneCurrent.OTHER)
    setDraggedClipPosition({ x0: 0, y0: 0, x1: 0, y1: 0 })
    set({ resetClipStyles: false })

    switch (zoneForSwitch) {
      case ZoneCurrent.TIMELINE_EXTEND:
        const currentOrder = [...timelineClipIds]
        let newOrder: string[] = []
        if (
          lastHighlightedDropZoneId &&
          lastHighlightedDropZoneId.startsWith('timeline-extend-')
        ) {
          if (lastHighlightedDropZoneId === 'timeline-extend-start') {
            newOrder = [clipId, ...currentOrder]
          } else if (lastHighlightedDropZoneId === 'timeline-extend-end') {
            newOrder = [...currentOrder, clipId]
          } else {
            const extendIndex = parseInt(
              lastHighlightedDropZoneId.split('-').pop() || '0',
              10
            )
            newOrder = [
              ...currentOrder.slice(0, extendIndex),
              clipId,
              ...currentOrder.slice(extendIndex),
            ]
          }
        }

        const dataToMerge = newOrder.map((clipId, index) => {
          return {
            slotId: `timeline-${index}`,
            itemId: clipId || null,
          }
        })
        const swapyDataToSetExtend = swapyData.filter(
          (item) => !item.slotId.startsWith('timeline-')
        )
        swapyDataToSetExtend.push(...dataToMerge)

        toggleClipFromTimeline(clipId)
        setClipDragged(null)
        setClipIsDragging(false)
        swapyRef?.setData({ array: swapyDataToSetExtend })
        setMostRecentSwapEvent({ data: { array: swapyDataToSetExtend } })
        set({ timelineClipIds: newOrder })
        break

      case ZoneCurrent.PREVIEW:
        setPreview(clipId)
        const swapyDataToSetPreview = swapyData.filter(
          (item) => item.slotId !== 'preview' || item.itemId !== null
        )
        const itemToRemovePreview = swapyDataToSetPreview.find(
          (item) => item.itemId === clipId
        )
        if (itemToRemovePreview) {
          swapyDataToSetPreview.splice(
            swapyDataToSetPreview.indexOf(itemToRemovePreview),
            1
          )
        }
        swapyDataToSetPreview.push({ slotId: 'preview', itemId: null })
        swapyRef?.setData({ array: swapyDataToSetPreview })
        setMostRecentSwapEvent({ data: { array: swapyDataToSetPreview } })
        break

      case ZoneCurrent.TIMELINE_NEW:
        const swapyDataToSetNew = swapyData.filter(
          (item) => item.slotId !== 'timeline-new'
        )
        const itemToRemoveNew = swapyDataToSetNew.find(
          (item) => item.itemId === clipId
        )
        if (itemToRemoveNew) {
          swapyDataToSetNew.splice(
            swapyDataToSetNew.indexOf(itemToRemoveNew),
            1
          )
        }
        swapyDataToSetNew.push(
          { slotId: 'timeline-new', itemId: null },
          { slotId: `timeline-0`, itemId: clipId }
        )
        toggleClipFromTimeline(clipId)
        setClipDragged(null)
        setClipIsDragging(false)
        swapyRef?.setData({ array: swapyDataToSetNew })
        setMostRecentSwapEvent({ data: { array: swapyDataToSetNew } })
        setEnableDropZones(false)
        setDraggedClipPosition({ x0: 0, y0: 0, x1: 0, y1: 0 })
        break

      case ZoneCurrent.TIMELINE_CURRENT:
        console.log('timeline current')
        if (lastTimelineClipHighlightedId && clipDragged) {
          // Find the indices of the highlighted and dragged clips in timelineClipIds
          const highlightedIndex = timelineClipIds.indexOf(
            lastTimelineClipHighlightedId
          )
          const draggedIndex = timelineClipIds.indexOf(clipDragged)

          if (highlightedIndex === -1 || draggedIndex === -1) {
            console.warn(
              'Highlighted or dragged clip not found in timelineClipIds.'
            )
            break
          }

          // Swap the positions of the highlighted and dragged clips
          const updatedTimelineClipIds = [...timelineClipIds]
          ;[
            updatedTimelineClipIds[highlightedIndex],
            updatedTimelineClipIds[draggedIndex],
          ] = [
            updatedTimelineClipIds[draggedIndex],
            updatedTimelineClipIds[highlightedIndex],
          ]
          set({ timelineClipIds: updatedTimelineClipIds })
          break
        }
        const newTimelineClipIds = swapyData
          .filter(
            (item) =>
              item.slotId.startsWith('timeline-') &&
              item.itemId &&
              ![
                'timeline-extend-start',
                'timeline-extend-end',
                'timeline-new',
              ].includes(item.slotId)
          )
          .map((item) => item.itemId)
        if (!newTimelineClipIds.length) {
          break
        }
        const hasDuplicates = newTimelineClipIds.some(
          (id, index) => newTimelineClipIds.indexOf(id) !== index
        )
        if (hasDuplicates) {
          console.error(
            'Duplicate clip IDs detected in the timeline. Cancelling update.'
          )
          break
        }

        const nonNullTimelineClipIds = newTimelineClipIds.filter(
          (id) => id !== null
        )

        set({ timelineClipIds: nonNullTimelineClipIds })
        break

      default:
        console.warn(`Unhandled currentZone: ${currentZone}`)
    }

    // General cleanup
    setClipDragged(null)
    setClipIsDragging(false)
  },
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
  disabled = false,
}: {
  defaultText: string
  swapySlot: string
  zone: ZoneCurrent
  disabled: boolean
}) => {
  const {
    setCurrentZone,
    draggedClipPosition: mousePosition,
    lastHighlightedDropZone,
    setLastHighlightedDropZone,
  } = useVideoEditorStore()
  const [mouseIsInside, setMouseIsInside] = useState(false)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (disabled) return
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
      if (lastHighlightedDropZone !== swapySlot) {
        setLastHighlightedDropZone(swapySlot)
      }
      setCurrentZone(zone)
    }
    // [TODO: UNDERSTAND WHY THIS BREAKS THE DROP ZONE FUNCTIONALITY???]
    // This breaks the drop zone functionality???
    // if (!isMouseInside) {
    //   // timeout to allow for a little wiggle room if the mouse is just barely outside the drop zone
    //   setTimeout(() => {
    //     setCurrentZone(ZoneCurrent.OTHER)
    //   }, 200)
    // }
  }, [mousePosition, zone, setCurrentZone, setMouseIsInside, disabled])

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

const SearchResultItem = ({
  clip,
  index,
  dragListener,
  isInvisible = false,
}: {
  clip: Clip
  index: number
  dragListener: (e: React.MouseEvent<HTMLDivElement>) => void
  isInvisible?: boolean
}) => {
  const element = (
    <span
      key={`search-spot-${index}`}
      data-swapy-slot={`search-spot-${index}`}
      onMouseDown={dragListener}
      className={`flex cursor-move select-none ${isInvisible ? 'invisible' : ''}`}
    >
      <div
        key={clip.id}
        data-swapy-item={clip.id}
        className="w-full p-4 border border-gray-200 rounded-lg shadow-sm bg-gray-50 max-h-40 overflow-ellipsis"
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
  )
  return element
}

interface DraggedItem {
  clipId: string
  offsetX: number
  offsetY: number
  width: number
  height: number
}

const SearchBinDragLayer = ({
  draggedItem,
  position,
}: {
  draggedItem: DraggedItem | null
  position: { x: number; y: number }
}) => {
  const { clipsInSearch } = useVideoEditorStore()
  const clip = clipsInSearch().find((c) => c.id === draggedItem?.clipId)
  const { x, y } = position

  if (!draggedItem || !clip) return null

  const portal = createPortal(
    <div
      style={{
        position: 'fixed',
        top: y,
        left: x,
        pointerEvents: 'none',
        zIndex: 1000, // ensure it's above other elements
      }}
    >
      <div
        style={{
          width: draggedItem.width,
          height: draggedItem.height,
        }}
      >
        <SearchResultItem
          clip={clip}
          index={0}
          dragListener={() => {}}
          isInvisible={!draggedItem}
        />
      </div>
    </div>,
    document.body
  )
  return portal
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
    setDraggedClipPosition,
    setCurrentZone,
  } = useVideoEditorStore()
  const [draggedItem, setDraggedItem] = useState<DraggedItem | null>(null)
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  // Custom debounce function
  const debounce = useCallback((func: Function, wait: number) => {
    let timeout: NodeJS.Timeout | null = null
    return (...args: any[]) => {
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), wait)
    }
  }, [])

  const debouncedSetDraggedClipPosition = useMemo(
    () =>
      debounce(
        (position: { x0: number; y0: number; x1: number; y1: number }) => {
          setDraggedClipPosition(position)
        },
        5
      ),
    [debounce, setDraggedClipPosition]
  )

  useEffect(() => {
    if (draggedItem) {
      const handleMouseMove = (e: MouseEvent) => {
        const x = e.clientX - draggedItem.offsetX
        const y = e.clientY - draggedItem.offsetY

        setDragPosition({ x, y })
        debouncedSetDraggedClipPosition({
          x0: x,
          y0: y,
          x1: x + draggedItem.width,
          y1: y + draggedItem.height,
        })
      }

      const handleMouseUp = (e: MouseEvent) => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)

        if (clipIsDragging) {
          const mostRecentSwapEvent =
            useVideoEditorStore.getState().mostRecentSwapEvent
          if (mostRecentSwapEvent) {
            handleSwap(mostRecentSwapEvent)
          }
        }
        setDraggedItem(null)
        setClipIsDragging(false)
        setEnableDropZones(false)
        setClipDragged(null)
      }

      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)

      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [
    draggedItem,
    clipIsDragging,
    handleSwap,
    setClipIsDragging,
    setEnableDropZones,
    setClipDragged,
    debouncedSetDraggedClipPosition,
  ])

  const dragListener = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.currentTarget as HTMLElement
    const swapyItem = target
      .querySelector('[data-swapy-item]')
      ?.getAttribute('data-swapy-item')
    if (swapyItem) {
      const itemRect = target
        .querySelector('[data-swapy-item]')
        ?.getBoundingClientRect()
      if (itemRect) {
        setDragPosition({ x: itemRect.left, y: itemRect.top })
      }
      setDraggedClipPosition({ x0: 0, y0: 0, x1: 0, y1: 0 })
      setCurrentZone(ZoneCurrent.OTHER)
      setClipDragged(swapyItem)
    }
    const itemRect = target.getBoundingClientRect()
    const offsetX = e.clientX - itemRect.left
    const offsetY = e.clientY - itemRect.top
    if (swapyItem) {
      setDraggedItem({
        clipId: swapyItem,
        offsetX,
        offsetY,
        width: itemRect.width,
        height: itemRect.height,
      })
      setClipIsDragging(true)
      setEnableDropZones(true)
      setCurrentZone(ZoneCurrent.OTHER)
      setDraggedClipPosition({ x0: 0, y0: 0, x1: 0, y1: 0 })
    }
  }

  const clipResultList = clipsInSearch().map((clip, index) => (
    <SearchResultItem
      key={index}
      clip={clip}
      index={index}
      dragListener={dragListener}
      isInvisible={draggedItem?.clipId === clip.id}
    />
  ))

  return (
    <div
      ref={containerRef}
      className="h-full p-4 overflow-y-scroll bg-white border-r border-gray-200"
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
      <div className="space-y-2">
        {clipsInSearch().length === 0 ? (
          <p className="p-4 italic text-gray-500 select-none">
            No clips found.
          </p>
        ) : (
          clipResultList
        )}
      </div>
      <SearchBinDragLayer draggedItem={draggedItem} position={dragPosition} />
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
    // Ensure startIndex and endIndex are valid before accessing clip.words
    if (startIndex >= 0) {
      startHighlightTime = clip.words[startIndex].start
    }
    if (endIndex >= 0) {
      endHighlightTime = clip.words[endIndex].end
    }
  }

  const handleWordSelection = (e: React.MouseEvent, index: number) => {
    const word = clip.words[index]
    if (e.buttons === 1) {
      setHighlightedWords(clip.id, word.id)
    }
  }

  const setWordColor = (word: Word): string | undefined => {
    const isCurrentWord = wordIdAtCurrentSeek === word.id
    let isHighlighted = false
    if (startHighlightTime !== null && endHighlightTime !== null) {
      isHighlighted =
        word.start >= startHighlightTime && word.end <= endHighlightTime
    }
    return `cursor-pointer ${isCurrentWord ? 'bg-green-200' : ''} ${
      isHighlighted ? 'bg-yellow-200' : ''
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
                  className={setWordColor(word)}
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
    activeTab,
    setActiveTab,
    videoTitle,
    setPreview,
    highlightedWords,
    enableDropZones,
    clipsInTimeline,
    clipsWithPreview,
  } = useVideoEditorStore()

  useEffect(() => {
    setActiveTab(videoTitle)
  }, [videoTitle])

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
                disabled={!enableDropZones}
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
                  onClick={() => {
                    setPreview(clip.id)
                    if (activeTab === `clip-${clip.id}`) {
                      setActiveTab(videoTitle)
                    }
                  }}
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
              <div
                className={`text-gray-500 text-start ${enableDropZones ? 'opacity-25 pointer-events-none' : ''} ${activeTab === videoTitle ? 'visible' : 'invisible'}`}
              >
                <h2 className="mb-4 text-2xl font-bold">
                  Text-based video editor
                </h2>
                <p className="mb-2">To get started:</p>
                <ol className="mb-4 list-decimal list-inside">
                  <li>
                    <b>Search for clips</b> using the search bar on the left
                  </li>
                  <li>
                    <b>Preview clips</b> by dragging them to the tabs above
                  </li>
                  <li>
                    <b>Edit clips</b> and add them to the timeline below
                  </li>
                  <li>
                    <b>Right-click</b> to trim or delete clips
                  </li>
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

// TimelineClip component
interface TimelineClipProps {
  clip: Clip
  index: number
  currentTimelineDuration: number
}

const TimelineClip = ({
  clip,
  index,
  currentTimelineDuration,
}: TimelineClipProps) => {
  const {
    setCurrentSeek,
    allSpeakers,
    clipsInTimeline,
    setDraggedClipPosition,
    setCurrentZone,
    setClipDragged,
    setClipIsDragging,
    clipIsDragging,
    handleSwap,
    timelineClipIds,
    draggedClipPosition: mousePosition,
    enableDropZones,
    setLastTimelineClipHighlighted,
    resetClipStyles,
    lastTimelineClipHighlighted,
    setEnableDropZones,
    mostRecentSwapEvent,
  } = useVideoEditorStore()
  const [speakerColor, setSpeakerColor] = useState('')
  const clipDuration = clip.words[clip.words.length - 1]?.end || 0
  const [draggedItem, setDraggedItem] = useState<DraggedItem | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [mouseIsInside, setMouseIsInside] = useState(false)
  const [hasStartedMoving, setHasStartedMoving] = useState(false)
  const [initialClipPosition] = useState({ x: 0, y: 0 })
  const percentOfTimeline = useMemo(() => (currentTimelineDuration > 0 ? (clipDuration / currentTimelineDuration) * 100 : 0), [clipDuration, currentTimelineDuration])
  const clipRef = useRef<HTMLSpanElement>(null)

  const clipStart = clipsInTimeline()
    .slice(0, index)
    .reduce(
      (total: number, c: Clip) =>
        total + (c.words[c.words.length - 1]?.end || 0),
      0
    )

  // Custom debounce function
  const debounce = useCallback((func: Function, wait: number) => {
    let timeout: NodeJS.Timeout | null = null
    return (...args: any[]) => {
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), wait)
    }
  }, [])

  const debouncedSetDraggedClipPosition = useMemo(
    () =>
      debounce(
        (position: { x0: number; y0: number; x1: number; y1: number }) => {
          setDraggedClipPosition(position)
        },
        3
      ), // ~60fps
    [debounce, setDraggedClipPosition]
  )

  useEffect(() => {
    if (draggedItem) {
      const handleMouseMove = (e: MouseEvent) => {
        const timelineElement = clipRef.current?.closest(
          '.timeline-container'
        ) as HTMLElement
        if (!timelineElement) return

        const timelineRect = timelineElement.getBoundingClientRect()
        const scrollLeft = timelineElement.scrollLeft
        const x =
          e.clientX - draggedItem.offsetX - timelineRect.left + scrollLeft
        const y = e.clientY - draggedItem.offsetY

        const currentClipPosition = { x, y }
        const xDiff = Math.abs(currentClipPosition.x - initialClipPosition.x)
        const yDiff = Math.abs(currentClipPosition.y - initialClipPosition.y)
        const tolerance = 3

        if (
          (xDiff > tolerance || yDiff > tolerance) &&
          timelineClipIds.length > 1
        ) {
          setHasStartedMoving(true)
        }

        // Auto-scroll logic
        const scrollSpeed = 15
        const scrollThreshold = 50
        if (e.clientX < timelineRect.left + scrollThreshold) {
          timelineElement.scrollLeft -= scrollSpeed
        } else if (e.clientX > timelineRect.right - scrollThreshold) {
          timelineElement.scrollLeft += scrollSpeed
        }

        debouncedSetDraggedClipPosition({
          x0: x,
          y0: y,
          x1: x + draggedItem.width,
          y1: y + draggedItem.height,
        })
      }

      const handleMouseUp = () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
        setHasStartedMoving(false)

        if (clipIsDragging) {
          if (mostRecentSwapEvent) {
            handleSwap(mostRecentSwapEvent)
          }
        }
        setDraggedItem(null)
        setClipIsDragging(false)
        setEnableDropZones(false)
        setClipDragged(null)
        setIsDragging(false)
      }

      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)

      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [
    draggedItem,
    clipIsDragging,
    handleSwap,
    setClipIsDragging,
    setEnableDropZones,
    setClipDragged,
    debouncedSetDraggedClipPosition,
    timelineClipIds,
    initialClipPosition,
    mostRecentSwapEvent,
  ])

  const dragListener = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()
    const target = e.currentTarget as HTMLElement
    const swapyItem = target
      .closest('[data-swapy-item]')
      ?.getAttribute('data-swapy-item')
    const itemRect = target.getBoundingClientRect()
    const offsetX = e.clientX - itemRect.left
    const offsetY = e.clientY - itemRect.top
    if (swapyItem) {
      setDraggedClipPosition({ x0: 0, y0: 0, x1: 0, y1: 0 })
      setCurrentZone(ZoneCurrent.OTHER)
      setClipDragged(swapyItem)
      setDraggedItem({
        clipId: swapyItem,
        offsetX,
        offsetY,
        width: itemRect.width,
        height: itemRect.height,
      })
      setClipIsDragging(true)
      setIsDragging(true)
    }
  }

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
    for (const speaker of allSpeakers) {
      if (clip.speaker === speaker.name) {
        setSpeakerColor(speaker.color)
      }
    }
  }, [allSpeakers, clip.speaker])

  useEffect(() => {
    if (clipRef.current && !isDragging) {
      const currentClip = clipRef.current
      const rect = currentClip.getBoundingClientRect()
      const isMouseInside =
        mousePosition.x0 <= rect.right &&
        mousePosition.x1 >= rect.left &&
        mousePosition.y0 <= rect.bottom &&
        mousePosition.y1 >= rect.top

      setMouseIsInside(isMouseInside)

      if (!enableDropZones && clipIsDragging && isMouseInside && !isDragging) {
        setLastTimelineClipHighlighted(clip.id)
        setCurrentZone(ZoneCurrent.TIMELINE_CURRENT)
      } else {
        if (lastTimelineClipHighlighted === clip.id) {
          setLastTimelineClipHighlighted(null)
        }
        setMouseIsInside(false)
      }
    }
    if (
      mousePosition.x0 === 0 &&
      mousePosition.x1 === 0 &&
      mousePosition.y0 === 0 &&
      mousePosition.y1 === 0
    ) {
      setMouseIsInside(false)
    }
  }, [
    mousePosition,
    setCurrentZone,
    setMouseIsInside,
    isDragging,
    enableDropZones,
    clipIsDragging,
    lastTimelineClipHighlighted,
    clip.id,
    setLastTimelineClipHighlighted,
  ])

  useEffect(() => {
    if (resetClipStyles) {
      setMouseIsInside(false)
      setIsDragging(false)
      setHasStartedMoving(false)
    }
  }, [resetClipStyles])

  return (
    <span
      className={cn(`w-[${percentOfTimeline}%] p-0 m-0 h-1/2`)}
      data-swapy-slot={`timeline-${index}`}
      ref={clipRef}
    >
      <span
        className={cn(
          'relative flex flex-col justify-between px-6 py-2 space-y-0 bg-gray-200 border rounded-lg select-none h-1/2',
          mouseIsInside ? 'border-blue-500' : 'border-gray-400',
          isDragging && timelineClipIds.length > 1
            ? 'overflow-hidden justify-center h-1/4 mx-auto my-2'
            : '',
          hasStartedMoving ? 'w-fit' : ''
        )}
        style={{
          flexBasis: enableDropZones ? 'auto' : `${percentOfTimeline}%`,
          margin: '2px 0',
        }}
        onMouseDown={handleSeek}
        data-swapy-item={clip.id}
        id={`timeline-clip-${clip.id}`}
      >
        <div
          className="absolute top-0 right-0 p-1 cursor-move"
          data-swapy-handle
          onMouseDown={dragListener}
        >
          <GripVertical className="w-4 h-4 text-gray-500" />
        </div>
        <ContextMenu>
          <ContextMenuTrigger>
            <div data-swapy-text>
              <div
                className="flex flex-row items-center gap-5 pl-0 mb-3 ml-0 text-xs font-semibold truncate select-none max-w-2/3 overflow-ellipsis"
                data-swapy-text
              >
                {clip.title}
                {!isDragging && (
                <Badge
                  className={`text-xs select-none ${speakerColor} text-black`}
                >
                  {clip.speaker}
                </Badge>
              )}
              </div>

              {/* Words aligned with the clip */}
              <div className={cn(`relative h-4 mt-1`, isDragging ? 'hidden' : '')}>
                {clip.words.map((word) => (
                  <span
                    key={word.id}
                    className="absolute text-[8px] transform -translate-x-1/2 whitespace-nowrap"
                    style={{
                      left: `${((word.start - clip.words[0].start) / clipDuration) * 100}%`,
                      top: '0',
                      whiteSpace: 'nowrap',
                    }}
                    data-swapy-text
                  >
                    {word.text}
                  </span>
                ))}
              </div>
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent data-swapy-text>
            {/* toggleClipFromTimeline(clip.id) */}
            <ContextMenuItem onClick={() => {}}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Clip
            </ContextMenuItem>
            {/* refreshClipText(clip.id) */}
            <ContextMenuItem onClick={() => {}}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Text
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </span>
    </span>
  )
}

// Timeline component
interface TimelineProps {
  handleTimelineFocus: () => void
  handleSkipForward: () => void
  handleSkipBackward: () => void
  handlePlayPause: () => void
}

const Timeline = forwardRef<HTMLDivElement, TimelineProps>((props, ref) => {
  const {
    handleTimelineFocus,
    handleSkipForward,
    handleSkipBackward,
    handlePlayPause,
  } = props
  const [displayInlineContact, setDisplayInlineContact] = useState(false)
  const {
    clipsInTimeline,
    currentTimelineDuration,
    currentSeek,
    enableDropZones,
    isPlaying,
    clips,
    timelineClipIds,
    setCurrentSeek,
  } = useVideoEditorStore()
  const [clipsToRender, setClipsToRender] = useState<Clip[]>([])
  const [zoomLevel, setZoomLevel] = useState<number>(1) // Default zoom level

  useEffect(() => {
    setClipsToRender(clipsInTimeline())
  }, [clips, timelineClipIds])

  return (
    <div className="w-full p-6 bg-white border-t border-gray-200">
      <div
        className={`flex items-center justify-between ${
          clipsInTimeline().length === 0 ? 'opacity-25 pointer-events-none' : ''
        }`}
      >
        {/* Control buttons */}
        <div className="flex items-center space-x-2">
          <Button
            size="icon"
            variant="outline"
            id="skip-backward"
            className="w-8 h-8 bg-white hover:bg-gray-100"
            onClick={handleSkipBackward}
          >
            <SkipBack className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="w-10 h-10 bg-white hover:bg-gray-100"
            id="play-pause"
            onClick={handlePlayPause}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5" />
            )}
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="w-8 h-8 bg-white hover:bg-gray-100"
            id="skip-forward"
            onClick={handleSkipForward}
          >
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>
        {/* Other buttons */}
        <div className="flex items-center space-x-4">
          {/* Zoom Slider */}
          <div className="flex items-center space-x-2">
            <span>Zoom:</span>
            <input
              type="range"
              min="0.5"
              max="4"
              step="0.1"
              value={zoomLevel}
              onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
              className="w-24"
            />
          </div>
          <Button
            variant="outline"
            className={`flex items-center space-x-2 ${
              displayInlineContact ? 'bg-blue-50 border-blue-500' : ''
            }`}
            onClick={() => setDisplayInlineContact(!displayInlineContact)}
          >
            <div
              className={`w-4 h-4 border rounded flex items-center justify-center ${
                displayInlineContact
                  ? 'bg-blue-500 border-blue-500'
                  : 'border-gray-400'
              }`}
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
      {/* Timeline itself */}
      <div
        className="h-32 p-6 focus:outline-none group"
        tabIndex={0}
        ref={ref}
        onFocus={handleTimelineFocus}
      >
        {clipsToRender.length === 0 ? (
          <DropZone
            defaultText="Drag and drop clip to create timeline"
            swapySlot="timeline-new"
            zone={ZoneCurrent.TIMELINE_NEW}
            disabled={clipsToRender.length > 0}
          />
        ) : (
          <div className="relative w-full">
            {/* Timeline */}
            <div
              className="relative flex flex-grow overflow-x-scroll bg-gray-100 rounded-lg cursor-pointer h-36 flex-nowrap timeline-container"
            >
              {/* Dropzone at the start */}
              {enableDropZones && (
                <div className="flex-shrink-0 w-10 mt-auto h-1/2">
                  <DropZone
                    defaultText="+"
                    swapySlot="timeline-extend-start"
                    zone={ZoneCurrent.TIMELINE_EXTEND}
                    disabled={!enableDropZones}
                  />
                </div>
              )}
              {/* Ticks and time markers inside the scrollable area */}
              <div
                className="absolute top-0 left-0 flex items-center w-full h-6"
                style={{
                  transform: `scaleX(${zoomLevel})`,
                  transformOrigin: '0 0',
                }}
              >
                {Array.from(
                  { length: Math.ceil(currentTimelineDuration) + 1 },
                  (_, i) => (
                    <div
                      key={i}
                      style={{
                        position: 'absolute',
                        left: `${(i / currentTimelineDuration) * 100}%`,
                        transform: 'translateX(-50%)',
                      }}
                    >
                      <div className="w-px h-3 bg-gray-400" />
                      <div className="text-xs text-gray-500">
                        {formatTime(i)}
                      </div>
                    </div>
                  )
                )}
              </div>
              <div
                className="relative flex items-center w-full mt-auto h-1/2"
                style={{
                  transform: `scaleX(${zoomLevel})`,
                  transformOrigin: '0 0',
                }}
              >
                {clipsToRender.map((clip, index) => {
                  return [
                    <div className="flex-grow" key={`clip-${clip.id}`}>
                      <TimelineClip
                        clip={clip}
                        index={index}
                        currentTimelineDuration={currentTimelineDuration}
                      />
                    </div>,

                    enableDropZones && index < clipsToRender.length - 1 && (
                      <div
                        className="flex-shrink-0 w-10"
                        key={`dropzone-${index}`}
                      >
                        <DropZone
                          defaultText="+"
                          swapySlot={`timeline-extend-${index}`}
                          zone={ZoneCurrent.TIMELINE_EXTEND}
                          disabled={!enableDropZones}
                        />
                      </div>
                    ),
                  ].filter(Boolean) // Filter out false values
                })}
                {enableDropZones && (
                  <div className="w-10">
                    <DropZone
                      defaultText="+"
                      swapySlot="timeline-extend-end"
                      zone={ZoneCurrent.TIMELINE_EXTEND}
                      disabled={!enableDropZones}
                    />
                  </div>
                )}
              </div>
              {/* Cursor under flag */}
              <div
                className="absolute top-0 h-full w-0.5 bg-green-500 opacity-50"
                style={{
                  left: `${(currentSeek / currentTimelineDuration) * 100 * zoomLevel}%`,
                }}
              />
            </div>
            {/* Current time flag */}
            <div
              className="absolute top-0 flex items-center justify-center py-1 mt-5 text-xs text-white transition-opacity duration-200 bg-green-500 rounded opacity-50 group-focus-within:opacity-100"
              style={{
                left: `${(currentSeek / currentTimelineDuration) * 100 * zoomLevel}%`,
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
})
Timeline.displayName = 'Timeline'

const isInteractiveElement = (element: HTMLElement | null): boolean => {
  if (!element) return false
  const interactiveTags = ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON']
  if (interactiveTags.includes(element.tagName)) return true
  if (element.isContentEditable) return true
  return false
}

export default function VideoEditor() {
  const {
    setMostRecentSwapEvent,
    swapyRef,
    setSwapyRef,
    setCurrentSeek,
    currentSeek,
    clipsInTimeline,
    clipWithSeek,
    isPlaying,
    setIsPlaying,
    setVideoTitle,
    activeTab,
    setActiveTab,
    videoTitle,
  } = useVideoEditorStore()

  const timelineRef = useRef<HTMLDivElement>(null)

  const focusTimeline = () => {
    if (timelineRef.current) {
      timelineRef.current.focus()
    } else {
      console.warn('timelineRef.current is null')
    }
  }

  useEffect(() => {
    const container = document.getElementById('swapy-container')
    if (container) {
      const swapy = createSwapy(container, {
        // animation: 'dynamic',
        swapMode: 'hover',
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

  useEffect(() => {
    setVideoTitle('Example Video')
  }, [])

  const handleSkipForward = () => {
    let newTime = currentSeek
    const clips = clipsInTimeline()
    for (const clip of clips) {
      const clipEnd = clip.words[clip.words.length - 1]?.end || 0
      if (clipEnd > currentSeek) {
        newTime = clipEnd
        break
      }
      if (currentSeek === clipEnd) {
        const nextClipIndex = clips.indexOf(clip) + 1
        if (nextClipIndex < clips.length) {
          newTime = clips[nextClipIndex].words[0]?.start || 0
        }
      }
    }
    if (activeTab !== videoTitle) {
      setActiveTab(videoTitle)
    }
    setCurrentSeek(newTime)
    focusTimeline()
  }

  const handleSkipBackward = () => {
    let newTime = currentSeek
    const clips = clipsInTimeline()
    for (let i = clips.length - 1; i >= 0; i--) {
      const clip = clips[i]
      const clipEnd = clip.words[clip.words.length - 1]?.end || 0

      if (clipEnd < currentSeek) {
        newTime = clipEnd
        break
      }

      if (currentSeek === clipEnd) {
        const previousClipIndex = i - 1
        if (previousClipIndex >= 0) {
          const previousClip = clips[previousClipIndex]
          newTime = previousClip.words[previousClip.words.length - 1]?.end || 0
        }
        break
      }
    }
    if (activeTab !== videoTitle) {
      setActiveTab(videoTitle)
    }
    setCurrentSeek(newTime)
    focusTimeline()
  }

  const skipOneWordForward = () => {
    focusTimeline()
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

  const handlePlayPause = () => {
    focusTimeline()
    setIsPlaying(!isPlaying)
  }

  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      const activeElement = document.activeElement as HTMLElement
      if (isInteractiveElement(activeElement)) {
        return
      }
      if (activeTab !== videoTitle) {
        setActiveTab(videoTitle)
      }
      if (event.key === ' ') {
        event.preventDefault()
        setIsPlaying(!isPlaying)
        focusTimeline()
      }
      if (event.key === 'ArrowLeft') {
        skipOneWordBackward()
        focusTimeline()
      }
      if (event.key === 'ArrowRight') {
        skipOneWordForward()
        focusTimeline()
      }
    },
    [
      activeTab,
      videoTitle,
      isPlaying,
      setIsPlaying,
      skipOneWordBackward,
      skipOneWordForward,
      setActiveTab,
      focusTimeline,
    ]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress)
    return () => {
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [handleKeyPress])

  return (
    <div
      className="flex flex-col max-w-screen-lg border-2 rounded-sm w-svw h-[800px] overflow-hidden"
      id="swapy-container"
    >
      <div className="flex flex-grow h-2/3">
        <div className="z-10 w-1/3">
          <SearchBin />
        </div>
        <div className="z-0 w-2/3 overflow-y-scroll">
          <TextEditor />
        </div>
      </div>
      <div className="flex flex-grow w-full h-1/3">
        <Timeline
          ref={timelineRef}
          handleTimelineFocus={focusTimeline}
          handleSkipForward={handleSkipForward}
          handleSkipBackward={handleSkipBackward}
          handlePlayPause={handlePlayPause}
        />
      </div>
    </div>
  )
}
