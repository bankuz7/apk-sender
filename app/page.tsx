'use client';

import { useState, useRef } from 'react';
import { upload } from '@vercel/blob/client';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedMB, setUploadedMB] = useState(0);
  const [totalMB, setTotalMB] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.name.toLowerCase().endsWith('.apk')) {
      setError('Sirf .apk files allowed hain!');
      setFile(null);
      return;
    }

    if (selected.size > 200 * 1024 * 1024) {
      setError('File size 200MB se kam hona chahiye.');
      setFile(null);
      return;
    }

    setError(null);
    setFile(selected);
    setDownloadUrl(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (!dropped) return;

    if (!dropped.name.toLowerCase().endsWith('.apk')) {
      setError('Sirf .apk files allowed hain!');
      return;
    }

    if (dropped.size > 200 * 1024 * 1024) {
      setError('File size 200MB se kam hona chahiye.');
      return;
    }

    setError(null);
    setFile(dropped);
    setDownloadUrl(null);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setUploadedMB(0);
    setTotalMB(+(file.size / (1024 * 1024)).toFixed(1));
    setError(null);

    try {
      // Client-side direct upload + multipart for speed on large files
      const blob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/upload',
        multipart: true, // 🚀 parallel chunks = faster + more reliable
        contentType: 'application/vnd.android.package-archive',
        onUploadProgress: (event) => {
          if (event.percentage !== undefined) {
            setProgress(Math.round(event.percentage));
          }
          if (event.loaded !== undefined) {
            setUploadedMB(+(event.loaded / (1024 * 1024)).toFixed(1));
          }
        },
      });

      setProgress(100);
      setDownloadUrl(blob.url);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Kuch galat ho gaya. Dobara try karo.');
    } finally {
      setUploading(false);
    }
  };

  const copyLink = async () => {
    if (!downloadUrl) return;
    await navigator.clipboard.writeText(downloadUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setFile(null);
    setDownloadUrl(null);
    setError(null);
    setProgress(0);
    setUploadedMB(0);
    setTotalMB(0);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <main style={styles.main}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.logo}>📦</div>
          <h1 style={styles.title}>APK Sender</h1>
          <p style={styles.subtitle}>
            Koi bhi APK upload karo → Shareable link lo → Kisi ko bhi bhejo
          </p>
        </div>

        {!downloadUrl ? (
          <div
            style={{
              ...styles.card,
              borderColor: file ? 'var(--primary)' : 'var(--border)',
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".apk,application/vnd.android.package-archive"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              id="apk-input"
            />

            {!file ? (
              <label htmlFor="apk-input" style={styles.dropZone}>
                <div style={styles.dropIcon}>⬆️</div>
                <p style={styles.dropText}>APK file yahan drop karo</p>
                <p style={styles.dropHint}>ya click karke select karo</p>
                <p style={styles.dropLimit}>Max 200MB • Sirf .apk</p>
              </label>
            ) : (
              <div style={styles.fileInfo}>
                <div style={styles.fileIcon}>📱</div>
                <div style={styles.fileDetails}>
                  <p style={styles.fileName}>{file.name}</p>
                  <p style={styles.fileSize}>
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <button onClick={reset} style={styles.removeBtn}>
                  ✕
                </button>
              </div>
            )}

            {error && <p style={styles.error}>{error}</p>}

            {file && !uploading && (
              <button onClick={handleUpload} style={styles.uploadBtn}>
                Upload & Get Link
              </button>
            )}

            {uploading && (
              <div style={styles.progressContainer}>
                <div style={styles.progressBar}>
                  <div
                    style={{
                      ...styles.progressFill,
                      width: `${progress}%`,
                    }}
                  />
                </div>
                <p style={styles.progressText}>
                  Uploading... {progress}% ({uploadedMB} / {totalMB} MB)
                </p>
                <p style={styles.progressHint}>
                  Multipart mode • Parallel chunks for faster upload
                </p>
              </div>
            )}
          </div>
        ) : (
          <div style={styles.card}>
            <div style={styles.successIcon}>✅</div>
            <h2 style={styles.successTitle}>Upload Successful!</h2>
            <p style={styles.successText}>
              Yeh link kisi ko bhi bhejo. Unhe APK download mil jayega.
            </p>

            <div style={styles.linkBox}>
              <input
                type="text"
                value={downloadUrl}
                readOnly
                style={styles.linkInput}
              />
              <button onClick={copyLink} style={styles.copyBtn}>
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <div style={styles.actions}>
              <a
                href={downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.downloadBtn}
              >
                Download Test
              </a>
              <button onClick={reset} style={styles.anotherBtn}>
                Upload Another
              </button>
            </div>
          </div>
        )}

        <footer style={styles.footer}>
          <p>Free • Fast • No login required</p>
          <p style={{ marginTop: 8, fontSize: 12, color: 'var(--muted)' }}>
            Files are stored securely on Vercel Blob
          </p>
        </footer>
      </div>
    </main>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  main: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    background: 'linear-gradient(180deg, #0a0a0f 0%, #0f0f1a 100%)',
  },
  container: {
    width: '100%',
    maxWidth: 480,
  },
  header: {
    textAlign: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: 700,
    letterSpacing: '-0.5px',
    marginBottom: 8,
  },
  subtitle: {
    color: 'var(--muted)',
    fontSize: 15,
  },
  card: {
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: 28,
    transition: 'border-color 0.2s',
  },
  dropZone: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    border: '2px dashed var(--border)',
    borderRadius: 12,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  dropIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  dropText: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 4,
  },
  dropHint: {
    fontSize: 14,
    color: 'var(--muted)',
    marginBottom: 12,
  },
  dropLimit: {
    fontSize: 12,
    color: 'var(--muted)',
  },
  fileInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '16px',
    background: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 12,
    marginBottom: 16,
  },
  fileIcon: {
    fontSize: 32,
  },
  fileDetails: {
    flex: 1,
    minWidth: 0,
  },
  fileName: {
    fontWeight: 600,
    fontSize: 15,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  fileSize: {
    fontSize: 13,
    color: 'var(--muted)',
  },
  removeBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--muted)',
    fontSize: 18,
    cursor: 'pointer',
    padding: 4,
  },
  error: {
    color: 'var(--danger)',
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
  uploadBtn: {
    width: '100%',
    marginTop: 16,
    padding: '14px 24px',
    background: 'var(--primary)',
    color: 'white',
    border: 'none',
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  progressContainer: {
    marginTop: 20,
  },
  progressBar: {
    height: 8,
    background: 'var(--border)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'var(--primary)',
    borderRadius: 4,
    transition: 'width 0.3s',
  },
  progressText: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 13,
    color: 'var(--muted)',
  },
  progressHint: {
    textAlign: 'center',
    marginTop: 4,
    fontSize: 11,
    color: 'var(--muted)',
    opacity: 0.7,
  },
  successIcon: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 12,
  },
  successTitle: {
    textAlign: 'center',
    fontSize: 22,
    marginBottom: 8,
  },
  successText: {
    textAlign: 'center',
    color: 'var(--muted)',
    fontSize: 14,
    marginBottom: 24,
  },
  linkBox: {
    display: 'flex',
    gap: 8,
    marginBottom: 20,
  },
  linkInput: {
    flex: 1,
    padding: '12px 14px',
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    color: 'var(--text)',
    fontSize: 13,
    outline: 'none',
  },
  copyBtn: {
    padding: '12px 18px',
    background: 'var(--primary)',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  actions: {
    display: 'flex',
    gap: 10,
  },
  downloadBtn: {
    flex: 1,
    textAlign: 'center',
    padding: '12px',
    background: 'rgba(34, 197, 94, 0.15)',
    color: 'var(--success)',
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 14,
  },
  anotherBtn: {
    flex: 1,
    padding: '12px',
    background: 'transparent',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
  },
  footer: {
    textAlign: 'center',
    marginTop: 32,
    color: 'var(--muted)',
    fontSize: 13,
  },
};
