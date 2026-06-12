import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import Footer from '../components/Footer'
import Header from '../components/Header'
import { SidebarProvider } from '../context/SidebarContext'

import appCss from '../styles.css?url'

const SITE_URL = 'https://solana-technical-updates-dashboard.vercel.app'
const SITE_DESCRIPTION = 'Track the latest Solana engineering updates — releases, pull requests, and discussions across core repositories.'
const SITE_TITLE = 'Solana Technical Update Dashboard'

const JSON_LD = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: SITE_TITLE,
  description: SITE_DESCRIPTION,
  url: SITE_URL,
})

const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
    },
  },
})

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Solana Technical Update Dashboard',
      },
      {
        name: 'description',
        content: 'Track the latest Solana engineering updates — releases, pull requests, and discussions across core repositories.',
      },
      {
        property: 'og:title',
        content: 'Solana Technical Update Dashboard',
      },
      {
        property: 'og:description',
        content: 'Track the latest Solana engineering updates — releases, pull requests, and discussions across core repositories.',
      },
      {
        property: 'og:image',
        content: '/og-facebook.png',
      },
      {
        property: 'og:type',
        content: 'website',
      },
      {
        property: 'og:site_name',
        content: 'Solana Technical Update Dashboard',
      },
      {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
      {
        name: 'twitter:title',
        content: 'Solana Technical Update Dashboard',
      },
      {
        name: 'twitter:description',
        content: 'Track the latest Solana engineering updates — releases, pull requests, and discussions across core repositories.',
      },
      {
        name: 'twitter:image',
        content: '/og-twitter.png',
      },
      {
        property: 'og:image:width',
        content: '1200',
      },
      {
        property: 'og:image:height',
        content: '630',
      },
      {
        property: 'og:url',
        content: SITE_URL,
      },
      {
        property: 'og:image:alt',
        content: 'Solana Technical Update Dashboard — Track releases, pull requests, and discussions across Solana core repositories.',
      },
      {
        property: 'og:locale',
        content: 'en_US',
      },
      {
        name: 'twitter:site',
        content: '@readylayerone',
      },
      {
        name: 'theme-color',
        content: '#9945FF',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'canonical',
        href: SITE_URL,
      },
      {
        rel: 'icon',
        href: '/favicon.ico',
        sizes: 'any',
      },
      {
        rel: 'icon',
        type: 'image/svg+xml',
        href: '/favicon.svg',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        href: '/logo192.png',
      },
      {
        rel: 'apple-touch-icon',
        href: '/apple-touch-icon.png',
      },
      {
        rel: 'manifest',
        href: '/manifest.json',
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON_LD }} />
        <HeadContent />
      </head>
      <body className="font-sans antialiased [overflow-wrap:anywhere] selection:bg-[rgba(79,184,178,0.24)]">
        <QueryClientProvider client={queryClient}>
          <SidebarProvider>
            <Header />
            {children}
            <Footer />
          </SidebarProvider>
          <TanStackDevtools
            config={{
              position: 'bottom-right',
            }}
            plugins={[
              {
                name: 'Tanstack Router',
                render: <TanStackRouterDevtoolsPanel />,
              },
            ]}
          />
          <ReactQueryDevtools initialIsOpen={false} />
          <Scripts />
        </QueryClientProvider>
      </body>
    </html>
  )
}
