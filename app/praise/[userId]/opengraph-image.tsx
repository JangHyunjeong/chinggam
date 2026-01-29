import { ImageResponse } from 'next/og'
 
export const runtime = 'edge'
 
export const alt = '칭찬 감옥 - 친구를 칭찬으로 혼내주세요'
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
          flexDirection: 'column',
          backgroundColor: '#FEE500', // Kakao Yellow
          border: '20px solid black',
          fontFamily: 'sans-serif',
        }}
      >
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                border: '4px solid black',
                padding: '40px 80px',
                backgroundColor: 'white',
                boxShadow: '15px 15px 0px black',
            }}
        >
            <div style={{ fontSize: 100, marginBottom: 20 }}>👮</div>
            <div
            style={{
                fontSize: 80,
                fontWeight: 900,
                color: 'black',
                marginBottom: 20,
                textAlign: 'center',
            }}
            >
            칭찬 감옥
            </div>
            <div
            style={{
                fontSize: 40,
                color: 'black',
                textAlign: 'center',
                fontWeight: 'bold',
            }}
            >
            (Praise Prison)
            </div>
            <div style={{ height: 2, width: '100%', background: 'black', margin: '30px 0' }} />
            <div
            style={{
                fontSize: 32,
                color: '#4B5563',
                textAlign: 'center',
            }}
            >
            친구를 강력한 칭찬으로 혼쭐내주세요!
            </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
