import { useEffect, useState } from 'react'

const formatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Shanghai',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
})

function readClock(): string {
  try {
    return formatter.format(new Date())
  } catch {
    // 极老的环境不支持 IANA 时区时退回本地时间，保证不崩
    return new Date().toTimeString().slice(0, 8)
  }
}

/**
 * 每秒一跳的本地时钟（Asia/Shanghai）。
 * 这是廉价但有效的"仪表盘"细节，用来暗示站点是活的。
 */
export function useLocalTime(): string {
  const [time, setTime] = useState<string>(readClock)

  useEffect(() => {
    const id = window.setInterval(() => setTime(readClock()), 1000)
    return () => window.clearInterval(id)
  }, [])

  return time
}
