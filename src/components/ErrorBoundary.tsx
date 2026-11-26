import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App error boundary caught:', error, info)
  }

  render() {
    if (this.state.error) {
      let friendly = this.state.error.message
      try {
        const parsed = JSON.parse(this.state.error.message) as { error?: string; operationType?: string; path?: string }
        if (parsed.error) {
          friendly = `${parsed.error}${parsed.path ? ` (${parsed.operationType} on ${parsed.path})` : ''}`
        }
      } catch {
        // non-JSON error message
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-[#fdf6e3] p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-xl">
            <h2 className="font-serif text-2xl font-bold text-slate-900">Something went wrong</h2>
            <p className="mt-2 break-words text-sm text-red-600">{friendly}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-5 rounded-full bg-[#e64e24] px-6 py-2.5 font-bold text-white shadow hover:bg-[#cf4018]"
            >
              Reload page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
