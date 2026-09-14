import React from 'react'

export default function Logo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" {...props}>
      <circle cx="28" cy="32" r="16" stroke="currentColor" strokeWidth="3.5" />
      <circle cx="28" cy="32" r="7" fill="currentColor" />
      <path d="M35 32h17" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M46 26l6 6-6 6" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
