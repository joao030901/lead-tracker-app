
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { LocationProvider } from '@/context/location-context';
import { ThemeProvider } from '@/context/theme-context';
import { AuthProvider } from '@/context/auth-context';
import { Toaster as HotToaster } from 'react-hot-toast';
import { cookies } from 'next/headers';


export const metadata: Metadata = {
  title: 'LeadsUni',
  description: 'LeadsUni - CRM e Gerenciamento de Leads',
  manifest: '/manifest.json',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const initialLocation = cookieStore.get('app_location')?.value || null;
  
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <ThemeProvider>
          <AuthProvider>
            <LocationProvider initialLocation={initialLocation}>
              {children}
            </LocationProvider>
          </AuthProvider>
        </ThemeProvider>
        <Toaster />
        <HotToaster />
      </body>
    </html>
  );
}
