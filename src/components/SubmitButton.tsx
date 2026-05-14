'use client';

import { useState, useEffect } from 'react';

export function SubmitButton({
  className,
  children,
  loadingText,
  confirmMessage,
  name,
  value,
}: {
  className?: string;
  children: React.ReactNode;
  loadingText?: string;
  confirmMessage?: string;
  name?: string;
  value?: string;
}) {
  const [submitting, setSubmitting] = useState(false);

  // Reset when component remounts (e.g. browser back)
  useEffect(() => {
    setSubmitting(false);
  }, []);

  return (
    <button
      type="submit"
      className={className}
      disabled={submitting}
      name={name}
      value={value}
      onClick={(e) => {
        if (submitting) {
          e.preventDefault();
          return;
        }
        if (confirmMessage && !confirm(confirmMessage)) {
          e.preventDefault();
          return;
        }
        // Delay state change so form submission fires before re-render disables the button
        requestAnimationFrame(() => setSubmitting(true));
      }}
    >
      {submitting ? (loadingText ?? '処理中...') : children}
    </button>
  );
}
