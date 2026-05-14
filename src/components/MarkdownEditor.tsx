'use client';

import { useState, useRef } from 'react';
import { marked } from 'marked';

export function MarkdownEditor({ name, defaultValue }: { name: string; defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue ?? '');
  const [preview, setPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      alert('4MB以下の画像を選択してください');
      if (fileRef.current) fileRef.current.value = '';
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const textarea = textareaRef.current;
      if (textarea) {
        const pos = textarea.selectionStart ?? value.length;
        const imgMd = `![${file.name}](${data.url})`;
        const newValue = value.slice(0, pos) + imgMd + value.slice(pos);
        setValue(newValue);
      }
    } catch {
      alert('画像のアップロードに失敗しました');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  const html = marked.parse(value, { async: false }) as string;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="label mb-0">本文 (Markdown)</label>
        <div className="flex gap-2 text-xs">
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="px-2 py-1 rounded border border-slate-300 hover:bg-slate-50 disabled:opacity-50">
            {uploading ? 'アップロード中...' : '画像を挿入'}
          </button>
          <button type="button" onClick={() => setPreview(!preview)} className="px-2 py-1 rounded border border-slate-300 hover:bg-slate-50">
            {preview ? '編集' : 'プレビュー'}
          </button>
        </div>
      </div>
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleImageUpload} className="hidden" />
      <input type="hidden" name={name} value={value} />
      {preview ? (
        <div className="input min-h-[200px] prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <textarea
          ref={textareaRef}
          className="input font-mono text-sm"
          rows={12}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={"# 見出し\n\n本文テキスト\n\n**太字** *斜体*\n\n- リスト\n- リスト\n\n![画像](URL)"}
        />
      )}
      <p className="text-xs text-slate-500 mt-1">Markdown記法が使えます。見出し(#)、太字(**)、リスト(-)、画像(![](url))、リンク([](url))</p>
    </div>
  );
}
