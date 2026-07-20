import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import ThemePreview from '../components/ThemePreview'
import { useAuth } from '../components/AuthProvider'
import { useInvitation } from '../components/InvitationProvider'
import {
  scrollPreviewToSection,
  type PreviewFocusTarget,
} from '../components/useScrollPreviewToSection'
import { logout } from '../lib/authStore'
import {
  resetActiveThemeVisual,
  resetInvitationContent,
  setActiveTheme,
  type InvitationData,
} from '../lib/invitationStore'
import { THEME_LIST, THEME_REGISTRY } from '../lib/themeRegistry'
import type { ThemeId } from '../lib/themeTypes'
import { Field, ImageField } from './editorFields'
import './Editor.css'

type PanelId =
  | 'menu'
  | 'panggilan'
  | 'nama-acara'
  | 'data-pria'
  | 'data-wanita'
  | 'doa'
  | 'acara'
  | 'story'
  | 'countdown'
  | 'hadiah'
  | 'setting'

const NAV: { id: PanelId; label: string; desc: string }[] = [
  { id: 'panggilan', label: 'Panggilan Mempelai', desc: 'Nama panggilan di sampul' },
  { id: 'nama-acara', label: 'Nama Acara', desc: 'Judul undangan' },
  { id: 'data-pria', label: 'Data Pria', desc: 'Profil mempelai pria' },
  { id: 'data-wanita', label: 'Data Wanita', desc: 'Profil mempelai wanita' },
  { id: 'doa', label: 'Doa & Salam', desc: 'Ayat dan ucapan pembuka' },
  { id: 'acara', label: 'Data Acara', desc: 'Jadwal & lokasi' },
  { id: 'countdown', label: 'Hitung Mundur', desc: 'Tanggal countdown' },
  { id: 'story', label: 'Love Story', desc: 'Cerita pasangan' },
  { id: 'hadiah', label: 'Titip Hadiah', desc: 'Rekening & intro' },
  { id: 'setting', label: 'Pengaturan', desc: 'Tamu & sampul' },
]

const PANEL_FOCUS: Record<PanelId, PreviewFocusTarget | null> = {
  menu: null,
  panggilan: 'cover',
  'nama-acara': 'cover',
  setting: 'cover',
  'data-pria': 'couple',
  'data-wanita': 'couple',
  doa: 'intro',
  acara: 'events',
  countdown: 'hero',
  story: 'story',
  hadiah: 'gift',
}

