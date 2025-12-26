import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, FileQuestion, Users, BookOpen, Tag, Clock, ArrowRight, ExternalLink } from 'lucide-react'
import { useGroupStore } from '@/stores/group-store'
import { useAssetStore } from '@/stores/asset-store'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'
import type { AssetMCQ, Group, GroupMCQ, GroupTopic } from '@/types'

interface SearchResult {
  id: string
  type: 'question' | 'topic' | 'group' | 'subject'
  title: string
  subtitle?: string
  category?: string
  source: string
  data?: any // Additional data for navigation
}

interface GlobalSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onNavigateToGroup?: (groupId: string) => void
  onNavigateToLibrary?: () => void
}

export function GlobalSearch({ open, onOpenChange, onNavigateToGroup, onNavigateToLibrary }: GlobalSearchProps) {
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const toast = useToast()

  // Stores
  const { myGroups, groupMCQs, topics: groupTopics, setActiveGroup } = useGroupStore()
  const { subjects: assetSubjects, topics: assetTopics, subtopics: assetSubtopics, assets, setSelectedSubject, setSelectedTopic, setSelectedSubtopic } = useAssetStore()

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches')
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved))
      } catch (e) {
        console.error('Error parsing recent searches:', e)
      }
    }
  }, [])

  // Save search to recent
  const saveRecentSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return
    
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('recentSearches', JSON.stringify(updated))
  }, [recentSearches])

  // Clear recent searches
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([])
    localStorage.removeItem('recentSearches')
  }, [])

  // Search results
  const results = useMemo((): SearchResult[] => {
    if (!query.trim() || query.length < 2) return []

    const searchTerm = query.toLowerCase().trim()
    const results: SearchResult[] = []

    // Search in group MCQs
    groupMCQs.forEach((q: GroupMCQ) => {
      if (
        q.question.toLowerCase().includes(searchTerm) ||
        q.options?.some((opt: string) => opt.toLowerCase().includes(searchTerm)) ||
        q.explanation?.toLowerCase().includes(searchTerm)
      ) {
        results.push({
          id: q.id,
          type: 'question',
          title: q.question.length > 80 ? q.question.substring(0, 80) + '...' : q.question,
          subtitle: q.explanation?.substring(0, 50) || undefined,
          source: 'Group'
        })
      }
    })

    // Search in library subjects
    assetSubjects.forEach(s => {
      if (s.name.toLowerCase().includes(searchTerm)) {
        results.push({
          id: s.id,
          type: 'subject',
          title: s.name,
          subtitle: 'Asset Library',
          source: 'Library'
        })
      }
    })

    // Search in group topics
    groupTopics.forEach((t: GroupTopic) => {
      if (t.name.toLowerCase().includes(searchTerm)) {
        results.push({
          id: t.id,
          type: 'topic',
          title: t.name,
          source: 'Group'
        })
      }
    })

    // Search in library topics
    assetTopics.forEach(t => {
      if (t.name.toLowerCase().includes(searchTerm)) {
        results.push({
          id: t.id,
          type: 'topic',
          title: t.name,
          subtitle: assetSubjects.find(s => s.id === t.subjectId)?.name,
          source: 'Library'
        })
      }
    })

    // Search in library subtopics
    assetSubtopics.forEach(st => {
      if (st.name.toLowerCase().includes(searchTerm)) {
        results.push({
          id: st.id,
          type: 'topic',
          title: st.name,
          subtitle: assetTopics.find(t => t.id === st.topicId)?.name,
          source: 'Library'
        })
      }
    })

    // Search in asset MCQs (inside quizQuestions)
    assets.forEach(asset => {
      if (asset.type === 'mcq') {
        const mcqAsset = asset as AssetMCQ
        mcqAsset.quizQuestions?.forEach(q => {
          if (
            q.question.toLowerCase().includes(searchTerm) ||
            q.options?.some((opt: string) => opt.toLowerCase().includes(searchTerm)) ||
            q.explanation?.toLowerCase().includes(searchTerm)
          ) {
            results.push({
              id: q.id,
              type: 'question',
              title: q.question.length > 80 ? q.question.substring(0, 80) + '...' : q.question,
              subtitle: q.explanation?.substring(0, 50) || undefined,
              category: assetSubtopics.find(st => st.id === mcqAsset.subtopicId)?.name,
              source: 'Library'
            })
          }
        })
      }
    })

    // Search in groups
    myGroups.forEach((g: Group) => {
      if (
        g.name.toLowerCase().includes(searchTerm) ||
        g.description?.toLowerCase().includes(searchTerm)
      ) {
        results.push({
          id: g.id,
          type: 'group',
          title: g.name,
          subtitle: g.description?.substring(0, 50) || `${g.members?.length || 0} সদস্য`,
          source: 'Groups',
          data: { groupId: g.id }
        })
      }
    })

    return results.slice(0, 20) // Limit to 20 results
  }, [query, groupMCQs, groupTopics, assetSubjects, assetTopics, assetSubtopics, assets, myGroups])

  // Handle search submit
  const handleSearch = useCallback(() => {
    if (query.trim()) {
      saveRecentSearch(query.trim())
    }
  }, [query, saveRecentSearch])

  // Handle result click
  const handleResultClick = useCallback((result: SearchResult) => {
    saveRecentSearch(query.trim())
    onOpenChange(false)
    
    // Navigate based on result type and source
    switch (result.type) {
      case 'group':
        // Navigate to group
        if (result.data?.groupId) {
          setActiveGroup(result.data.groupId)
          if (onNavigateToGroup) {
            onNavigateToGroup(result.data.groupId)
          }
          toast.success('Going to group', result.title)
        }
        break
        
      case 'subject':
        if (result.source === 'Library') {
          setSelectedSubject(result.id)
          setSelectedTopic(null)
          setSelectedSubtopic(null)
          if (onNavigateToLibrary) {
            onNavigateToLibrary()
          }
          toast.info('Opening Library', result.title)
        }
        break
        
      case 'topic':
        if (result.source === 'Library') {
          // Find subject for this topic
          const topic = assetTopics.find(t => t.id === result.id)
          if (topic) {
            setSelectedSubject(topic.subjectId)
            setSelectedTopic(result.id)
            setSelectedSubtopic(null)
          }
          if (onNavigateToLibrary) {
            onNavigateToLibrary()
          }
          toast.info('Opening Library', result.title)
        } else if (result.source === 'Group') {
          toast.info('Go to Group Course', result.title)
        }
        break
        
      case 'question':
        if (result.source === 'Library') {
          // Find the subtopic for this question
          const mcqAsset = assets.find(a => 
            a.type === 'mcq' && 
            (a as AssetMCQ).quizQuestions?.some(q => q.id === result.id)
          ) as AssetMCQ | undefined
          
          if (mcqAsset) {
            const subtopic = assetSubtopics.find(st => st.id === mcqAsset.subtopicId)
            if (subtopic) {
              const topic = assetTopics.find(t => t.id === subtopic.topicId)
              if (topic) {
                setSelectedSubject(topic.subjectId)
                setSelectedTopic(topic.id)
                setSelectedSubtopic(subtopic.id)
              }
            }
          }
          if (onNavigateToLibrary) {
            onNavigateToLibrary()
          }
          toast.info('View in Library', result.title.substring(0, 30) + '...')
        } else if (result.source === 'Group') {
          toast.info('View in Group', 'Go to Group Course tab')
        }
        break
    }
  }, [query, saveRecentSearch, onOpenChange, setActiveGroup, onNavigateToGroup, onNavigateToLibrary, setSelectedSubject, setSelectedTopic, setSelectedSubtopic, assets, assetSubtopics, assetTopics, toast])

  // Reset query when dialog closes
  useEffect(() => {
    if (!open) {
      setQuery('')
    }
  }, [open])

  // Get icon for result type
  const getResultIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'question': return FileQuestion
      case 'topic': return Tag
      case 'subject': return BookOpen
      case 'group': return Users
      default: return FileQuestion
    }
  }

  // Get color for source
  const getSourceColor = (source: string) => {
    switch (source) {
      case 'Group': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
      case 'Personal': return 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
      case 'Library': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
      case 'Groups': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
      default: return 'bg-gray-500/10 text-gray-600 dark:text-gray-400'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="sr-only">Search</DialogTitle>
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search questions, topics, subjects or groups..."
              className="pl-10 pr-10 h-12 text-base border-0 border-b rounded-none focus-visible:ring-0"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* Search Results */}
            {query.length >= 2 && results.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-2"
              >
                <p className="text-xs text-muted-foreground px-2 py-1">
                  {results.length} results found
                </p>
                <div className="space-y-1">
                  {results.map((result, index) => {
                    const Icon = getResultIcon(result.type)
                    return (
                      <motion.button
                        key={`${result.type}-${result.id}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        onClick={() => handleResultClick(result)}
                        className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                      >
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          <Icon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm line-clamp-2">{result.title}</p>
                          {result.subtitle && (
                            <p className="text-xs text-muted-foreground line-clamp-1">{result.subtitle}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <span className={cn('text-xs px-2 py-0.5 rounded-full', getSourceColor(result.source))}>
                              {result.source}
                            </span>
                            {result.category && (
                              <span className="text-xs text-muted-foreground">{result.category}</span>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                      </motion.button>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {/* No Results */}
            {query.length >= 2 && results.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-8 text-center"
              >
                <Search className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No results found</p>
                <p className="text-xs text-muted-foreground mt-1">Try a different search term</p>
              </motion.div>
            )}

            {/* Recent Searches / Empty State */}
            {query.length < 2 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-4"
              >
                {recentSearches.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-muted-foreground font-medium">Recent Searches</p>
                      <button
                        onClick={clearRecentSearches}
                        className="text-xs text-primary hover:underline"
                      >
                        Clear
                      </button>
                    </div>
                    <div className="space-y-1">
                      {recentSearches.map((search, index) => (
                        <button
                          key={index}
                          onClick={() => setQuery(search)}
                          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-left"
                        >
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{search}</span>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Search className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">Start typing</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Search questions, topics, subjects or groups
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Keyboard Shortcut Hint */}
        <div className="p-3 border-t bg-muted/30 text-xs text-muted-foreground flex items-center justify-between">
          <span>ESC to close</span>
          <span>⌘K to open</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Search trigger button component
export function SearchButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      className="relative h-9 w-9 p-0 md:h-10 md:w-60 md:justify-start md:px-3 md:py-2"
    >
      <Search className="h-4 w-4 md:mr-2" />
      <span className="hidden md:inline-flex text-muted-foreground">Search...</span>
      <kbd className="hidden md:inline-flex pointer-events-none absolute right-2 h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
        <span className="text-xs">⌘</span>K
      </kbd>
    </Button>
  )
}
