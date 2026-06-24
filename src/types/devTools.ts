export type LiveMatchDevCommandType =
  | 'force-player-win'
  | 'force-rival-win'
  | 'force-flow-next'

export interface LiveMatchDevCommand {
  id: number
  type: LiveMatchDevCommandType
}
