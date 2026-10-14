import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ path?: string[] }> }
) {
  const params = await props.params;
  const subpath = params.path ? params.path.join('/') : '';
  return forwardRequest(request, subpath);
}

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ path?: string[] }> }
) {
  const params = await props.params;
  const subpath = params.path ? params.path.join('/') : '';
  return forwardRequest(request, subpath);
}

async function forwardRequest(request: NextRequest, subpath: string) {
  const modelBaseUrl = process.env.MODEL_URL || 'http://localhost:8000';
  const targetUrl = new URL(subpath, modelBaseUrl.endsWith('/') ? modelBaseUrl : `${modelBaseUrl}/`);

  request.nextUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.set(key, value);
  });

  const headers = new Headers();
  const contentType = request.headers.get('content-type');
  if (contentType) {
    headers.set('content-type', contentType);
  }

  const options: RequestInit = {
    method: request.method,
    headers,
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const body = await request.text();
    options.body = body;
  }

  try {
    const response = await fetch(targetUrl, options);
    const responseData = await response.text();
    return new NextResponse(responseData, {
      status: response.status,
      headers: {
        'content-type': response.headers.get('content-type') || 'application/json',
      },
    });
  } catch (error: any) {
    console.error(`[API Proxy] Error forwarding request to ${targetUrl.toString()}:`, error);
    return NextResponse.json(
      { error: error?.message || 'Upstream inference service unavailable' },
      { status: 502 }
    );
  }
}
