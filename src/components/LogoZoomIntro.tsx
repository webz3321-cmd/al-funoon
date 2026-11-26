import { useEffect, useState } from 'react'
import { FestLogo } from './FestLogo'

export function LogoZoomIntro({ onComplete }: { onComplete: () => void }) {
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const t1 = window.setTimeout(() => setFading(true), 950)
    const t2 = window.setTimeout(onComplete, 1450)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [onComplete])

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0f2a6b] transition-opacity duration-500 ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="anim-zoom-open flex flex-col items-center">
        <div className="flex h-36 w-36 items-center justify-center rounded-3xl bg-white p-4 shadow-2xl">
          <FestLogo className="h-full w-full" />
        </div>
        <h1 className="mt-6 font-hand text-4xl font-bold tracking-wide text-white drop-shadow-lg sm:text-5xl">
          MAKE YOUR MAGIC
        </h1>
      </div>
    </div>
  )
}
