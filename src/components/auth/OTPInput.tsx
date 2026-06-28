import { useRef, type KeyboardEvent, type ClipboardEvent } from 'react'
import { cn } from '@/lib/utils'

interface OTPInputProps {
  value: string
  onChange: (val: string) => void
  length?: number
}

export function OTPInput({ value, onChange, length = 6 }: OTPInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const digits = value.split('').concat(Array(length).fill('')).slice(0, length)

  function handleChange(index: number, char: string) {
    if (!/^\d?$/.test(char)) return
    const next = [...digits]
    next[index] = char
    onChange(next.join(''))
    if (char && index < length - 1) refs.current[index + 1]?.focus()
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus()
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    onChange(pasted.padEnd(length, '').slice(0, length))
    refs.current[Math.min(pasted.length, length - 1)]?.focus()
  }

  return (
    <div className="flex gap-2 justify-center">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className={cn(
            'w-11 h-14 text-center text-xl font-semibold rounded-lg border border-ink-200 bg-white',
            'focus:outline-none focus:ring-2 focus:ring-ink-900 focus:border-transparent',
            'transition-colors',
            digit && 'border-ink-900',
          )}
        />
      ))}
    </div>
  )
}
