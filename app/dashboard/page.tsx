import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const resolvedSearchParams = await searchParams
  const id = resolvedSearchParams.id

  if (!id || typeof id !== 'string') {
    return {
      title: '칭찬 감옥',
      description: '친구들에게 칭찬으로 혼쭐나자!',
    }
  }

  const supabase = await createClient()
  const { data: user } = await supabase
    .from('users')
    .select('nickname, is_public')
    .eq('id', id)
    .single()

  // Handle private profile
  if (user && user.is_public === false) {
    return {
      title: '비공개 면회실 🔒',
      description: '수감자가 면회를 거부했습니다.',
      openGraph: {
        title: '비공개 면회실 🔒',
        description: '수감자가 면회를 거부했습니다.',
      },
    }
  }

  const nickname = user?.nickname || '알 수 없는 수감자'

  return {
    title: `${nickname}님 면회가기`,
    description: `칭찬 감옥에서 ${nickname}님의 수감 기록을 확인하세요!`,
    openGraph: {
      title: `${nickname}님 면회가기`,
      description: `칭찬 감옥에서 ${nickname}님의 수감 기록을 확인하세요!`,
    },
  }
}
export default function DashboardPage() {
  return <DashboardClient />
}
