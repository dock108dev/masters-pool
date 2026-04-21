import { useState, useEffect } from 'react';
import type { ClubConfig, ClubBranding } from '../types/domain';
import { apiClient } from '../api/client';

interface BrandingSettingsPageProps {
  clubConfig: ClubConfig;
}

const DEFAULT_PRIMARY = '#1e3a5f';
const DEFAULT_ACCENT = '#c9a84c';

export function BrandingSettingsPage({ clubConfig }: BrandingSettingsPageProps) {
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState(DEFAULT_PRIMARY);
  const [accentColor, setAccentColor] = useState(DEFAULT_ACCENT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    apiClient.getClubBranding(clubConfig.code).then((branding) => {
      setLogoUrl(branding.logo_url ?? '');
      setPrimaryColor(branding.primary_color ?? DEFAULT_PRIMARY);
      setAccentColor(branding.accent_color ?? DEFAULT_ACCENT);
    }).catch((err: unknown) => {
      console.warn('[BrandingSettings] Could not load branding; using defaults:', err);
    }).finally(() => {
      setLoading(false);
    });
  }, [clubConfig.code]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    const payload: Partial<ClubBranding> = {
      logo_url: logoUrl.trim() || null,
      primary_color: primaryColor,
      accent_color: accentColor,
    };

    try {
      await apiClient.updateClubBranding(clubConfig.code, payload);
      // Apply the saved colors immediately
      document.documentElement.style.setProperty('--club-primary', primaryColor);
      document.documentElement.style.setProperty('--club-accent', accentColor);
      setSaveSuccess(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save branding.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="main-content" data-testid="branding-settings">
        <p>Loading branding…</p>
      </div>
    );
  }

  return (
    <div className="main-content" data-testid="branding-settings">
      <h1>Branding Settings — {clubConfig.shortName}</h1>
      <p className="entry-subtitle">Customize the colors and logo shown to members.</p>

      <div className="branding-layout">
        <form onSubmit={handleSave} className="branding-form" data-testid="branding-form">
          <div className="form-group">
            <label htmlFor="logo-url">Logo URL</label>
            <input
              id="logo-url"
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.png"
              data-testid="logo-url-input"
            />
            <p className="field-hint">Leave blank to use no logo.</p>
          </div>

          <div className="form-group">
            <label htmlFor="primary-color">Primary Color</label>
            <div className="color-input-row">
              <input
                id="primary-color"
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                data-testid="primary-color-input"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => {
                  if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) setPrimaryColor(e.target.value);
                }}
                maxLength={7}
                className="color-hex-input"
                aria-label="Primary color hex value"
              />
            </div>
            <p className="field-hint">Used for the header, buttons, and qualification badges.</p>
          </div>

          <div className="form-group">
            <label htmlFor="accent-color">Accent Color</label>
            <div className="color-input-row">
              <input
                id="accent-color"
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                data-testid="accent-color-input"
              />
              <input
                type="text"
                value={accentColor}
                onChange={(e) => {
                  if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) setAccentColor(e.target.value);
                }}
                maxLength={7}
                className="color-hex-input"
                aria-label="Accent color hex value"
              />
            </div>
            <p className="field-hint">Used for the header title and accent highlights.</p>
          </div>

          {saveError && (
            <div className="submit-error" role="alert" data-testid="save-error">
              <p>{saveError}</p>
            </div>
          )}

          {saveSuccess && (
            <div className="save-success" role="status" data-testid="save-success">
              <p>Branding saved successfully.</p>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
            data-testid="save-branding-btn"
          >
            {saving ? 'Saving…' : 'Save Branding'}
          </button>
        </form>

        <div className="branding-preview" data-testid="branding-preview" aria-label="Live preview">
          <h2>Preview</h2>
          <div
            className="preview-header"
            style={{ background: primaryColor, color: '#fff', padding: '12px 20px', borderRadius: 8 }}
          >
            {logoUrl && (
              <img src={logoUrl} alt="Club logo preview" className="preview-logo" />
            )}
            <span style={{ color: accentColor, fontWeight: 800, fontSize: '1rem', textTransform: 'uppercase' }}>
              {clubConfig.shortName} Masters Pool
            </span>
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
            <button
              type="button"
              style={{ background: primaryColor, color: '#fff', border: 'none', borderRadius: 8,
                padding: '10px 20px', fontWeight: 600, cursor: 'default' }}
            >
              Submit Entry
            </button>
            <span
              style={{ background: primaryColor, color: '#fff', borderRadius: 4,
                padding: '3px 10px', fontWeight: 800, fontSize: '0.7rem' }}
            >
              Q
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
