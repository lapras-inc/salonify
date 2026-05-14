export default function Loading() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
      <span className="ml-3 text-slate-500 text-sm">読み込み中...</span>
    </div>
  );
}
