import './globals.css';
export const metadata = { title: 'WinRepo Platform', description: 'Self-hosted Windows software repository and deployment platform' };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="en" className="dark"><body>{children}</body></html>; }
