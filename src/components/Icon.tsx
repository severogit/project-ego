import { useId, type SVGProps } from 'react'

export type IconName =
  | 'trophy'
  | 'eye'
  | 'crosshair'
  | 'route'
  | 'sparkles'
  | 'zap'
  | 'shield'
  | 'target'
  | 'wind'
  | 'crown'
  | 'network'

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName
  title?: string
}

function Icon({ name, title, className = 'h-4 w-4', ...props }: IconProps) {
  const titleId = useId()

  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden={title ? undefined : true}
      aria-labelledby={title ? titleId : undefined}
      role={title ? 'img' : undefined}
      {...props}
    >
      {title && <title id={titleId}>{title}</title>}
      <use href={`/icons.svg#${name}-icon`} />
    </svg>
  )
}

export default Icon
