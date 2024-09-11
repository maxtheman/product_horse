'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Search,
  Play,
  Pause,
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

interface Word {
  text: string
  start: number
  end: number
  hidden: boolean
}

interface Clip {
  id: number
  title: string
  speaker: string
  words: Word[]
}

function getClipColor(speaker: string) {
  const colors: Record<string, string> = {
    'Speaker A': 'bg-gray-300',
    'Speaker B': 'bg-gray-400',
  }
  return colors[speaker] || 'bg-gray-400'
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

interface SearchBinProps {
  searchClips: Clip[]
  searchBinWidth: number
  handleSearchBinResize: (e: React.MouseEvent) => void
  handleDragStart: (e: React.DragEvent<HTMLDivElement>, clip: Clip) => void
  setActiveTab: (tab: string) => void
  activeTabs: string[]
  setActiveTabs: (tabs: string[]) => void
}

const SearchBin = ({
  searchClips,
  searchBinWidth,
  handleSearchBinResize,
  handleDragStart,
  setActiveTab,
  activeTabs,
  setActiveTabs,
}: SearchBinProps) => {
  return (
    <div
      className={`bg-white p-4 border-r border-gray-200 overflow-auto relative`}
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
          >
            <Search className="w-4 h-4" />
            <span className="sr-only">Search</span>
          </Button>
        </div>
      </div>
      <div className="space-y-4">
        {searchClips.map((clip) => (
          <div
            key={clip.id}
            className="p-4 border border-gray-200 rounded-lg shadow-sm cursor-move bg-gray-50"
            draggable
            onDragStart={(e) => handleDragStart(e, clip)}
            onClick={() => {
              setActiveTab(`clip-${clip.id}`)
              if (!activeTabs.includes(`clip-${clip.id}`)) {
                setActiveTabs([...activeTabs, `clip-${clip.id}`])
              }
            }}
          >
            <div className="font-semibold">{clip.title}</div>
            <div className="text-sm text-gray-600">{clip.speaker}</div>
            <div className="mt-1 text-xs text-gray-500">
              {formatTime(clip.words[clip.words.length - 1]?.end || 0)}
            </div>
            <div className="mt-2 text-sm text-gray-700 line-clamp-2">
              {clip.words.map((w) => w.text).join(' ')}
            </div>
          </div>
        ))}
      </div>
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

interface TextEditorProps {
  timelineClips: Clip[]
  searchClips: Clip[]
  setTimelineClips: React.Dispatch<React.SetStateAction<Clip[]>>
  currentTime: number
  activeTabs: string[]
  setActiveTabs: (tabs: string[]) => void
  activeTab: string
  setActiveTab: (tab: string) => void
  handleClipDelete: (clipId: number) => void
  handleRefreshText: (clipId: number) => void
}

const TextEditor = ({
  timelineClips,
  searchClips,
  setTimelineClips,
  currentTime,
  activeTabs,
  setActiveTabs,
  activeTab,
  setActiveTab,
  handleClipDelete,
  handleRefreshText,
}: TextEditorProps) => {
  const [highlightedWords, setHighlightedWords] = useState<{
    start: number
    end: number
  } | null>(null)
  const getCurrentWord = () => {
    let accumulatedTime = 0
    for (const clip of timelineClips) {
      for (let i = 0; i < clip.words.length; i++) {
        const word = clip.words[i]
        if (accumulatedTime + word.end > currentTime) {
          return { clipId: clip.id, wordIndex: i }
        }
      }
      accumulatedTime += clip.words[clip.words.length - 1]?.end || 0
    }
    return null
  }
  const closeTab = (tabValue: string) => {
    if (activeTabs.length > 1 && tabValue !== 'full-text') {
      setActiveTabs(activeTabs.filter((tab) => tab !== tabValue))
      if (activeTab === tabValue) {
        setActiveTab(activeTabs.find((tab) => tab !== tabValue) || 'full-text')
      }
    }
  }
  const handleWordSelection = (
    e: React.MouseEvent,
    clipId: number,
    wordIndex: number
  ) => {
    e.preventDefault()
    if (!highlightedWords) {
      setHighlightedWords({ start: wordIndex, end: wordIndex })
    } else {
      setHighlightedWords({
        start: Math.min(highlightedWords.start, wordIndex),
        end: Math.max(highlightedWords.end, wordIndex),
      })
    }
  }

  const handleTrimWords = (clipId: number) => {
    if (!highlightedWords) return

    const updatedClips = timelineClips.map((clip) => {
      if (clip.id === clipId) {
        return {
          ...clip,
          words: clip.words.map((word, index) => ({
            ...word,
            hidden:
              index < highlightedWords.start || index > highlightedWords.end,
          })),
        }
      }
      return clip
    })

    setTimelineClips(updatedClips)
    setHighlightedWords(null)

    // Adjust clip timing
    const updatedClip = updatedClips.find((c) => c.id === clipId)
    if (updatedClip) {
      const visibleWords = updatedClip.words.filter((w) => !w.hidden)
      const newStart = visibleWords[0].start

      setTimelineClips((clips: Clip[]) =>
        clips.map((c) => {
          if (c.id === clipId) {
            return {
              ...c,
              words: c.words.map((w) => ({
                ...w,
                start: w.start - newStart,
                end: w.end - newStart,
              })),
            }
          }
          return c
        })
      )
    }
  }
  return (
    <div className="flex flex-col flex-1 p-4 overflow-hidden bg-white">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsList className="p-1 mb-4 bg-gray-100 rounded-lg">
          <TabsTrigger
            value="full-text"
            className="data-[state=active]:bg-white"
          >
            Full Text
          </TabsTrigger>
          {searchClips.map((clip) => (
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
                onClick={(e) => {
                  e.stopPropagation()
                  closeTab(`clip-${clip.id}`)
                }}
              >
                <X className="w-3 h-3" />
                <span className="sr-only">Close tab</span>
              </Button>
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent
          value="full-text"
          className="flex-1 p-6 overflow-auto bg-white border border-gray-200 rounded-lg shadow-sm"
        >
          {timelineClips.length === 0 ? (
            <div className="text-center text-gray-500">
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
              <h2 className="mb-4 text-2xl font-bold">Full Video Text</h2>
              {timelineClips.map((clip) => (
                <ContextMenu key={clip.id}>
                  <ContextMenuTrigger>
                    <div className="mb-4">
                      <h3 className="mb-2 text-lg font-semibold">
                        {clip.title}
                      </h3>
                      <p>
                        {clip.words
                          .filter((word) => !word.hidden)
                          .map((word, index) => (
                            <span
                              key={index}
                              className={`cursor-pointer ${
                                getCurrentWord()?.clipId === clip.id &&
                                getCurrentWord()?.wordIndex === index
                                  ? 'bg-green-200'
                                  : ''
                              } ${
                                highlightedWords &&
                                index >= highlightedWords.start &&
                                index <= highlightedWords.end
                                  ? 'bg-yellow-200'
                                  : ''
                              }`}
                              onMouseDown={(e) =>
                                handleWordSelection(e, clip.id, index)
                              }
                              onMouseEnter={(e) => {
                                if (e.buttons === 1) {
                                  handleWordSelection(e, clip.id, index)
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
                    <ContextMenuItem onClick={() => handleTrimWords(clip.id)}>
                      <Scissors className="w-4 h-4 mr-2" />
                      Trim
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => handleClipDelete(clip.id)}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Clip
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => handleRefreshText(clip.id)}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh Text
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))}
            </>
          )}
        </TabsContent>
        {searchClips.map((clip) => (
          <TabsContent
            key={clip.id}
            value={`clip-${clip.id}`}
            className="flex-1 p-6 overflow-auto bg-white border border-gray-200 rounded-lg shadow-sm"
          >
            <h2 className="mb-4 text-2xl font-bold">{clip.title}</h2>
            <ContextMenu>
              <ContextMenuTrigger>
                <p>
                  {clip.words.map((word, index) => (
                    <span
                      key={index}
                      className={`cursor-pointer ${
                        highlightedWords &&
                        index >= highlightedWords.start &&
                        index <= highlightedWords.end
                          ? 'bg-yellow-200'
                          : ''
                      }`}
                      onMouseDown={(e) =>
                        handleWordSelection(e, clip.id, index)
                      }
                      onMouseEnter={(e) => {
                        if (e.buttons === 1) {
                          handleWordSelection(e, clip.id, index)
                        }
                      }}
                    >
                      {word.text}{' '}
                    </span>
                  ))}
                </p>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem onClick={() => handleTrimWords(clip.id)}>
                  <Scissors className="w-4 h-4 mr-2" />
                  Trim
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

interface TimelineProps {
  timelineClips: Clip[]
  searchClips: Clip[]
  setTimelineClips: React.Dispatch<React.SetStateAction<Clip[]>>
  setSearchClips: React.Dispatch<React.SetStateAction<Clip[]>>
  currentTime: number
  setCurrentTime: React.Dispatch<React.SetStateAction<number>>
  getTotalDuration: () => number
  draggedClip: Clip | null
  setDraggedClip: React.Dispatch<React.SetStateAction<Clip | null>>
  setActiveTab: React.Dispatch<React.SetStateAction<string>>
  isPlaying: boolean
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>
  handleDragStart: (e: React.DragEvent<HTMLDivElement>, clip: Clip, isTimeline: boolean) => void
  handleClipDelete: (clipId: number) => void
  handleRefreshText: (clipId: number) => void
}

const Timeline = ({
  timelineClips,
  searchClips,
  setTimelineClips,
  setSearchClips,
  currentTime,
  setCurrentTime,
  getTotalDuration,
  draggedClip,
  setDraggedClip,
  setActiveTab,
  isPlaying,
  setIsPlaying,
  handleDragStart,
  handleClipDelete,
  handleRefreshText,
}: TimelineProps) => {
  const [displayInlineContact, setDisplayInlineContact] = useState(false)
  const timelineRef = useRef<HTMLDivElement>(null)
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return
    const rect = timelineRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const newTime = (x / rect.width) * getTotalDuration()
    setCurrentTime(newTime)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (!draggedClip) return

    const dropX =
      e.clientX - (timelineRef.current?.getBoundingClientRect().left || 0)
    const dropPosition =
      (dropX / (timelineRef.current?.clientWidth || 1)) * getTotalDuration()

    let newIndex = 0
    let accumulatedDuration = 0
    for (let i = 0; i < timelineClips.length; i++) {
      const clipDuration =
        timelineClips[i].words[timelineClips[i].words.length - 1]?.end || 0
      if (accumulatedDuration + clipDuration / 2 > dropPosition) {
        break
      }
      accumulatedDuration += clipDuration
      newIndex = i + 1
    }

    const newTimelineClips = [...timelineClips]
    newTimelineClips.splice(newIndex, 0, draggedClip)
    setTimelineClips(newTimelineClips)

    if (searchClips.some((c) => c.id === draggedClip.id)) {
      setSearchClips(searchClips.filter((c) => c.id !== draggedClip.id))
    }

    setDraggedClip(null)
    setActiveTab('full-text')
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }
  const handleSkipForward = () => {
    let newTime = currentTime
    for (const clip of timelineClips) {
      const clipEnd = clip.words[clip.words.length - 1]?.end || 0
      if (clipEnd > currentTime) {
        newTime = clipEnd
        break
      }
    }
    setCurrentTime(newTime)
  }

  const handleSkipBackward = () => {
    let newTime = 0
    for (let i = timelineClips.length - 1; i >= 0; i--) {
      const clipStart =
        i > 0
          ? timelineClips[i - 1].words[timelineClips[i - 1].words.length - 1]
              ?.end || 0
          : 0
      if (clipStart < currentTime) {
        newTime = clipStart
        break
      }
    }
    setCurrentTime(newTime)
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
            onClick={() => setIsPlaying(!isPlaying)}
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
        {timelineClips.length === 0 ? (
          <div
            className="flex items-center justify-center h-full bg-gray-100 border-2 border-gray-300 border-dashed rounded-lg"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <p className="text-center text-gray-500">
              Drag and drop clips here to create your video timeline
            </p>
          </div>
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
                  {formatTime(((i + 1) / 4) * getTotalDuration())}
                </div>
              ))}
              <div
                className="absolute text-xs text-gray-500"
                style={{ right: '0%', transform: 'translateX(50%)' }}
              >
                {formatTime(getTotalDuration())}
              </div>
            </div>

            {/* Ticks */}
            <div
              className="relative flex justify-between mb-1"
              style={{ height: '10px' }}
            >
              {Array.from(
                { length: Math.ceil(getTotalDuration()) + 1 },
                (_, i) => (
                  <div
                    key={i}
                    className="absolute bg-gray-300"
                    style={{
                      left: `${(i / getTotalDuration()) * 100}%`,
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
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {/* Clips */}
              {timelineClips.map((clip, index) => {
                const clipStart = timelineClips
                  .slice(0, index)
                  .reduce(
                    (total, c) =>
                      total + (c.words[c.words.length - 1]?.end || 0),
                    0
                  )
                const clipDuration = clip.words[clip.words.length - 1]?.end || 0
                return (
                  <ContextMenu key={clip.id}>
                    <ContextMenuTrigger>
                      <div
                        className={`absolute h-full ${getClipColor(clip.speaker)} rounded-md flex flex-col justify-between p-1`}
                        style={{
                          left: `${(clipStart / getTotalDuration()) * 100}%`,
                          width: `${(clipDuration / getTotalDuration()) * 100}%`,
                          top: '2px',
                          bottom: '2px',
                        }}
                        draggable
                        onDragStart={(e) => handleDragStart(e, clip, true)}
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
                        onClick={() => handleClipDelete(clip.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Clip
                      </ContextMenuItem>
                      <ContextMenuItem
                        onClick={() => handleRefreshText(clip.id)}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh Text
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                )
              })}

              {/* Cursor */}
              <div
                className="absolute top-0 w-0.5 bg-green-500 h-full"
                style={{
                  left: `${(currentTime / getTotalDuration()) * 100}%`,
                }}
              />
            </div>

            {/* Current time flag */}
            <div
              className="absolute top-0 flex items-center justify-center py-1 mt-5 text-xs text-white bg-green-500 rounded"
              style={{
                left: `${(currentTime / getTotalDuration()) * 100}%`,
                transform: 'translateX(-50%)',
                width: '48px',
                height: '18px',
              }}
            >
              {formatTime(currentTime)}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function VideoEditor() {
  const [currentTime, setCurrentTime] = useState(0)
  const [activeTab, setActiveTab] = useState('full-text')
  const [activeTabs, setActiveTabs] = useState(['full-text'])
  const [searchClips, setSearchClips] = useState<Clip[]>([
    {
      id: 1,
      title: 'women_music',
      speaker: 'Speaker A',
      words: [
        { text: 'Hey,', start: 0, end: 0.5, hidden: false },
        { text: 'this', start: 0.5, end: 0.7, hidden: false },
        { text: 'is', start: 0.7, end: 0.8, hidden: false },
        { text: 'Ren', start: 0.8, end: 1.0, hidden: false },
        { text: 'and', start: 1.0, end: 1.2, hidden: false },
        { text: "I'm", start: 1.2, end: 1.4, hidden: false },
        { text: 'testing', start: 1.4, end: 1.8, hidden: false },
        { text: 'this', start: 1.8, end: 2.0, hidden: false },
        { text: 'tool', start: 2.0, end: 2.3, hidden: false },
        { text: 'called', start: 2.3, end: 2.6, hidden: false },
        { text: 'Descript.', start: 2.6, end: 3.0, hidden: false },
      ],
    },
    {
      id: 2,
      title: 'women_m...',
      speaker: 'Speaker B',
      words: [
        { text: 'This', start: 0, end: 0.3, hidden: false },
        { text: 'text', start: 0.3, end: 0.6, hidden: false },
        { text: "won't", start: 0.6, end: 0.9, hidden: false },
        { text: 'be', start: 0.9, end: 1.1, hidden: false },
        { text: 'audible', start: 1.1, end: 1.5, hidden: false },
        { text: 'because', start: 1.5, end: 1.8, hidden: false },
        { text: 'I', start: 1.8, end: 1.9, hidden: false },
        { text: 'typed', start: 1.9, end: 2.2, hidden: false },
        { text: 'it', start: 2.2, end: 2.3, hidden: false },
        { text: 'in.', start: 2.3, end: 2.5, hidden: false },
      ],
    },
    {
      id: 3,
      title: 'Lo...',
      speaker: 'Speaker A',
      words: [
        { text: 'Lorem', start: 0, end: 0.5, hidden: false },
        { text: 'ipsum', start: 0.5, end: 1.0, hidden: false },
        { text: 'dolor', start: 1.0, end: 1.5, hidden: false },
        { text: 'sit', start: 1.5, end: 1.8, hidden: false },
        { text: 'amet,', start: 1.8, end: 2.2, hidden: false },
      ],
    },
  ])
  const [timelineClips, setTimelineClips] = useState<Clip[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [draggedClip, setDraggedClip] = useState<Clip | null>(null)
  const [searchBinWidth, setSearchBinWidth] = useState(25) // 25% of the screen width

  const getTotalDuration = useCallback(() => {
    return timelineClips.reduce((total, clip) => {
      const clipDuration = clip.words[clip.words.length - 1]?.end || 0
      return total + clipDuration
    }, 0)
  }, [timelineClips])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prevTime) => {
          const newTime = prevTime + 0.1
          if (newTime >= getTotalDuration()) {
            setIsPlaying(false)
            return getTotalDuration()
          }
          return newTime
        })
      }, 100)
    }
    return () => clearInterval(interval)
  }, [isPlaying, getTotalDuration])

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    clip: Clip,
    fromTimeline: boolean = false
  ) => {
    e.dataTransfer.setData('text/plain', clip.id.toString())
    setDraggedClip(clip)
    if (fromTimeline) {
      setTimelineClips(timelineClips.filter((c) => c.id !== clip.id))
    }
  }

  const handleClipDelete = (clipId: number) => {
    setTimelineClips((clips) => clips.filter((c) => c.id !== clipId))
    const clip = timelineClips.find((c) => c.id === clipId)
    if (clip) {
      setSearchClips([...searchClips, clip])
    }
    setActiveTab('full-text')
  }

  const handleRefreshText = (clipId: number) => {
    setTimelineClips((clips) =>
      clips.map((clip) => {
        if (clip.id === clipId) {
          return {
            ...clip,
            words: clip.words.map((word) => ({ ...word, hidden: false })),
          }
        }
        return clip
      })
    )
  }

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

  return (
    <div className="flex flex-col max-w-screen-lg border-2 rounded-sm w-svw h-[800px]">
      <div className="flex h-full overflow-hidden">
        <SearchBin
          searchClips={searchClips}
          searchBinWidth={searchBinWidth}
          handleSearchBinResize={handleSearchBinResize}
          handleDragStart={handleDragStart}
          setActiveTab={setActiveTab}
          activeTabs={activeTabs}
          setActiveTabs={setActiveTabs}
        />
        <TextEditor
          timelineClips={timelineClips}
          searchClips={searchClips}
          setTimelineClips={setTimelineClips}
          currentTime={currentTime}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          activeTabs={activeTabs}
          setActiveTabs={setActiveTabs}
          handleClipDelete={handleClipDelete}
          handleRefreshText={handleRefreshText}
        />
      </div>
      <Timeline
        timelineClips={timelineClips}
        searchClips={searchClips}
        setTimelineClips={setTimelineClips}
        setSearchClips={setSearchClips}
        currentTime={currentTime}
        setCurrentTime={setCurrentTime}
        getTotalDuration={getTotalDuration}
        draggedClip={draggedClip}
        setDraggedClip={setDraggedClip}
        setActiveTab={setActiveTab}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        handleDragStart={handleDragStart}
        handleClipDelete={handleClipDelete}
        handleRefreshText={handleRefreshText}
      />
    </div>
  )
}