export default function Editor() {
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
  const [panel, setPanel] = useState<PanelId>('menu')
  const [savedFlash, setSavedFlash] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [showCover, setShowCover] = useState(false)
  const [focusNonce, setFocusNonce] = useState(0)
  const previewRef = useRef<HTMLDivElement | null>(null)

  const focusSection = PANEL_FOCUS[panel]
  const previewForceOpen =
    panel === 'menu' ? !showCover : focusSection !== 'cover'

  const openPanel = (id: PanelId) => {
    setPanel(id)
    setFocusNonce((n) => n + 1)
  }

  const themeLabel =
    THEME_REGISTRY[data.activeTheme]?.label ?? data.activeTheme

  const onLogout = () => {
    void logout().then(() => navigate('/'))
  }

  useEffect(() => {
    if (!focusSection) return
    if (!previewRef.current) return

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

  const patch = (partial: Partial<InvitationData>) => {
    setData((prev) => ({ ...prev, ...partial }))
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
    if (
      !window.confirm(
        `Reset setelan visual tema "${themeLabel}" ke awal?\n\nHanya visual tema ini (ornamen, warna, dll). Konten teks/foto tetap.`,
      )
    ) {
      return
    }
    setData((prev) => resetActiveThemeVisual(prev))
  }

  const onResetContent = () => {
    if (
      !window.confirm(
        'Reset semua konten undangan (nama, foto, teks, acara) ke data awal?\n\nSetelan visual tiap tema tetap.',
      )
    ) {
      return
    }
    setData((prev) => resetInvitationContent(prev))
    setPanel('menu')
  }

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
    <div className="ed">
      <header className="ed__top">
        <Link to="/invitations" className="ed__link">
          ← Undanganku
        </Link>
        <div className="ed__top-title">
          <strong>Editor User · Konten</strong>
          <span>
            {user?.name ?? 'User'} · tema:{' '}
            {THEME_REGISTRY[data.activeTheme]?.label ?? data.activeTheme}
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
            title={`Reset visual ${themeLabel}`}
          >
            Reset tema
          </button>
          <button
            type="button"
            className="ed__ghost"
            onClick={onResetContent}
            title="Reset konten undangan"
          >
            Reset konten
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
            <span>Preview live</span>
            <select
              className="ed__theme-select"
              value={data.activeTheme}
              onChange={(e) =>
                setData((prev) =>
                  setActiveTheme(prev, e.target.value as ThemeId),
                )
              }
              aria-label="Tema preview"
            >
              {THEME_LIST.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="ed__ghost"
              onClick={() => setShowCover((v) => !v)}
            >
              {showCover ? 'Isi undangan' : 'Lihat sampul'}
            </button>
            <Link
              to={THEME_REGISTRY[data.activeTheme]?.route ?? '/a'}
              className="ed__ghost"
              target="_blank"
            >
              Pratinjau penuh
            </Link>
          </div>
          <div className="ed__preview" ref={previewRef} data-preview-root="1">
            <ThemePreview
              key={`${data.activeTheme}-${previewForceOpen}`}
              data={data}
              forceOpen={previewForceOpen}
              hideBack
              previewMode
              focusSection={focusSection}
              focusNonce={focusNonce}
            />
          </div>
        </aside>

        <section className={`ed__sheet ${panel !== 'menu' ? 'is-open' : ''}`}>
          {panel === 'menu' ? (
            <div className="ed__menu">
              <p className="ed__role-badge">Mode User</p>
              <h2>Komponen Undangan</h2>
              <p className="ed__hint">
                Edit teks & foto mempelai. Untuk ornamen/warna/background,
                masuk sebagai akun admin.
              </p>
              <div className="ed__menu-list">
                {NAV.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="ed__menu-item"
                    onClick={() => openPanel(item.id)}
                  >
                    <strong>{item.label}</strong>
                    <span>{item.desc}</span>
                  </button>
                ))}
              </div>
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
                <h2>{NAV.find((n) => n.id === panel)?.label}</h2>
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
                {panel === 'panggilan' && (
                  <>
                    <Field label="Panggilan Pria">
                      <input
                        value={data.groomNickname}
                        onChange={(e) =>
                          patch({ groomNickname: e.target.value })
                        }
                      />
                    </Field>
                    <Field label="Panggilan Wanita">
                      <input
                        value={data.brideNickname}
                        onChange={(e) =>
                          patch({ brideNickname: e.target.value })
                        }
                      />
                    </Field>
                    <Field label="Judul sampul">
                      <input
                        value={data.coverTitle}
                        onChange={(e) => patch({ coverTitle: e.target.value })}
                      />
                    </Field>
                  </>
                )}

                {panel === 'nama-acara' && (
                  <>
                    <Field label="Nama Acara">
                      <input
                        value={data.eventTitle}
                        onChange={(e) => patch({ eventTitle: e.target.value })}
                      />
                    </Field>
                    <Field label="Ucapan sampul">
                      <textarea
                        rows={3}
                        value={data.coverMessage}
                        onChange={(e) =>
                          patch({ coverMessage: e.target.value })
                        }
                      />
                    </Field>
                    <Field label="Ucapan penutup harapan">
                      <textarea
                        rows={3}
                        value={data.closingHope}
                        onChange={(e) => patch({ closingHope: e.target.value })}
                      />
                    </Field>
                  </>
                )}

                {panel === 'data-pria' && (
                  <>
                    <Field label="Nama lengkap">
                      <input
                        value={data.groom.fullName}
                        onChange={(e) =>
                          patch({
                            groom: { ...data.groom, fullName: e.target.value },
                          })
                        }
                      />
                    </Field>
                    <Field label="Ayah">
                      <input
                        value={data.groom.father}
                        onChange={(e) =>
                          patch({
                            groom: { ...data.groom, father: e.target.value },
                          })
                        }
                      />
                    </Field>
                    <Field label="Ibu">
                      <input
                        value={data.groom.mother}
                        onChange={(e) =>
                          patch({
                            groom: { ...data.groom, mother: e.target.value },
                          })
                        }
                      />
                    </Field>
                    <Field label="Alamat">
                      <input
                        value={data.groom.address}
                        onChange={(e) =>
                          patch({
                            groom: { ...data.groom, address: e.target.value },
                          })
                        }
                      />
                    </Field>
                    <Field label="Instagram">
                      <input
                        value={data.groom.instagram}
                        onChange={(e) =>
                          patch({
                            groom: {
                              ...data.groom,
                              instagram: e.target.value,
                            },
                          })
                        }
                      />
                    </Field>
                    <ImageField
                      label="Foto pria"
                      value={data.groom.photo}
                      invitationId={activeId}
                      onChange={(photo) =>
                        patch({ groom: { ...data.groom, photo } })
                      }
                    />
                  </>
                )}

                {panel === 'data-wanita' && (
                  <>
                    <Field label="Nama lengkap">
                      <input
                        value={data.bride.fullName}
                        onChange={(e) =>
                          patch({
                            bride: { ...data.bride, fullName: e.target.value },
                          })
                        }
                      />
                    </Field>
                    <Field label="Ayah">
                      <input
                        value={data.bride.father}
                        onChange={(e) =>
                          patch({
                            bride: { ...data.bride, father: e.target.value },
                          })
                        }
                      />
                    </Field>
                    <Field label="Ibu">
                      <input
                        value={data.bride.mother}
                        onChange={(e) =>
                          patch({
                            bride: { ...data.bride, mother: e.target.value },
                          })
                        }
                      />
                    </Field>
                    <Field label="Alamat">
                      <input
                        value={data.bride.address}
                        onChange={(e) =>
                          patch({
                            bride: { ...data.bride, address: e.target.value },
                          })
                        }
                      />
                    </Field>
                    <Field label="Instagram">
                      <input
                        value={data.bride.instagram}
                        onChange={(e) =>
                          patch({
                            bride: {
                              ...data.bride,
                              instagram: e.target.value,
                            },
                          })
                        }
                      />
                    </Field>
                    <ImageField
                      label="Foto wanita"
                      value={data.bride.photo}
                      invitationId={activeId}
                      onChange={(photo) =>
                        patch({ bride: { ...data.bride, photo } })
                      }
                    />
                  </>
                )}

                {panel === 'doa' && (
                  <>
                    <Field label="Ayat (Arab)">
                      <textarea
                        rows={3}
                        value={data.verse.arabic}
                        onChange={(e) =>
                          patch({
                            verse: { ...data.verse, arabic: e.target.value },
                          })
                        }
                      />
                    </Field>
                    <Field label="Terjemahan">
                      <textarea
                        rows={4}
                        value={data.verse.translation}
                        onChange={(e) =>
                          patch({
                            verse: {
                              ...data.verse,
                              translation: e.target.value,
                            },
                          })
                        }
                      />
                    </Field>
                    <Field label="Sumber">
                      <input
                        value={data.verse.source}
                        onChange={(e) =>
                          patch({
                            verse: { ...data.verse, source: e.target.value },
                          })
                        }
                      />
                    </Field>
                    <Field label="Salam">
                      <input
                        value={data.salam}
                        onChange={(e) => patch({ salam: e.target.value })}
                      />
                    </Field>
                    <Field label="Ucapan pembuka">
                      <textarea
                        rows={4}
                        value={data.intro}
                        onChange={(e) => patch({ intro: e.target.value })}
                      />
                    </Field>
                  </>
                )}

                {panel === 'acara' && (
                  <>
                    {data.events.map((ev, i) => (
                      <div key={i} className="ed__group">
                        <h3>Acara {i + 1}</h3>
                        <Field label="Judul">
                          <input
                            value={ev.title}
                            onChange={(e) => {
                              const events = [...data.events]
                              events[i] = { ...ev, title: e.target.value }
                              patch({ events })
                            }}
                          />
                        </Field>
                        <Field label="Tanggal">
                          <input
                            value={ev.date}
                            onChange={(e) => {
                              const events = [...data.events]
                              events[i] = { ...ev, date: e.target.value }
                              patch({ events })
                            }}
                          />
                        </Field>
                        <Field label="Waktu">
                          <input
                            value={ev.time}
                            onChange={(e) => {
                              const events = [...data.events]
                              events[i] = { ...ev, time: e.target.value }
                              patch({ events })
                            }}
                          />
                        </Field>
                        <Field label="Tempat">
                          <input
                            value={ev.place}
                            onChange={(e) => {
                              const events = [...data.events]
                              events[i] = { ...ev, place: e.target.value }
                              patch({ events })
                            }}
                          />
                        </Field>
                        <Field label="Maps URL">
                          <input
                            value={ev.mapsUrl}
                            onChange={(e) => {
                              const events = [...data.events]
                              events[i] = { ...ev, mapsUrl: e.target.value }
                              patch({ events })
                            }}
                          />
                        </Field>
                      </div>
                    ))}
                  </>
                )}

                {panel === 'countdown' && (
                  <Field label="Tanggal countdown (ISO)">
                    <input
                      type="datetime-local"
                      value={data.countdownTarget.slice(0, 16)}
                      onChange={(e) =>
                        patch({
                          countdownTarget: `${e.target.value}:00+07:00`,
                        })
                      }
                    />
                  </Field>
                )}

                {panel === 'story' && (
                  <>
                    <Field label="Judul">
                      <input
                        value={data.story.title}
                        onChange={(e) =>
                          patch({
                            story: { ...data.story, title: e.target.value },
                          })
                        }
                      />
                    </Field>
                    <Field label="Subjudul">
                      <input
                        value={data.story.subtitle}
                        onChange={(e) =>
                          patch({
                            story: { ...data.story, subtitle: e.target.value },
                          })
                        }
                      />
                    </Field>
                    {data.story.items.map((item, i) => (
                      <div key={i} className="ed__group">
                        <h3>Cerita {i + 1}</h3>
                        <Field label="Judul">
                          <input
                            value={item.title}
                            onChange={(e) => {
                              const items = [...data.story.items]
                              items[i] = { ...item, title: e.target.value }
                              patch({ story: { ...data.story, items } })
                            }}
                          />
                        </Field>
                        <Field label="Tanggal">
                          <input
                            value={item.date}
                            onChange={(e) => {
                              const items = [...data.story.items]
                              items[i] = { ...item, date: e.target.value }
                              patch({ story: { ...data.story, items } })
                            }}
                          />
                        </Field>
                        <Field label="Isi">
                          <textarea
                            rows={4}
                            value={item.text}
                            onChange={(e) => {
                              const items = [...data.story.items]
                              items[i] = { ...item, text: e.target.value }
                              patch({ story: { ...data.story, items } })
                            }}
                          />
                        </Field>
                      </div>
                    ))}
                  </>
                )}

                {panel === 'hadiah' && (
                  <>
                    <Field label="Intro hadiah">
                      <textarea
                        rows={4}
                        value={data.gift.intro}
                        onChange={(e) =>
                          patch({
                            gift: { ...data.gift, intro: e.target.value },
                          })
                        }
                      />
                    </Field>
                    {data.gift.accounts.map((acc, i) => (
                      <div key={i} className="ed__group">
                        <h3>Rekening {i + 1}</h3>
                        <Field label="Bank">
                          <input
                            value={acc.bank}
                            onChange={(e) => {
                              const accounts = [...data.gift.accounts]
                              accounts[i] = { ...acc, bank: e.target.value }
                              patch({ gift: { ...data.gift, accounts } })
                            }}
                          />
                        </Field>
                        <Field label="Nomor">
                          <input
                            value={acc.number}
                            onChange={(e) => {
                              const accounts = [...data.gift.accounts]
                              accounts[i] = { ...acc, number: e.target.value }
                              patch({ gift: { ...data.gift, accounts } })
                            }}
                          />
                        </Field>
                        <Field label="Atas nama">
                          <input
                            value={acc.name}
                            onChange={(e) => {
                              const accounts = [...data.gift.accounts]
                              accounts[i] = { ...acc, name: e.target.value }
                              patch({ gift: { ...data.gift, accounts } })
                            }}
                          />
                        </Field>
                      </div>
                    ))}
                  </>
                )}

                {panel === 'setting' && (
                  <>
                    <Field label="Tema undangan">
                      <select
                        value={data.activeTheme}
                        onChange={(e) =>
                          setData((prev) =>
                            setActiveTheme(prev, e.target.value as ThemeId),
                          )
                        }
                      >
                        {THEME_LIST.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <p className="ed__hint">
                      Font mengikuti tema (
                      {THEME_REGISTRY[data.activeTheme]?.fonts.display}). Visual
                      (ornamen/warna) diatur di Admin.
                    </p>
                    <Field label="Nama tamu default (kpd)">
                      <input
                        value={data.guestName}
                        onChange={(e) => patch({ guestName: e.target.value })}
                      />
                    </Field>
                    <ImageField
                      label="Foto sampul"
                      value={data.coverPhoto}
                      invitationId={activeId}
                      onChange={(coverPhoto) => patch({ coverPhoto })}
                    />
                    <Field label="URL musik (MP3 atau YouTube)">
                      <input
                        value={data.musicUrl}
                        onChange={(e) => patch({ musicUrl: e.target.value })}
                        placeholder="https://youtube.com/watch?v=... atau link .mp3"
                      />
                    </Field>
                    <p className="ed__hint">
                      YouTube didukung (link watch / youtu.be). Musik mulai
                      setelah tamu menekan Buka Sampul. Beberapa video YouTube
                      memblokir embed — jika tidak bunyi, pakai video lain atau
                      file MP3.
                    </p>
                    <Field label="Teks terima kasih">
                      <input
                        value={data.thanks}
                        onChange={(e) => patch({ thanks: e.target.value })}
                      />
                    </Field>
                  </>
                )}
              </div>
            </div>
          )}
        </section>
      </div>

      <nav className="ed__dock">
        <button type="button" onClick={() => setPanel('menu')}>
          Komponen
        </button>
        <button type="button" onClick={() => openPanel('setting')}>
          Pengaturan
        </button>
        <Link to="/invitations">Undanganku</Link>
        <Link
          to={
            activeRow?.status === 'published'
              ? `/i/${activeRow.slug}`
              : THEME_REGISTRY[data.activeTheme]?.route ?? '/a'
          }
        >
          Pratinjau
        </Link>
      </nav>
    </div>
  )
}
