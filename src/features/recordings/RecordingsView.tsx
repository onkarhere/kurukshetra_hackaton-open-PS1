import React, { useState } from 'react'
import {
  Video,
  Play,
  Clock,
  Sparkles,
  Search,
  BookOpen,
  Calendar,
  Share2,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ReasonChip } from '@/components/ui/ReasonChip'
import { store } from '@/mocks/store'
import { Recording } from '@/types'
import { useToast } from '@/context/ToastContext'

export const RecordingsView: React.FC = () => {
  const { success } = useToast()
  const recordings = store.recordings
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null)

  return (
    <div className="space-y-5 animate-fade-in select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-fg">Session Recordings & AI Summaries</h1>
          <p className="text-xs text-fg-muted mt-0.5">
            Auto-recorded Zoom/Meet lectures with chapter markers and key takeaways
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => success('Zoom cloud sync checked. All recordings current.')}
          leftIcon={<Sparkles className="w-3.5 h-3.5" />}
        >
          Sync Cloud Recordings
        </Button>
      </div>

      {/* Grid of Recordings */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {recordings.map((rec) => (
          <div
            key={rec.id}
            onClick={() => setSelectedRecording(rec)}
            className="rounded-card border border-border bg-surface overflow-hidden shadow-sm hover:shadow-hover hover:border-text-muted/40 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="relative aspect-video bg-black/80 overflow-hidden group">
                <img
                  src={rec.thumbnailUrl}
                  alt={rec.title}
                  className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-primary/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Play className="w-4 h-4 ml-0.5" />
                  </div>
                </div>
                <span className="absolute bottom-2 right-2 bg-black/80 text-white font-mono text-[10px] px-1.5 py-0.5 rounded">
                  {rec.duration}
                </span>
              </div>

              <div className="p-4 space-y-2">
                <div className="text-[11px] font-mono text-fg-muted flex items-center justify-between">
                  <span>{rec.batchName}</span>
                  <span>{rec.date}</span>
                </div>

                <h3 className="text-xs font-bold text-fg leading-snug line-clamp-2">
                  {rec.title}
                </h3>

                <div className="p-2.5 rounded-btn bg-surface-2 border border-border space-y-1">
                  <div className="text-[10px] font-mono text-ai font-semibold uppercase flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-ai" />
                    AI Key Takeaway
                  </div>
                  <p className="text-[11px] text-fg-muted line-clamp-3 leading-relaxed">
                    {rec.aiSummary}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-4 pb-4 pt-1 flex items-center justify-between text-xs text-fg-muted border-t border-border/40">
              <span>{rec.trainerName}</span>
              <span className="font-mono text-[11px]">{rec.attendanceCount} attended</span>
            </div>
          </div>
        ))}
      </div>

      {/* Video Player Modal */}
      {selectedRecording && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedRecording(null)}
        >
          <div
            className="w-full max-w-3xl bg-surface border border-border rounded-modal shadow-modal overflow-hidden text-fg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-fg">{selectedRecording.title}</h3>
                <p className="text-xs text-fg-muted">
                  {selectedRecording.batchName} · Faculty: {selectedRecording.trainerName}
                </p>
              </div>
              <button
                onClick={() => setSelectedRecording(null)}
                className="text-fg-muted hover:text-fg p-1 rounded-btn"
              >
                ✕
              </button>
            </div>

            <div className="aspect-video bg-black flex items-center justify-center">
              <video
                controls
                src={selectedRecording.videoUrl}
                className="w-full h-full object-contain"
                autoPlay
              />
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <div className="text-[11px] font-mono uppercase text-fg-muted font-semibold">
                  Timestamp Chapters
                </div>
                <div className="space-y-1">
                  {selectedRecording.chapters.map((ch, idx) => (
                    <div
                      key={idx}
                      className="p-1.5 rounded bg-surface-2 border border-border flex items-center justify-between cursor-pointer hover:bg-surface-2/80"
                    >
                      <span className="text-fg font-medium">{ch.title}</span>
                      <span className="font-mono text-primary font-semibold text-[11px]">
                        {ch.time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-[11px] font-mono uppercase text-ai font-semibold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-ai" />
                  AI Structured Synthesis
                </div>
                <div className="p-3 rounded-btn bg-ai/5 border border-ai/20 text-fg text-xs leading-relaxed">
                  {selectedRecording.aiSummary}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
