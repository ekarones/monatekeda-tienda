import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, Outlet, RouterProvider } from 'react-router'
import { ApiError } from './api/client'
import { Layout } from './components/Layout'
import { NotFound } from './components/States'
import './index.css'
import { AboutPage } from './pages/AboutPage'
import { CartPage } from './pages/CartPage'
import { ContactPage } from './pages/ContactPage'
import { HomePage } from './pages/HomePage'
import { LookupPage } from './pages/LookupPage'
import { ProductsPage } from './pages/ProductsPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      // Reintentar solo errores transitorios (red, 429, 5xx). 400/404 son definitivos.
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status < 500 && error.status !== 429) return false
        return failureCount < 2
      },
      retryDelay: (attempt, error) => {
        if (error instanceof ApiError && error.retryAfter) return error.retryAfter * 1000
        return Math.min(1000 * 2 ** attempt, 10_000)
      },
    },
  },
})

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      // La portada maneja su propio ancho (secciones a sangre); el resto va en un contenedor.
      { path: '/', element: <HomePage /> },
      {
        element: (
          <div className="mx-auto w-full max-w-[1360px] px-4 py-8 sm:px-8">
            <Outlet />
          </div>
        ),
        children: [
          { path: '/productos', element: <ProductsPage /> },
          {
            path: '/producto/:slug',
            // Carga diferida: la página de detalle incluye react-markdown.
            lazy: async () => ({ Component: (await import('./pages/ProductDetailPage')).ProductDetailPage }),
          },
          { path: '/qr/:code', element: <LookupPage /> },
          { path: '/carrito', element: <CartPage /> },
          { path: '/nosotros', element: <AboutPage /> },
          { path: '/contacto', element: <ContactPage /> },
          { path: '*', element: <NotFound /> },
        ],
      },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
