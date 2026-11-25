import { BrickIcon } from '@/components/icons'

interface EmptyStateProps {
  title: string
  text?: string
  icon?: React.ReactNode
  children?: React.ReactNode
}

export function EmptyState({ title, text, icon, children }: EmptyStateProps) {
  return (
    <div className="state">
      <span className="state__icon">{icon ?? <BrickIcon size={28} />}</span>
      <h2>{title}</h2>
      {text ? <p>{text}</p> : null}
      {children ? <div className="state__actions">{children}</div> : null}
    </div>
  )
}
