'use client'

import { useEffect, useState } from 'react'

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3)
}

export function useCountUp(
  end: number,
  active: boolean,
  duration = 1400,
) {
  const [value, setValue] = useState(active ? 0 : end)

  useEffect(() => {
    if (!active) {
      setValue(end)
      return
    }

    setValue(0)
    const start = performance.now()
    let frame = 0

    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1)
      setValue(end * easeOutCubic(progress))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [end, active, duration])

  return value
}