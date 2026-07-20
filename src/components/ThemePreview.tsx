import VersionA from '../themes/super-classic-a/VersionA'
import EleganGrey from '../themes/elegan-grey/EleganGrey'
import BlueFlowers from '../themes/blue-flowers/BlueFlowers'
import type { InvitationData } from '../lib/invitationStore'
import type { ThemeId } from '../lib/themeTypes'
import type { PreviewFocusTarget } from './useScrollPreviewToSection'

type Props = {
  data: InvitationData
  forceOpen?: boolean
  hideBack?: boolean
  previewMode?: boolean
  focusSection?: PreviewFocusTarget | null
  focusNonce?: number
}

export default function ThemePreview({
  data,
  forceOpen,
  hideBack,
  previewMode,
  focusSection = null,
  focusNonce = 0,
}: Props) {
  const theme = data.activeTheme as ThemeId
  const common = {
    data,
    forceOpen,
    hideBack,
    previewMode,
    focusSection,
    focusNonce,
  }

  if (theme === 'elegan-grey') return <EleganGrey {...common} />
  if (theme === 'blue-flowers') return <BlueFlowers {...common} />
  return <VersionA {...common} />
}
