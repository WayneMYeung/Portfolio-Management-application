// src/middleware.ts
// Protects all routes except /login and public assets

import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    // All other checks handled by withAuth
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    '/((?!api/auth|login|_next/static|_next/image|favicon.ico|manifest.json|icons|sw.js|offline).*)',
  ],
}
