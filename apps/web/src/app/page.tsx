export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-b from-blue-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm flex flex-col space-y-8 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight lg:text-6xl text-primary">
          WinRepo Platform
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          Enterprise Windows Software Repository and Endpoint Management System.
        </p>
        <div className="flex gap-4">
          <a href="/dashboard" className="px-6 py-3 bg-primary text-white rounded-md hover:bg-blue-700 transition-colors">
            Go to Dashboard
          </a>
          <a href="/docs" className="px-6 py-3 bg-secondary text-secondary-foreground rounded-md hover:bg-slate-200 transition-colors">
            Read Documentation
          </a>
        </div>
      </div>
    </main>
  );
}
