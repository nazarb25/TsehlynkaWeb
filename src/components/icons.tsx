import type { SVGProps } from 'react'

type IconProps = Omit<SVGProps<SVGSVGElement>, 'children'> & { size?: number }

function Svg({ size = 18, strokeWidth = 2, children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  )
}

export const BrickIcon = (props: IconProps) => (
  <Svg strokeWidth={1.5} {...props}>
    <rect x="3" y="10" width="18" height="9" rx="1.5" />
    <rect x="6" y="6.5" width="4" height="3.5" rx="1" />
    <rect x="14" y="6.5" width="4" height="3.5" rx="1" />
  </Svg>
)

export const SearchIcon = (props: IconProps) => (
  <Svg {...props}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </Svg>
)

export const ChevronRight = (props: IconProps) => (
  <Svg {...props}>
    <path d="M9 6l6 6-6 6" />
  </Svg>
)

export const ChevronLeft = (props: IconProps) => (
  <Svg {...props}>
    <path d="M15 5l-7 7 7 7" />
  </Svg>
)

export const ChevronDown = (props: IconProps) => (
  <Svg {...props}>
    <path d="M6 9l6 6 6-6" />
  </Svg>
)

export const CloseIcon = (props: IconProps) => (
  <Svg strokeWidth={2.4} {...props}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Svg>
)

export const TelegramIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M21 4L3 11l6 2.2L18 7l-7 7.6V20l3.4-3.7L18 19z" />
  </Svg>
)

export const ExternalIcon = (props: IconProps) => (
  <Svg strokeWidth={2.6} size={12} {...props}>
    <path d="M7 17L17 7M9 7h8v8" />
  </Svg>
)

export const ShareIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M12 15V4M8 8l4-4 4 4" />
    <path d="M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7" />
  </Svg>
)

export const GridIcon = (props: IconProps) => (
  <Svg {...props}>
    <rect x="4" y="4" width="7" height="7" rx="1.5" />
    <rect x="13" y="4" width="7" height="7" rx="1.5" />
    <rect x="4" y="13" width="7" height="7" rx="1.5" />
    <rect x="13" y="13" width="7" height="7" rx="1.5" />
  </Svg>
)

export const ListIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" />
  </Svg>
)

export const StarIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />
  </Svg>
)

export const BagIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M5 8h14l-1 12H6z" />
    <path d="M9 8V6a3 3 0 0 1 6 0v2" />
  </Svg>
)

export const TagIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M3 12V4h8l9 9-8 8z" />
    <circle cx="7.5" cy="8.5" r="1.3" />
  </Svg>
)

export const HomeIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M4 10.5L12 4l8 6.5V20h-5v-6h-6v6H4z" />
  </Svg>
)

export const HashIcon = (props: IconProps) => (
  <Svg strokeWidth={2.2} size={13} {...props}>
    <path d="M5 9h15M4 15h15M10 3 8 21M16 3l-2 18" />
  </Svg>
)

export const CalendarIcon = (props: IconProps) => (
  <Svg strokeWidth={2.2} size={13} {...props}>
    <rect x="4" y="5" width="16" height="16" rx="2" />
    <path d="M16 3v4M8 3v4M4 11h16" />
  </Svg>
)

export const PiecesIcon = (props: IconProps) => (
  <Svg strokeWidth={2.2} size={13} {...props}>
    <rect x="3" y="10" width="18" height="10" rx="2" />
    <rect x="6" y="6" width="4" height="4" rx="1" />
    <rect x="14" y="6" width="4" height="4" rx="1" />
  </Svg>
)

export const AgeIcon = (props: IconProps) => (
  <Svg strokeWidth={2.2} size={13} {...props}>
    <circle cx="12" cy="7.5" r="3.5" />
    <path d="M5 20a7 7 0 0 1 14 0" />
  </Svg>
)

export const FigureIcon = (props: IconProps) => (
  <Svg {...props}>
    <rect x="8" y="3" width="8" height="7" rx="2" />
    <path d="M6 21v-7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v7" />
    <path d="M12 15v6" />
  </Svg>
)

export const FileIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5" />
  </Svg>
)

export const FilterIcon = (props: IconProps) => (
  <Svg strokeWidth={2.2} {...props}>
    <path d="M4 7h16M7 12h10M10 17h4" />
  </Svg>
)

export const SortIcon = (props: IconProps) => (
  <Svg strokeWidth={2.2} {...props}>
    <path d="M7 4v16M3 8l4-4 4 4M17 20V4M13 16l4 4 4-4" />
  </Svg>
)

export const AlertIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M12 4 2.5 20h19z" />
    <path d="M12 10v4M12 17h.01" />
  </Svg>
)

export const BellIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8" />
    <path d="M10 20a2 2 0 0 0 4 0" />
  </Svg>
)

export const CheckIcon = (props: IconProps) => (
  <Svg strokeWidth={3} size={12} {...props}>
    <path d="M5 12l5 5 9-10" />
  </Svg>
)

/** Логотип Цеглинки: цеглинка на медовій плитці. */
export function Logo({ size = 32 }: { size?: number }) {
  return (
    <span className="logo" style={{ width: size, height: size }} aria-hidden="true">
      <BrickIcon size={Math.round(size * 0.62)} strokeWidth={2.2} />
    </span>
  )
}
