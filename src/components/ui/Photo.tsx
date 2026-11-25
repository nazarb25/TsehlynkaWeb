import { BrickIcon } from '@/components/icons'

interface PhotoProps {
  src: string | null | undefined
  alt?: string
  className?: string
  iconSize?: number
  eager?: boolean
  children?: React.ReactNode
}

/** Фото набору на світло-сірій сцені; без фото — значок цеглинки. */
export function Photo({ src, alt = '', className, iconSize = 28, eager, children }: PhotoProps) {
  return (
    <span className={`stage${className ? ` ${className}` : ''}`}>
      {src ? (
        <img src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" draggable={false} />
      ) : (
        <BrickIcon size={iconSize} />
      )}
      {children}
    </span>
  )
}
