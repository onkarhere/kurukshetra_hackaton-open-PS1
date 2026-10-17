import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertOctagon, RotateCcw } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in ErrorBoundary:', error, errorInfo)
  }

  private handleReload = () => {
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-canvas text-text text-center select-none font-sans">
          <div className="w-14 h-14 rounded-full bg-danger/10 text-danger flex items-center justify-center mb-4">
            <AlertOctagon className="w-7 h-7" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-text">Something went wrong</h1>
          <p className="text-xs text-text-muted mt-1.5 max-w-md leading-relaxed">
            An unexpected error occurred while rendering this interface. Your data in the local store is preserved.
          </p>
          {this.state.error && (
            <pre className="mt-3 p-3 rounded-control bg-surface-sunken border border-border text-[11px] font-mono text-danger max-w-lg overflow-x-auto text-left">
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={this.handleReload}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-control bg-surface border border-border hover:bg-surface-sunken transition-colors text-text shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reload application</span>
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
