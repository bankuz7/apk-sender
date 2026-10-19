'use client';

import { useState, useRef } from 'react';
import { upload } from '@vercel/blob/client';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const selectFile = (f: File) => {
    if (!f.name.toLowerCase().endsWith('.apk')) {
      setError('Sirf .apk files allowed!');
      return;
    }
    if (f.size > 200 * 1024 * 1024) {
      setError('Max 200MB allowed');
      return;
    }
    setError(null);
    setFile(f);
    setDownloadUrl(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(0);
    setError(null);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const blob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/upload',
        multipart: true,
        contentType: 'application/vnd.android.package-archive',
        abortSignal: controller.signal,
        onUploadProgress: (e) => {
          if (e.percentage) setProgress(Math.round(e.percentage));
        },
      });
      setProgress(100);
      setDownloadUrl(blob.url);
    } catch (err: any) {
      if (!controller.signal.aborted) {
        setError(err.message || 'Upload failed. Try again.');
      }
    } finally {
      setUploading(false);
      abortRef.current = null;
    }
  };

  const cancel = () => abortRef.current?.abort();

  const copy = async () => {
    if (!downloadUrl) return;
    await navigator.clipboard.writeText(downloadUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const share = async () => {
    if (!downloadUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'APK Download', url: downloadUrl });
      } catch {}
    } else {
      copy();
    }
  };

  const reset = () => {
    abortRef.current?.abort();
    setFile(null);
    setDownloadUrl(null);
    setError(null);
    setProgress(0);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <main style={s.main}>
      <div style={s.box}>
        <div style={s.header}>
          <div style={{ fontSize: 48 }}>📦</div>
          <h1 style={s.title}>APK Sender</h1>
          <p style={s.sub}>Upload APK → Get link → Share</p>
        </div>

        {!downloadUrl ? (
          <div style={{ ...s.card, borderColor: file ? '#6366f1' : '#1e1e2e' }}>
            <input
              ref={inputRef}
              type="file"
              accept=".apk"
              hidden
              id="f"
              onChange={(e) => e.target.files?.[0] && selectFile(e.target.files[0])}
            />

            {!file ? (
              <label htmlFor="f" style={s.drop}>
                <div style={{ fontSize: 36 }}>⬆️</div>
                <p style={{ fontWeight: 600, marginTop: 8 }}>Drop APK here</p>
                <p style={s.muted}>or click to select • Max 200MB</p>
              </label>
            ) : (
              <div style={s.file}>
                <div>
                  <p style={{ fontWeight: 600 }}>{file.name}</p>
                  <p style={s.muted}>{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                </div>
                {!uploading && (
                  <button onClick={reset} style={s.x}>✕</button>
                )}
              </div>
            )}

            {error && <p style={s.err}>{error}</p>}

            {file && !uploading && (
              <button onClick={handleUpload} style={s.btn}>Upload & Get Link</button>
            )}

            {uploading && (
              <div style={{ marginTop: 16 }}>
                <div style={s.bar}>
                  <div style={{ ...s.fill, width: `${progress}%` }} />
                </div>
                <p style={{ ...s.muted, textAlign: 'center', marginTop: 8 }}>{progress}%</p>
                <button onClick={cancel} style={s.cancel}>Cancel</button>
              </div>
            )}
          </div>
        ) : (
          <div style={s.card}>
            <div style={{ fontSize: 42, textAlign: 'center' }}>✅</div>
            <h2 style={{ textAlign: 'center', margin: '8px 0' }}>Done!</h2>
            <p style={{ ...s.muted, textAlign: 'center', marginBottom: 16 }}>Link ready to share</p>

            <input value={downloadUrl} readOnly style={s.input} onClick={(e) => (e.target as HTMLInputElement).select()} />

            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button onClick={copy} style={s.btn}>{copied ? 'Copied!' : 'Copy'}</button>
              <button onClick={share} style={s.share}>Share</button>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <a href={downloadUrl} target="_blank" style={s.dl}>Test Download</a>
              <button onClick={reset} style={s.another}>New Upload</button>
            </div>
          </div>
        )}

        <p style={{ ...s.muted, textAlign: 'center', marginTop: 28, fontSize: 12 }}>
          Free • No login • Vercel Blob
        </p>
      </div>
    </main>
  );
}

const s: any = {
  main: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: '#0a0a0f', color: '#e2e8f0', fontFamily: 'system-ui' },
  box: { width: '100%', maxWidth: 420 },
  header: { textAlign: 'center', marginBottom: 28 },
  title: { fontSize: 28, fontWeight: 700, margin: '8px 0 4px' },
  sub: { color: '#94a3b8', fontSize: 14 },
  card: { background: '#12121a', border: '1px solid #1e1e2e', borderRadius: 14, padding: 22 },
  drop: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '36px 16px', border: '2px dashed #1e1e2e', borderRadius: 10, cursor: 'pointer' },
  muted: { color: '#94a3b8', fontSize: 13 },
  file: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: 'rgba(99,102,241,0.1)', borderRadius: 10 },
  x: { background: 'none', border: 'none', color: '#94a3b8', fontSize: 18, cursor: 'pointer' },
  err: { color: '#ef4444', fontSize: 13, textAlign: 'center', marginTop: 10 },
  btn: { width: '100%', marginTop: 14, padding: '13px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 9, fontWeight: 600, fontSize: 15, cursor: 'pointer' },
  bar: { height: 7, background: '#1e1e2e', borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', background: '#6366f1', transition: 'width 0.25s' },
  cancel: { width: '100%', marginTop: 12, padding: 10, background: 'none', border: '1px solid #ef4444', color: '#ef4444', borderRadius: 8, fontWeight: 600, cursor: 'pointer' },
  input: { width: '100%', padding: '11px 12px', background: '#0a0a0f', border: '1px solid #1e1e2e', borderRadius: 8, color: '#e2e8f0', fontSize: 12 },
  share: { flex: 1, padding: 12, background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid #6366f1', borderRadius: 8, fontWeight: 600, cursor: 'pointer' },
  dl: { flex: 1, textAlign: 'center', padding: 11, background: 'rgba(34,197,94,0.12)', color: '#22c55e', borderRadius: 8, fontWeight: 600, fontSize: 13, textDecoration: 'none' },
  another: { flex: 1, padding: 11, background: 'none', border: '1px solid #1e1e2e', color: '#e2e8f0', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' },
};
