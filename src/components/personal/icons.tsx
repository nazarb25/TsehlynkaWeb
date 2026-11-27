export function TileIcon({ path }: { path: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  )
}

export const TILE = {
  clock: 'M12 7v5l3 2M21 12a9 9 0 1 1-9-9 9 9 0 0 1 9 9z',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
  mail: 'M4 6h16v12H4zM4 7l8 6 8-6',
  send: 'M21 3 3 10.5l7 2.5 2.5 7zM21 3l-11 10',
  shop: 'M4 9l1.5-5h13L20 9M4 9v11h16V9M4 9h16M9 20v-6h6v6',
  alert: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 8v5M12 16h.01',
  tag: 'M3 12V4h8l10 10-8 8zM7.5 7.5h.01',
  chat: 'M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z',
  idea: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.8.6 1.1 1.4 1.1 2.2h5c0-.8.3-1.6 1.1-2.2A6 6 0 0 0 12 3z',
} as const
