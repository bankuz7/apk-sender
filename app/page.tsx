'use client';

import { useState, useRef } from 'react';
import { upload } from '@vercel/blob/client';

const MAX_SIZE_MB = 500;

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
};

const fileIcon = (name: string) => {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (ext === 'apk' || ext === 'aab') return '🤖';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'heic'].includes(ext)) return '🖼️';
  if (['mp4', 'mkv', 'mov', 'webm', 'avi'].includes(ext)) return '🎬';
  if (['mp3', 'wav', 'flac', 'm4a', 'ogg'].includes(ext)) return '🎵';
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return '🗜️';
  if (['pdf'].includes(ext)) return '📕';
  if (['doc', 'docx', 'txt', 'rtf'].includes(ext)) return '📄';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return '📊';
  if (['ppt', 'pptx'].includes(ext)) return '📽️';
  if (['exe', 'msi', 'dmg', 'deb', 'appimage'].includes(ext)) return '⚙️';
  return '📦';
};

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const selectFile = (f: File) => {
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Max ${MAX_SIZE_MB}MB allowed`);
      return;
    }
    if (f.size === 0) {
      setError('File is empty');
      return;
    }
    setError(null);
    setFile(f);
    setDownloadUrl(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (uploading) return;
    const f = e.dataTransfer.files?.[0];
    if (f) selectFile(f);
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
        contentType: file.type || 'application/octet-stream',
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
        await navigator.share({ title: file?.name || 'File Download', url: downloadUrl });
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
          <h1 style={s.title}>File Sender</h1>
          <p style={s.sub}>Upload any file → Get link → Share</p>
        </div>

        {!downloadUrl ? (
          <div
            style={{ ...s.card, borderColor: dragging || file ? '#6366f1' : '#1e1e2e' }}
            onDragOver={(e) => {
              e.preventDefault();
              if (!uploading) setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <input
              ref={inputRef}
              type="file"
              hidden
              id="f"
              disabled={uploading}
              onChange={(e) => e.target.files?.[0] && selectFile(e.target.files[0])}
            />

            {!file ? (
              <label htmlFor="f" style={{ ...s.drop, borderColor: dragging ? '#6366f1' : '#1e1e2e' }}>
                <div style={{ fontSize: 36 }}>{dragging ? '📥' : '⬆️'}</div>
                <p style={{ fontWeight: 600, marginTop: 8 }}>{dragging ? 'Drop it!' : 'Drop any file here'}</p>
                <p style={s.muted}>or click to select • Max {MAX_SIZE_MB}MB</p>
                <p style={{ ...s.muted, marginTop: 6, fontSize: 11 }}>
                  APK, images, videos, documents, zip — sab chalega
                </p>
              </label>
            ) : (
              <div style={s.file}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', minWidth: 0 }}>
                  <span style={{ fontSize: 22 }}>{fileIcon(file.name)}</span>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {file.name}
                    </p>
                    <p style={s.muted}>
                      {formatBytes(file.size)} • {file.name.split('.').pop()?.toUpperCase() || 'FILE'}
                    </p>
                  </div>
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
            <p style={{ ...s.muted, textAlign: 'center', marginBottom: 16 }}>
              {file ? `${file.name} • ${formatBytes(file.size)}` : 'Link ready to share'}
            </p>

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
          Any file type • No login • Vercel Blob
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
  file: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: 12, background: 'rgba(99,102,241,0.1)', borderRadius: 10 },
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
