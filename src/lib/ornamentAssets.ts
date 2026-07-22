/**
 * Ornamen gratis dari sumber berlisensi aman (PD / CC0 / Commons).
 * Lihat SOURCES.md / batch-2/SOURCES.md untuk atribusi.
 */
import scCorner from '../assets/ornaments/free/super-classic/corner.svg?url'
import scCornerWarm from '../assets/ornaments/free/super-classic/corner-warm.svg?url'
import egFlourish from '../assets/ornaments/free/elegan-grey/flourish.svg?url'
import egFrame from '../assets/ornaments/free/elegan-grey/frame.svg?url'
import egFramePng from '../assets/ornaments/free/elegan-grey/frame-try.png?url'
import bfCorner from '../assets/ornaments/free/blue-flowers/corner.svg?url'
import scFrame from '../assets/ornaments/super-classic/photo-frame.svg?url'
import bfRing from '../assets/ornaments/blue-flowers/photo-ring.svg?url'
import bfDivider from '../assets/ornaments/blue-flowers/divider.svg?url'
import cdCorner from '../assets/ornaments/free/batch-2/corner-classic-pd.svg?url'
import cdLeaf from '../assets/ornaments/free/batch-2/orn-classic-leaf.svg?url'
import reRose from '../assets/ornaments/free/batch-2/orn-red-rose.svg?url'
import sbCrystal from '../assets/ornaments/free/batch-2/orn-snow-crystal.svg?url'
import spPetal from '../assets/ornaments/free/batch-2/orn-pink-petal.svg?url'
import batchFlourish from '../assets/ornaments/free/batch-2/flourish.svg?url'
import batchFrame from '../assets/ornaments/free/batch-2/frame-floral.png?url'

export const ORNAMENT_ASSETS = {
  scCorner,
  scCornerWarm,
  scFrame,
  egFlourish,
  egFrame,
  egFramePng,
  bfCorner,
  bfTop: bfCorner,
  bfBottom: bfCorner,
  bfRing,
  bfDivider,
  cdCorner,
  cdWarm: cdLeaf,
  cdLeaf,
  reCorner: reRose,
  reRose,
  sbCorner: sbCrystal,
  sbCrystal,
  spCorner: spPetal,
  spPetal,
  batchFlourish,
  batchFrame,
} as const
