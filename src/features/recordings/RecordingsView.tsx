import React, { useState } from 'react'
import {
  Video,
  Play,
  Clock,
  Search,
  Calendar,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { store, useStore } from '@/mocks/store'
import { Recording } from '@/types'
import { useToast } from '@/context/ToastContext'

export const RecordingsView: React.FC = () => {
  const { success } = useToast()
  const recordings = useStore((s) => s.recordings)
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null)

  const handleSync = () => {
    store.notify()
    success('Cloud recordings synchronized', `${recordings.length} session archives verified and updated.`)
  }

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <h1 className="text-xl font-semibold text-text">Recordings</h1>
          <p className="text-xs text-text-muted mt-0.5">
            Cloud session archives, chapter markers, and lecture notes
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleSync}
          leftIcon={<Video className="w-3.5 h-3.5" />}
        >
          Sync cloud recordings
        </Button>
      </div>

      {/* Grid of Recordings */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recordings.map((rec) => (
          <div
            key={rec.id}
            onClick={() => setSelectedRecording(rec)}
            className="rounded-card border border-border bg-surface overflow-hidden hover:border-border-strong transition-colors cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="relative aspect-video bg-[#33251F] overflow-hidden group">
                <img
                  src={rec.thumbnailUrl}
                  alt={rec.title}
                  className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-200"
                />
                <div className="absolute inset-0 bg-[rgba(30,20,14,0.35)] flex items-center justify-center">
                  <div className="w-9 h-9 rounded-full bg-[#F6E3D1] text-[#1E140E] flex items-center justify-center shadow-dialog">
                    <Play className="w-3.5 h-3.5 ml-0.5" />
                  </div>
                </div>
                <span className="absolute bottom-2 right-2 bg-[#33251F]/90 text-[#F8F4EF] font-mono text-[10px] px-1.5 py-0.5 rounded">
                  {rec.duration}
                </span>
              </div>

              <div className="p-3.5 space-y-2">
                <div className="text-[11px] text-text-muted flex items-center justify-between">
                  <span className="truncate max-w-[140px]">{rec.batchName}</span>
                  <span className="tabular-nums">{rec.date}</span>
                </div>

                <h3 className="text-xs font-medium text-text leading-snug line-clamp-2">
                  {rec.title}
                </h3>

                <div className="p-2.5 rounded-control bg-surface-sunken border border-border space-y-1">
                  <div className="text-[10px] uppercase font-semibold text-text-muted">
                    Session overview
                  </div>
                  <p className="text-[11px] text-text-muted line-clamp-3 leading-relaxed">
                    {rec.aiSummary}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-3.5 pb-3.5 pt-1 flex items-center justify-between text-xs text-text-muted border-t border-border">
              <span>{rec.trainerName}</span>
              <span className="tabular-nums text-[11px]">{rec.attendanceCount} attended</span>
            </div>
          </div>
        ))}
      </div>

      {/* Video Player Modal */}
      {selectedRecording && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedRecording(null)}
        >
          <div
            className="w-full max-w-3xl bg-surface border border-border rounded-dialog shadow-dialog overflow-hidden text-text"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3.5 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold text-text">{selectedRecording.title}</h3>
                <p className="text-[11px] text-text-muted">
                  {selectedRecording.batchName} · Trainer: {selectedRecording.trainerName}
                </p>
              </div>
              <button
                onClick={() => setSelectedRecording(null)}
                className="text-text-muted hover:text-text p-1 rounded-control"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="aspect-video bg-[#33251F] flex items-center justify-center">
              <video
                controls
                src={selectedRecording.videoUrl}
                className="w-full h-full object-contain"
                autoPlay
              />
            </div>

            <div className="p-3.5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <div className="text-[11px] uppercase tracking-wider text-text-muted font-medium">
                  Chapter markers
                </div>
                <div className="space-y-1">
                  {selectedRecording.chapters.map((ch, idx) => (
                    <div
                      key={idx}
                      className="p-1.5 rounded-control bg-surface-sunken flex items-center justify-between text-[11px]"
                    >
                      <span className="text-text">{ch.title}</span>
                      <span className="font-mono text-text-muted">{ch.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-[11px] uppercase tracking-wider text-text-muted font-medium">
                  Key takeaways
                </div>
                <p className="text-text-muted leading-relaxed text-[11px]">
                  {selectedRecording.aiSummary}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
