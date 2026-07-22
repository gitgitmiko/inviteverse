import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './components/AuthProvider'
import {
  InvitationProvider,
  useOptionalInvitation,
} from './components/InvitationProvider'
import RequireAuth from './components/RequireAuth'
import CompareHome from './pages/CompareHome'
import LoginPage from './pages/Login'
import RegisterPage from './pages/Register'
import InvitationsPage from './pages/Invitations'
import AdminThemesPage from './pages/AdminThemes'
import AdminAssistPage from './pages/AdminAssist'
import AdminAssistEditorPage from './pages/AdminAssistEditor'
import PublicInvitation from './pages/PublicInvitation'
import PricingPage from './pages/Pricing'
import Editor from './pages/Editor'
import AdminEditor from './pages/AdminEditor'
import VersionA from './themes/super-classic-a/VersionA'
import EleganGrey from './themes/elegan-grey/EleganGrey'
import BlueFlowers from './themes/blue-flowers/BlueFlowers'
import NatureFamily from './themes/nature-family/NatureFamily'
import {
  getDefaultInvitation,
  setActiveTheme,
} from './lib/invitationStore'
import type { ThemeId } from './lib/themeTypes'
import './App.css'
import './components/themeBack.css'

function usePreviewData(themeId: ThemeId) {
  const inv = useOptionalInvitation()
  if (inv?.activeId) {
    return setActiveTheme(inv.data, themeId)
  }
  return setActiveTheme(getDefaultInvitation(), themeId)
}

function VersionAPage() {
  const data = usePreviewData('super-classic')
  return <VersionA data={data} />
}

function EleganGreyPage() {
  const data = usePreviewData('elegan-grey')
  return <EleganGrey data={data} />
}

function BlueFlowersPage() {
  const data = usePreviewData('blue-flowers')
  return <BlueFlowers data={data} />
}

function NatureFamilyPage({ themeId }: { themeId: ThemeId }) {
  const data = usePreviewData(themeId)
  return <NatureFamily themeId={themeId} data={data} />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <InvitationProvider>
          <Routes>
            <Route path="/" element={<CompareHome />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/invitations"
              element={
                <RequireAuth allow="user">
                  <InvitationsPage />
                </RequireAuth>
              }
            />
            <Route
              path="/themes"
              element={
                <RequireAuth allow="admin">
                  <AdminThemesPage />
                </RequireAuth>
              }
            />
            <Route
              path="/admin/assist"
              element={
                <RequireAuth allow="admin">
                  <AdminAssistPage />
                </RequireAuth>
              }
            />
            <Route
              path="/admin/assist/:invitationId"
              element={
                <RequireAuth allow="admin">
                  <AdminAssistEditorPage />
                </RequireAuth>
              }
            />
            <Route path="/harga" element={<PricingPage />} />
            <Route path="/i/:slug" element={<PublicInvitation />} />
            <Route path="/a" element={<VersionAPage />} />
            <Route path="/eg" element={<EleganGreyPage />} />
            <Route path="/bf" element={<BlueFlowersPage />} />
            <Route
              path="/cd"
              element={<NatureFamilyPage themeId="classic-devotion" />}
            />
            <Route
              path="/re"
              element={<NatureFamilyPage themeId="red-essence" />}
            />
            <Route
              path="/sb"
              element={<NatureFamilyPage themeId="snow-blue" />}
            />
            <Route
              path="/sp"
              element={<NatureFamilyPage themeId="snow-pink" />}
            />
            <Route
              path="/bp"
              element={<NatureFamilyPage themeId="burgundy-pure" />}
            />
            <Route
              path="/bb"
              element={<NatureFamilyPage themeId="bear-brown" />}
            />
            <Route
              path="/ig"
              element={<NatureFamilyPage themeId="infinite-gallop" />}
            />
            <Route
              path="/sm"
              element={<NatureFamilyPage themeId="sun-moon" />}
            />
            <Route
              path="/rm"
              element={<NatureFamilyPage themeId="royal-mega" />}
            />
            <Route
              path="/rr"
              element={<NatureFamilyPage themeId="retro-romance" />}
            />
            <Route
              path="/pr"
              element={<NatureFamilyPage themeId="padang-red" />}
            />
            <Route
              path="/np"
              element={<NatureFamilyPage themeId="nea-pure" />}
            />
            <Route
              path="/pe"
              element={<NatureFamilyPage themeId="pink-envelope" />}
            />
            <Route
              path="/je"
              element={<NatureFamilyPage themeId="java-emerald" />}
            />
            <Route
              path="/ja"
              element={<NatureFamilyPage themeId="java-atelier" />}
            />
            <Route
              path="/mr"
              element={<NatureFamilyPage themeId="maso-rustic" />}
            />
            <Route
              path="/ie"
              element={<NatureFamilyPage themeId="islamic-eternal" />}
            />
            <Route
              path="/is"
              element={<NatureFamilyPage themeId="islamic-serenity" />}
            />
            <Route
              path="/ip"
              element={<NatureFamilyPage themeId="islamic-pure" />}
            />
            <Route
              path="/cr"
              element={<NatureFamilyPage themeId="chinese-red" />}
            />
            <Route
              path="/edit"
              element={
                <RequireAuth allow="user">
                  <Editor />
                </RequireAuth>
              }
            />
            <Route
              path="/admin"
              element={
                <RequireAuth allow="admin">
                  <AdminEditor />
                </RequireAuth>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </InvitationProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
