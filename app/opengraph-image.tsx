import { ImageResponse } from 'next/og'
 
export const runtime = 'edge'
 
export const alt = '칭찬 감옥 - 칭찬으로 혼쭐나는 공간'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'
 
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          height: '100%',
          width: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'white',
        }}
      >
        <div style={{ fontSize: 320 }}>⛓️🏢⛓️</div>
      </div>
    ),
    {
      ...size,
    }
  )
}
