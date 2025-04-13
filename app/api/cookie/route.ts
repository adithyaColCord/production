import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { ResponseCookies } from 'next/dist/compiled/@edge-runtime/cookies';

export async function GET(request: NextRequest) {
  const cookieName = request.nextUrl.searchParams.get('name');
  
  if (!cookieName) {
    return NextResponse.json({ error: 'Cookie name is required' }, { status: 400 });
  }

  const cookieStore = await cookies();
  const value = cookieStore.get(cookieName)?.value;
  
  return NextResponse.json({ value });
}

export async function POST(request: NextRequest) {
  try {
    const { name, value, options = {} } = await request.json();
    
    if (!name || value === undefined) {
      return NextResponse.json({ error: 'Cookie name and value are required' }, { status: 400 });
    }

    const cookieStore = await cookies();
    // Set the cookie with the provided options
    cookieStore.set(name, value, {
      path: options.path || '/',
      ...options
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error setting cookie:', error);
    return NextResponse.json({ error: 'Failed to set cookie' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { name, options = {} } = await request.json();
    
    if (!name) {
      return NextResponse.json({ error: 'Cookie name is required' }, { status: 400 });
    }
    
    const cookieStore = cookies();
    const responseCookies = cookieStore as unknown as ResponseCookies;
    
    // Delete the cookie
    responseCookies.set(name, '', {
      path: options.path || '/',
      ...options,
      expires: new Date(0)
    });
  } catch (error) {
    console.error('Error deleting cookie:', error);
    return NextResponse.json({ error: 'Failed to delete cookie' }, { status: 500 });
  }
}
