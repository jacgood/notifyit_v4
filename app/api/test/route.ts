import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('=== TEST ROUTE CALLED ===')
  console.log('Time:', new Date().toISOString())
  console.log('URL:', request.url)
  
  return NextResponse.json({
    message: 'Test route working',
    timestamp: new Date().toISOString(),
    url: request.url
  })
}