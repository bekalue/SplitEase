import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'SplitEase — Modern Shared Expense Splitter',
  description: 'Track who paid, who owes, and settle up group expenses effortlessly with roommates, trips, and friends.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Navbar />
          <main style={{ minHeight: 'calc(100vh - 65px)' }}>
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
