import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  // Check if trying to access attachments route
  if (request.nextUrl.pathname.startsWith('/attachments')) {
    const vaultSession = request.cookies.get('vault_session');
    
    // If no valid session, redirect back to home page's attachments section
    if (!vaultSession || vaultSession.value !== 'true') {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      url.hash = 'attachments';
      return NextResponse.redirect(url);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/attachments/:path*'],
};
