import { Globe } from 'lucide-react'

interface Props {
  size: 'sm' | 'lg'
}

export default function LogoCircle({ size }: Props) {
  const dim = size === 'sm' ? 'w-8 h-8' : 'w-16 h-16'
  const iconSize = size === 'sm' ? 15 : 28
  return (
    <div
      className={`${dim} rounded-full shrink-0 flex items-center justify-center`}
      style={{ background: 'linear-gradient(135deg, #F4A201 0%, #009A44 100%)' }}
    >
      <Globe size={iconSize} color="#0A0A0A" strokeWidth={1.75} />
    </div>
  )
}
