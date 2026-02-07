import { NextRequest, NextResponse } from 'next/server'

const UPBIT_API_URL = 'https://api.upbit.com/v1'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const type = searchParams.get('type')
  const market = searchParams.get('market')
  const count = searchParams.get('count') || '200'
  const unit = searchParams.get('unit') || '60'

  if (!type || !market) {
    return NextResponse.json(
      { error: 'Missing required parameters: type, market' },
      { status: 400 }
    )
  }

  try {
    let url: string

    switch (type) {
      case 'days':
        url = `${UPBIT_API_URL}/candles/days?market=${market}&count=${count}`
        break
      case 'minutes':
        url = `${UPBIT_API_URL}/candles/minutes/${unit}?market=${market}&count=${count}`
        break
      case 'ticker':
        url = `${UPBIT_API_URL}/ticker?markets=${market}`
        break
      default:
        return NextResponse.json(
          { error: 'Invalid type. Use: days, minutes, or ticker' },
          { status: 400 }
        )
    }

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 0 }, // Disable caching for real-time data
      cache: 'no-store', // Explicitly disable caching
    })

    if (!response.ok) {
      throw new Error(`Upbit API error: ${response.status}`)
    }

    const data = await response.json()

    // Add explicit cache-control headers to response
    const responseHeaders = new Headers({
      'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0, private',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Content-Type': 'application/json',
    })

    return new NextResponse(JSON.stringify(data), {
      status: 200,
      headers: responseHeaders,
    })
  } catch (error) {
    console.error('Upbit API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data from Upbit' },
      { status: 500 }
    )
  }
}
