import { Metadata, ResolvingMetadata } from 'next'
import { createClient } from '@/lib/supabase/client'

type Props = {
  params: Promise<{ userId: string }>
  children: React.ReactNode
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { userId } = await params

  // Create a single supabase client for metadata fetching
  const supabase = createClient()

  // Fetch user nickname
  const { data: user } = await supabase.from('users').select('nickname').eq('id', userId).single()

  const nickname = user?.nickname || '친구'

  const title = `🚨 ${nickname}님을 칭찬 감옥에 가둬주세요!`
  const description = `${nickname}님의 장점을 제보받고 있습니다. 당신의 칭찬으로 친구를 혼쭐내주세요!`

  return {
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
      type: 'website',
      // images: ['/og-image.png'], // To be added
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      // images: ['/og-image.png'], // To be added
    },
  }
}

export default function PraiseLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
