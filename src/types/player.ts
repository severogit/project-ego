export type Rarity =
  | 'Common'
  | 'Rare'
  | 'Epic'
  | 'Legendary'
  | 'Egoist'

export interface Player {
  id: number
  name: string
  position: string
  rarity: Rarity
  attack: number
  speed: number
  vision: number
  dribble: number
  defense: number
  ego: number
  flowRate: number
  trait?: {
    name: string
    description: string
  }
  archetypes?: string[]
  image?: string
}
