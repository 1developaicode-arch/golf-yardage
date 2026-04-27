export default function Home() {
  return (
    <main className="min-h-screen bg-green-950 flex flex-col items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="text-7xl mb-6">⛳</div>
        <h1 className="text-4xl font-bold text-white mb-3">Golf Yardage</h1>
        <p className="text-green-300 text-lg mb-8">Your smart caddie on every hole</p>

        <div className="bg-green-900 border border-green-700 rounded-2xl p-6 text-left space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-green-400 text-xl">✓</span>
            <span className="text-white">Next.js connected</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-green-400 text-xl">✓</span>
            <span className="text-white">GitHub pipeline active</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-green-400 text-xl">✓</span>
            <span className="text-white">Vercel auto-deploy live</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-green-400 text-xl">✓</span>
            <span className="text-white">Supabase database ready</span>
          </div>
        </div>

        <p className="text-green-600 text-sm mt-8">Pipeline test — v1.0</p>
      </div>
    </main>
  );
}
