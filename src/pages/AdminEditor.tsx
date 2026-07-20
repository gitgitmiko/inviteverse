import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import ThemePreview from '../components/ThemePreview'
import { useAuth } from '../components/AuthProvider'
import { useInvitation } from '../components/InvitationProvider'
import { scrollPreviewToSection } from '../components/useScrollPreviewToSection'
import { logout } from '../lib/authStore'
import {
  getActiveVisual,
  getDefaultInvitation,
  patchActiveThemeVisual,
  resetActiveThemeVisual,
  setActiveTheme,
} from '../lib/invitationStore'
import {
  SECTION_LABELS,
  THEME_LIST,
  THEME_REGISTRY,
} from '../lib/themeRegistry'
import type { SectionId, ThemeId, ThemeVisualStyle } from '../lib/themeTypes'
import {
  ColorField,
  Field,
  ImageField,
  OrnamentListEditor,
  TransformField,
} from './editorFields'
import './Editor.css'

type AdminPanel = 'menu' | 'warna' | 'cover' | 'section'

export default function AdminEditor() {
  const user = useAuth()
  const navigate = useNavigate()
  const {
    data,
    updateData: setData,
    save,
    saving,
    activeId,
    activeRow,
    loading,
    error: invError,
  } = useInvitation()
  const [panel, setPanel] = useState<AdminPanel>('menu')
  const [sectionId, setSectionId] = useState<SectionId>('couple')
  const [savedFlash, setSavedFlash] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [showCover, setShowCover] = useState(true)
  const [focusNonce, setFocusNonce] = useState(0)
  const previewRef = useRef<HTMLDivElement | null>(null)

  const bumpFocus = () => setFocusNonce((n) => n + 1)

  const onLogout = () => {
    void logout().then(() => navigate('/'))
  }

  const openPanel = (next: AdminPanel) => {
    setPanel(next)
    if (next === 'cover') {
      setShowCover(true)
      bumpFocus()
    } else if (next === 'section') {
      setShowCover(false)
      bumpFocus()
    }
  }

  const previewForceOpen =
    panel === 'cover' ? false : panel === 'section' ? true : !showCover

  const focusSection =
    panel === 'cover' ? ('cover' as const) : panel === 'section' ? sectionId : null

  useEffect(() => {
    if (!focusSection) return
    const root = previewRef.current
    if (!root) return

    let cancelled = false
    let attempts = 0

    const tryScroll = () => {
      if (cancelled || !previewRef.current) return
      const ok = scrollPreviewToSection(previewRef.current, focusSection)
      if (!ok && attempts < 24) {
        attempts += 1
        window.setTimeout(tryScroll, 50 + attempts * 10)
      }
    }

    const t = window.setTimeout(() => {
      requestAnimationFrame(() => requestAnimationFrame(tryScroll))
    }, 80)

    return () => {
      cancelled = true
      window.clearTimeout(t)
    }
  }, [focusSection, focusNonce, previewForceOpen, data.activeTheme])

  const visual = useMemo(() => getActiveVisual(data), [data])
  const meta = THEME_REGISTRY[data.activeTheme]

  const patchVisual = (partial: Partial<ThemeVisualStyle>) => {
    setData((prev) => patchActiveThemeVisual(prev, partial))
  }

  const flashSave = async () => {
    setSaveError(null)
    try {
      await save()
      setSavedFlash(true)
      window.setTimeout(() => setSavedFlash(false), 1200)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Gagal menyimpan')
    }
  }

  const onResetTheme = () => {
    const label = meta.label
    if (
      !window.confirm(
        `Reset setelan visual tema "${label}" ke awal?\n\nOrnamen, warna, background, dan bingkai tema ini saja yang dikembalikan. Tema lain & konten undangan tetap.`,
      )
    ) {
      return
    }
    setData((prev) => resetActiveThemeVisual(prev))
  }

  const onResetAll = () => {
    if (!window.confirm('Reset SEMUA data & visual semua tema ke default?')) return
    setData(getDefaultInvitation())
    setPanel('menu')
  }

  const onThemeChange = (id: ThemeId) => {
    setData((prev) => setActiveTheme(prev, id))
  }

  const section = visual.sections[sectionId]

  if (loading) {
    return (
      <div className="ed" style={{ placeContent: 'center', minHeight: '100dvh' }}>
        <p style={{ textAlign: 'center', color: '#6b635a' }}>Memuat undangan…</p>
      </div>
    )
  }

  if (!activeId) {
    return <Navigate to="/invitations" replace />
  }

  return (
    <div className="ed ed--admin">
      <header className="ed__top">
        <Link to="/invitations" className="ed__link">
          ← Undanganku
        </Link>
        <div className="ed__top-title">
          <strong>Admin · Tema & Aset</strong>
          <span>
            {user?.name ?? 'Admin'} · {meta.label} · font {meta.fonts.display} /{' '}
            {meta.fonts.body}
            {activeRow?.status === 'published' ? ' · published' : ' · draft'}
          </span>
        </div>
        <div className="ed__top-actions">
          <Link to="/invitations" className="ed__ghost">
            Undanganku
          </Link>
          <button
            type="button"
            className="ed__ghost"
            onClick={onResetTheme}
            title={`Reset setelan ${meta.label} ke awal`}
          >
            Reset tema
          </button>
          <button type="button" className="ed__ghost" onClick={onLogout}>
            Keluar
          </button>
          <button
            type="button"
            className="ed__save"
            disabled={saving}
            onClick={() => void flashSave()}
          >
            {savedFlash ? 'Tersimpan' : saving ? 'Menyimpan…' : 'Simpan'}
          </button>
        </div>
      </header>
      {(saveError || invError) && (
        <p
          style={{
            margin: 0,
            padding: '0.5rem 1rem',
            background: '#f8e8e6',
            color: '#7a2e28',
            fontSize: '0.85rem',
          }}
        >
          {saveError || invError}
        </p>
      )}

      <div className="ed__body">
        <aside className="ed__preview-wrap">
          <div className="ed__preview-bar">
            <span>Preview · {meta.label}</span>
            <button
              type="button"
              className="ed__ghost"
              onClick={() => setShowCover((v) => !v)}
            >
              {showCover ? 'Isi undangan' : 'Lihat sampul'}
            </button>
          </div>
          <div className="ed__preview" ref={previewRef} data-preview-root="1">
            <ThemePreview
              key={`admin-${data.activeTheme}-${previewForceOpen}`}
              data={data}
              forceOpen={previewForceOpen}
              hideBack
              previewMode
              focusSection={focusSection}
              focusNonce={focusNonce}
            />
          </div>
        </aside>

        <section className="ed__sheet is-open">
          {panel === 'menu' ? (
            <div className="ed__menu">
              <p className="ed__role-badge">Mode Admin</p>
              <h2>Kelola tampilan tema</h2>

              <Field label="Tema aktif">
                <select
                  value={data.activeTheme}
                  onChange={(e) => onThemeChange(e.target.value as ThemeId)}
                >
                  {THEME_LIST.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </Field>
              <p className="ed__hint">
                Font terkunci: <strong>{meta.fonts.display}</strong>,{' '}
                <strong>{meta.fonts.script}</strong>,{' '}
                <strong>{meta.fonts.body}</strong>. Slot kosong = default tema.
                Gunakan <strong>Reset tema</strong> untuk mengembalikan hanya tema
                yang sedang dipilih.
              </p>
              <button
                type="button"
                className="ed__ghost"
                onClick={onResetTheme}
                style={{ marginBottom: '0.75rem' }}
              >
                Reset tema “{meta.label}” ke awal
              </button>

              <div className="ed__menu-list">
                <button
                  type="button"
                  className="ed__menu-item"
                  onClick={() => openPanel('warna')}
                >
                  <strong>Warna global</strong>
                  <span>Accent, teks, background default</span>
                </button>
                <button
                  type="button"
                  className="ed__menu-item"
                  onClick={() => openPanel('cover')}
                >
                  <strong>Cover (halaman depan)</strong>
                  <span>Ornamen, bingkai, background, warna teks</span>
                </button>
                <button
                  type="button"
                  className="ed__menu-item"
                  onClick={() => openPanel('section')}
                >
                  <strong>Section isi undangan</strong>
                  <span>Ornamen, background, bingkai per section</span>
                </button>
              </div>

              <p className="ed__hint" style={{ marginTop: '1.25rem' }}>
                Zona berbahaya
              </p>
              <button type="button" className="ed__ghost" onClick={onResetAll}>
                Reset semua data & semua tema
              </button>
            </div>
          ) : (
            <div className="ed__panel">
              <div className="ed__panel-head">
                <button
                  type="button"
                  className="ed__ghost"
                  onClick={() => setPanel('menu')}
                >
                  ← Kembali
                </button>
                <h2>
                  {panel === 'warna' && 'Warna global'}
                  {panel === 'cover' && 'Cover'}
                  {panel === 'section' && 'Section'}
                </h2>
                <button
                  type="button"
                  className="ed__save"
                  disabled={saving}
                  onClick={() => void flashSave()}
                >
                  Simpan
                </button>
              </div>

              <div className="ed__panel-body">
                {panel === 'warna' && (
                  <>
                    <ColorField
                      label="Accent"
                      value={visual.colors.accent}
                      onChange={(accent) =>
                        patchVisual({
                          colors: { ...visual.colors, accent },
                        })
                      }
                    />
                    <ColorField
                      label="Gold / aksen sekunder"
                      value={visual.colors.gold}
                      onChange={(gold) =>
                        patchVisual({ colors: { ...visual.colors, gold } })
                      }
                    />
                    <ColorField
                      label="Background"
                      value={visual.colors.bg}
                      onChange={(bg) =>
                        patchVisual({ colors: { ...visual.colors, bg } })
                      }
                    />
                    <ColorField
                      label="Teks utama"
                      value={visual.colors.ink}
                      onChange={(ink) =>
                        patchVisual({ colors: { ...visual.colors, ink } })
                      }
                    />
                    <ColorField
                      label="Teks sekunder"
                      value={visual.colors.muted}
                      onChange={(muted) =>
                        patchVisual({ colors: { ...visual.colors, muted } })
                      }
                    />
                    <ColorField
                      label="Kartu / box"
                      value={visual.colors.card}
                      onChange={(card) =>
                        patchVisual({ colors: { ...visual.colors, card } })
                      }
                    />
                    {meta.hasPetals && (
                      <label className="ed-check">
                        <input
                          type="checkbox"
                          checked={visual.showPetals}
                          onChange={(e) =>
                            patchVisual({ showPetals: e.target.checked })
                          }
                        />
                        Tampilkan kelopak jatuh
                      </label>
                    )}
                  </>
                )}

                {panel === 'cover' && (
                  <>
                    <p className="ed__hint">Halaman depan sebelum undangan dibuka.</p>
                    <Field label="Background cover">
                      <select
                        value={visual.cover.background.mode}
                        onChange={(e) =>
                          patchVisual({
                            cover: {
                              ...visual.cover,
                              background: {
                                ...visual.cover.background,
                                mode: e.target.value as 'color' | 'image',
                              },
                            },
                          })
                        }
                      >
                        <option value="color">Warna</option>
                        <option value="image">Gambar</option>
                      </select>
                    </Field>
                    {visual.cover.background.mode === 'color' ? (
                      <ColorField
                        label="Warna background"
                        value={
                          visual.cover.background.color || visual.colors.bg
                        }
                        onChange={(color) =>
                          patchVisual({
                            cover: {
                              ...visual.cover,
                              background: {
                                ...visual.cover.background,
                                color,
                              },
                            },
                          })
                        }
                      />
                    ) : (
                      <ImageField
                      invitationId={activeId}
                        label="Gambar background"
                        value={visual.cover.background.image}
                        onChange={(image) =>
                          patchVisual({
                            cover: {
                              ...visual.cover,
                              background: {
                                ...visual.cover.background,
                                mode: 'image',
                                image,
                              },
                            },
                          })
                        }
                      />
                    )}
                    <OrnamentListEditor
                      invitationId={activeId}
                      ornaments={visual.cover.ornaments ?? []}
                      onChange={(ornaments) =>
                        patchVisual({
                          cover: { ...visual.cover, ornaments },
                        })
                      }
                    />
                    <ImageField
                      invitationId={activeId}
                      label="Bingkai foto sampul"
                      value={visual.cover.photoFrame}
                      onChange={(photoFrame) =>
                        patchVisual({
                          cover: { ...visual.cover, photoFrame },
                        })
                      }
                    />
                    {visual.cover.photoFrame ? (
                      <TransformField
                        label="Posisi & ukuran bingkai sampul"
                        value={visual.cover.photoFrameTransform}
                        onChange={(photoFrameTransform) =>
                          patchVisual({
                            cover: { ...visual.cover, photoFrameTransform },
                          })
                        }
                      />
                    ) : null}
                    <ColorField
                      label="Warna eyebrow"
                      value={
                        visual.cover.textColors.eyebrow || visual.colors.muted
                      }
                      onChange={(eyebrow) =>
                        patchVisual({
                          cover: {
                            ...visual.cover,
                            textColors: {
                              ...visual.cover.textColors,
                              eyebrow,
                            },
                          },
                        })
                      }
                    />
                    <ColorField
                      label="Warna nama"
                      value={visual.cover.textColors.name || visual.colors.accent}
                      onChange={(name) =>
                        patchVisual({
                          cover: {
                            ...visual.cover,
                            textColors: { ...visual.cover.textColors, name },
                          },
                        })
                      }
                    />
                    <ColorField
                      label="Warna tamu"
                      value={
                        visual.cover.textColors.guest || visual.colors.muted
                      }
                      onChange={(guest) =>
                        patchVisual({
                          cover: {
                            ...visual.cover,
                            textColors: { ...visual.cover.textColors, guest },
                          },
                        })
                      }
                    />
                    <ColorField
                      label="Warna tombol"
                      value={
                        visual.cover.textColors.buttonBg || visual.colors.accent
                      }
                      onChange={(buttonBg) =>
                        patchVisual({
                          cover: {
                            ...visual.cover,
                            textColors: {
                              ...visual.cover.textColors,
                              buttonBg,
                            },
                          },
                        })
                      }
                    />

                    {meta.hasCoverCorners && (
                      <>
                        <p className="ed__hint">
                          Super-Classic: pojok ornamen (mode gambar menonaktifkan SVG).
                        </p>
                        <Field label="Mode pojok">
                          <select
                            value={visual.ornamentMode}
                            onChange={(e) =>
                              patchVisual({
                                ornamentMode: e.target.value as 'svg' | 'image',
                              })
                            }
                          >
                            <option value="svg">SVG bawaan</option>
                            <option value="image">Gambar custom</option>
                          </select>
                        </Field>
                        {visual.ornamentMode === 'image' && (
                          <>
                            <ImageField
                      invitationId={activeId}
                              label="Pojok kiri atas"
                              value={visual.cover.corners.topLeft}
                              onChange={(topLeft) =>
                                patchVisual({
                                  cover: {
                                    ...visual.cover,
                                    corners: {
                                      ...visual.cover.corners,
                                      topLeft,
                                    },
                                  },
                                })
                              }
                            />
                            <ImageField
                      invitationId={activeId}
                              label="Pojok kanan atas"
                              value={visual.cover.corners.topRight}
                              onChange={(topRight) =>
                                patchVisual({
                                  cover: {
                                    ...visual.cover,
                                    corners: {
                                      ...visual.cover.corners,
                                      topRight,
                                    },
                                  },
                                })
                              }
                            />
                            <ImageField
                      invitationId={activeId}
                              label="Pojok kiri bawah"
                              value={visual.cover.corners.bottomLeft}
                              onChange={(bottomLeft) =>
                                patchVisual({
                                  cover: {
                                    ...visual.cover,
                                    corners: {
                                      ...visual.cover.corners,
                                      bottomLeft,
                                    },
                                  },
                                })
                              }
                            />
                            <ImageField
                      invitationId={activeId}
                              label="Pojok kanan bawah"
                              value={visual.cover.corners.bottomRight}
                              onChange={(bottomRight) =>
                                patchVisual({
                                  cover: {
                                    ...visual.cover,
                                    corners: {
                                      ...visual.cover.corners,
                                      bottomRight,
                                    },
                                  },
                                })
                              }
                            />
                          </>
                        )}
                      </>
                    )}
                  </>
                )}

                {panel === 'section' && (
                  <>
                    <Field label="Pilih section">
                      <select
                        value={sectionId}
                        onChange={(e) => {
                          setSectionId(e.target.value as SectionId)
                          setShowCover(false)
                          bumpFocus()
                        }}
                      >
                        {meta.sections.map((id) => (
                          <option key={id} value={id}>
                            {SECTION_LABELS[id]}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Background">
                      <select
                        value={section.background.mode}
                        onChange={(e) =>
                          patchVisual({
                            sections: {
                              ...visual.sections,
                              [sectionId]: {
                                ...section,
                                background: {
                                  ...section.background,
                                  mode: e.target.value as 'color' | 'image',
                                },
                              },
                            },
                          })
                        }
                      >
                        <option value="color">Warna</option>
                        <option value="image">Gambar</option>
                      </select>
                    </Field>
                    {section.background.mode === 'color' ? (
                      <ColorField
                        label="Warna background section"
                        value={section.background.color || visual.colors.bg}
                        onChange={(color) =>
                          patchVisual({
                            sections: {
                              ...visual.sections,
                              [sectionId]: {
                                ...section,
                                background: {
                                  ...section.background,
                                  color,
                                },
                              },
                            },
                          })
                        }
                      />
                    ) : (
                      <ImageField
                      invitationId={activeId}
                        label="Gambar background section"
                        value={section.background.image}
                        onChange={(image) =>
                          patchVisual({
                            sections: {
                              ...visual.sections,
                              [sectionId]: {
                                ...section,
                                background: {
                                  ...section.background,
                                  mode: 'image',
                                  image,
                                },
                              },
                            },
                          })
                        }
                      />
                    )}
                    <OrnamentListEditor
                      invitationId={activeId}
                      ornaments={section.ornaments ?? []}
                      onChange={(ornaments) =>
                        patchVisual({
                          sections: {
                            ...visual.sections,
                            [sectionId]: { ...section, ornaments },
                          },
                        })
                      }
                    />
                    <ColorField
                      label="Warna teks section (opsional)"
                      value={section.textColor || visual.colors.ink}
                      onChange={(textColor) =>
                        patchVisual({
                          sections: {
                            ...visual.sections,
                            [sectionId]: { ...section, textColor },
                          },
                        })
                      }
                    />
                    {sectionId === 'couple' && (
                      <>
                        <ImageField
                      invitationId={activeId}
                          label="Bingkai foto pria"
                          value={section.frames.groom}
                          onChange={(groom) =>
                            patchVisual({
                              sections: {
                                ...visual.sections,
                                [sectionId]: {
                                  ...section,
                                  frames: { ...section.frames, groom },
                                },
                              },
                            })
                          }
                        />
                        {section.frames.groom ? (
                          <TransformField
                            label="Posisi & ukuran bingkai pria"
                            value={section.framesTransform?.groom}
                            onChange={(groom) =>
                              patchVisual({
                                sections: {
                                  ...visual.sections,
                                  [sectionId]: {
                                    ...section,
                                    framesTransform: {
                                      ...section.framesTransform,
                                      groom,
                                    },
                                  },
                                },
                              })
                            }
                          />
                        ) : null}
                        <ImageField
                      invitationId={activeId}
                          label="Bingkai foto wanita"
                          value={section.frames.bride}
                          onChange={(bride) =>
                            patchVisual({
                              sections: {
                                ...visual.sections,
                                [sectionId]: {
                                  ...section,
                                  frames: { ...section.frames, bride },
                                },
                              },
                            })
                          }
                        />
                        {section.frames.bride ? (
                          <TransformField
                            label="Posisi & ukuran bingkai wanita"
                            value={section.framesTransform?.bride}
                            onChange={(bride) =>
                              patchVisual({
                                sections: {
                                  ...visual.sections,
                                  [sectionId]: {
                                    ...section,
                                    framesTransform: {
                                      ...section.framesTransform,
                                      bride,
                                    },
                                  },
                                },
                              })
                            }
                          />
                        ) : null}
                      </>
                    )}
                    {(sectionId === 'hero' || sectionId === 'couple') && (
                      <>
                      <ImageField
                      invitationId={activeId}
                        label="Bingkai foto tambahan"
                        value={section.frames.cover}
                        onChange={(cover) =>
                          patchVisual({
                            sections: {
                              ...visual.sections,
                              [sectionId]: {
                                ...section,
                                frames: { ...section.frames, cover },
                              },
                            },
                          })
                        }
                      />
                      {section.frames.cover ? (
                        <TransformField
                          label="Posisi & ukuran bingkai tambahan"
                          value={section.framesTransform?.cover}
                          onChange={(cover) =>
                            patchVisual({
                              sections: {
                                ...visual.sections,
                                [sectionId]: {
                                  ...section,
                                  framesTransform: {
                                    ...section.framesTransform,
                                    cover,
                                  },
                                },
                              },
                            })
                          }
                        />
                      ) : null}
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </section>
      </div>

      <nav className="ed__dock">
        <button type="button" onClick={() => setPanel('menu')}>
          Menu
        </button>
        <button type="button" onClick={() => openPanel('warna')}>
          Warna
        </button>
        <button type="button" onClick={() => openPanel('cover')}>
          Cover
        </button>
        <button type="button" onClick={() => openPanel('section')}>
          Section
        </button>
        <Link to="/invitations">Undanganku</Link>
      </nav>
    </div>
  )
}
