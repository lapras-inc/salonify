'use client';
import { useState, useRef } from 'react';

export function ImageUpload({ name, currentUrl, label }: { name: string; currentUrl?: string | null; label: string }) {
  const [url, setUrl] = useState(currentUrl ?? '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setError('4MB以下の画像を選択してください');
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    setUploading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'upload failed');
      setUrl(data.url);
    } catch (err: any) {
      setError(err.message === 'file too large (max 5MB)' ? '4MB以下の画像を選択してください' :
               err.message === 'invalid file type' ? 'JPEG, PNG, GIF, WebPのみ対応' : 'アップロードに失敗しました');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="label">{label}</label>
      <input type="hidden" name={name} value={url} />
      <div className="flex items-center gap-3">
        {url && <img src={url} alt="" className="h-16 w-16 object-cover rounded border" />}
        <div className="flex-1">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleChange}
            className="text-sm text-slate-600 file:mr-2 file:py-1 file:px-3 file:rounded file:border file:border-slate-300 file:text-sm file:bg-white hover:file:bg-slate-50"
            disabled={uploading}
          />
          {uploading && <span className="text-xs text-indigo-600 mt-1 block">アップロード中...</span>}
          {error && <span className="text-xs text-red-600 mt-1 block">{error}</span>}
        </div>
      </div>
    </div>
  );
}
