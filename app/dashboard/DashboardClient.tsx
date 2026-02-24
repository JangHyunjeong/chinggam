'use client'

import { useRef, useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Emoji } from '@/components/ui/emoji'

interface Praise {
  id: string
  created_at: string
  keyword: string
  message: string
  sender_id: string
  receiver_id: string
  users?: {
    nickname: string
  }
}

export default function DashboardClient() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center font-mono">로딩 중...</div>
      }
    >
      <DashboardContent />
    </Suspense>
  )
}

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const targetUserId = searchParams.get('id')

  const [copyPraiseSuccess, setCopyPraiseSuccess] = useState(false)
  const [copyDashboardSuccess, setCopyDashboardSuccess] = useState(false)
  const [user, setUser] = useState<{
    id: string
    nickname: string
    email?: string
    isOwner?: boolean
    is_public?: boolean
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [praises, setPraises] = useState<Praise[]>([])
  const [sentPraises, setSentPraises] = useState<Praise[]>([])
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received')
  const [keywords, setKeywords] = useState<string[]>([])

  const [isKeywordsExpanded, setIsKeywordsExpanded] = useState(false)
  const [selectedPraise, setSelectedPraise] = useState<Praise | null>(null)
  const [visibleCount, setVisibleCount] = useState(5)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setVisibleCount((prev) => prev + 5)
      }
    })

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    observerRef.current = observer

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [activeTab, praises.length, sentPraises.length])

  useEffect(() => {
    if (!user) return

    const fetchPraises = async () => {
      const supabase = createClient()
      const isOwner = user.isOwner ?? true

      // 1. 받은 칭찬 가져오기 (타인이거나 본인이거나 동일)
      const { data: receivedData } = await supabase
        .from('praises')
        .select('*')
        .eq('receiver_id', user.id)
        .order('created_at', { ascending: false })

      if (receivedData && receivedData.length > 0) {
        setPraises(receivedData)

        const counts: Record<string, number> = {}
        receivedData.forEach((p: Praise) => {
          if (p.keyword) {
            counts[p.keyword] = (counts[p.keyword] || 0) + 1
          }
        })

        // Sort by count descending and take unique keys
        const sortedKeywords = Object.entries(counts)
          .sort(([, a], [, b]) => b - a)
          .map(([key]) => key)

        setKeywords(sortedKeywords)
      } else {
        setPraises([])
        setKeywords(['#아직_조용함', '#칭찬_대기중'])
      }

      // 2. 보낸 칭찬 가져오기 (본인일 때만)
      if (isOwner) {
        const { data: sentData } = await supabase
          .from('praises')
          .select('*, users!receiver_id(nickname)')
          .eq('sender_id', user.id)
          .order('created_at', { ascending: false })

        if (sentData) {
          setSentPraises(sentData)
        }
      } else {
        setSentPraises([])
      }
    }

    fetchPraises()
  }, [user])

  useEffect(() => {
    if (!loading && !user && !error) {
      router.push('/')
    }
  }, [loading, user, error, router])

  useEffect(() => {
    const supabase = createClient()

    timerRef.current = setTimeout(() => {
      setLoading((prev) => {
        if (prev) {
          setError('로그인 정보를 불러올 수 없습니다. 다시 로그인해주세요.')
          return false
        }
        return prev
      })
    }, 5000)

    const clearLoadingTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }

    const fetchProfile = async (userId: string) => {
      try {
        let retries = 3
        while (retries > 0) {
          const dbPromise = supabase
            .from('users')
            .select('nickname, is_public')
            .eq('id', userId)
            .single()
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('DB Timeout')), 1500),
          )

          try {
            const { data: profile, error } = await Promise.race([dbPromise, timeoutPromise])

            if (profile) return profile
            if (error && error.code !== 'PGRST116' && error.message !== 'DB Timeout') {
              // eslint-disable-next-line no-console
              console.error('Profile fetch failed:', error.message)
              break
            }
          } catch {}
          await new Promise((r) => setTimeout(r, 500))
          retries--
        }
      } catch {}
      return null
    }

    const finalizeLoad = async (
      currentUser: { id: string; email?: string } | null,
      targetId: string | null,
    ) => {
      clearLoadingTimer()
      setError(null)

      if (targetId) {
        // [Public View] 특정 유저의 대시보드를 보는 경우
        const profile = await fetchProfile(targetId)
        if (profile) {
          setUser({
            id: targetId,
            nickname: profile.nickname,
            is_public: profile.is_public,
            isOwner: currentUser?.id === targetId,
          })
        } else {
          setError('존재하지 않는 사용자거나 주소가 잘못되었습니다.')
        }
      } else if (currentUser) {
        // [Private View] 내 대시보드
        setUser({
          id: currentUser.id,
          email: currentUser.email,
          nickname: '프로필 로딩 중...',
          isOwner: true,
          is_public: false, // Default to false until fetched
        })

        fetchProfile(currentUser.id).then((profile) => {
          setUser((prev) =>
            prev
              ? {
                  ...prev,
                  nickname: profile?.nickname || '신입 수감자',
                  is_public: profile?.is_public ?? false,
                }
              : null,
          )
        })
      } else {
        // 로그인 안되어있고 targetId도 없음 -> 로그인 필요
        setUser(null)
      }
      setLoading(false)
    }

    const initUser = async () => {
      // Helper: Run an auth promise with 2s timeout and safe error handling
      const safeAuth = async <T,>(
        promise: Promise<T>,
        selector: (data: T) => { id: string; email?: string } | null | undefined,
      ) => {
        try {
          const result = await Promise.race([
            promise,
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000)),
          ])
          if (!result) return null
          return selector(result) ?? null
        } catch {
          return null
        }
      }

      // Helper: Specific logic for cookie hydration
      const tryCookieAuth = async () => {
        try {
          const authCookie = document.cookie
            .split(';')
            .find((c) => c.trim().includes('-auth-token='))
          if (!authCookie) return null

          const cookieValue = authCookie.split('=').slice(1).join('=')
          const sessionData = JSON.parse(decodeURIComponent(cookieValue))

          if (sessionData?.access_token && sessionData?.refresh_token) {
            return await safeAuth(
              supabase.auth.setSession({
                access_token: sessionData.access_token,
                refresh_token: sessionData.refresh_token,
              }),
              (data) => data.data.session?.user,
            )
          }
        } catch {}
        return null
      }

      try {
        // Try all methods in order until one returns a user
        const currentUser =
          (await safeAuth(supabase.auth.getSession(), (data) => data.data.session?.user)) ||
          (await tryCookieAuth()) ||
          (await safeAuth(supabase.auth.getUser(), (data) => data.data.user)) ||
          (await safeAuth(supabase.auth.refreshSession(), (data) => data.data.session?.user))

        await finalizeLoad(
          currentUser ? { id: currentUser.id, email: currentUser.email } : null,
          targetUserId,
        )
      } catch {
        await finalizeLoad(null, targetUserId)
      }
    }

    initUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Auth state change should trigger re-load with current targetUserId
      const currentUser = session?.user ? { id: session.user.id, email: session.user.email } : null
      await finalizeLoad(currentUser, targetUserId)
    })

    return () => {
      subscription.unsubscribe()
      clearLoadingTimer()
    }
  }, [targetUserId])

  const handleCopyPraiseLink = () => {
    if (!user?.id) return
    const targetId = user.id
    const link = `${window.location.origin}/praise/${targetId}`
    navigator.clipboard.writeText(link)
    setCopyPraiseSuccess(true)
    setTimeout(() => setCopyPraiseSuccess(false), 2000)
  }

  const handleCopyDashboardLink = () => {
    if (!user?.id) return
    const targetId = user.id
    const link = `${window.location.origin}/dashboard?id=${targetId}`
    navigator.clipboard.writeText(link)
    setCopyDashboardSuccess(true)
    setTimeout(() => setCopyDashboardSuccess(false), 2000)
  }

  const handleTogglePublic = async () => {
    if (!user) return

    const newStatus = !user.is_public
    setUser((prev) => (prev ? { ...prev, is_public: newStatus } : null))

    const supabase = createClient()
    const { error } = await supabase
      .from('users')
      .update({ is_public: newStatus })
      .eq('id', user.id)

    if (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to update public status:', error)
      // Revert on error
      setUser((prev) => (prev ? { ...prev, is_public: !newStatus } : null))
      alert('상태 변경에 실패했습니다.')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center font-mono">
        로딩 중... (수감 기록 조회)
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center space-y-4 p-4 text-center font-mono">
        <div className="text-4xl">⚠️</div>
        <div className="font-bold text-red-500">{error}</div>
        <Button onClick={() => router.push('/')}>메인으로 돌아가기</Button>
      </div>
    )
  }

  // ... (render logic) ...

  return (
    <div className="mx-auto min-h-screen max-w-2xl space-y-12 p-4 pb-20">
      {/* Header (same as before) */}
      <header className="flex items-center justify-between border-b-2 border-black py-4">
        <div className="flex items-center text-lg font-bold">
          <div className="align-center flex gap-2">
            <Emoji symbol="👤" />
            <span className="block font-bold">
              {user ? `${user.nickname}${user.isOwner ? '' : '의 칭찬 감옥'}` : '체험판 유저'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-right">
          {user?.isOwner && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-0 text-sm text-gray-500 hover:bg-transparent"
              onClick={async () => {
                const supabase = createClient()
                await supabase.auth.signOut()
                router.push('/')
              }}
            >
              로그아웃
            </Button>
          )}
          {!user?.isOwner && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-0 text-sm font-bold text-orange-500 hover:bg-transparent"
              onClick={() => router.push('/')}
            >
              나도 만들기
            </Button>
          )}
        </div>
      </header>

      {/* Private Dashboard View for Visitors */}
      {user && !user.isOwner && !user.is_public ? (
        <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-6 text-center font-mono">
          <div className="text-6xl">🔒</div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold">비공개 면회실입니다</h2>
            <p className="text-gray-500">
              {user.nickname}님의 칭찬 감옥은 현재 비공개 상태입니다.
              <br />
              수감자가 면회를 거부했습니다. 🙅‍♂️
            </p>
          </div>

          <div className="flex w-full max-w-xs flex-col gap-3">
            <Button
              onClick={() => router.push('/')}
              className="w-full bg-black text-white hover:bg-gray-800"
            >
              나도 감옥 만들러 가기 🛠️
            </Button>
            <Button
              onClick={() => router.push(`/praise/${user.id}`)}
              className="w-full bg-white text-black hover:bg-gray-100"
            >
              {user.nickname}님 칭찬하러 가기 💌
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Strength Cloud */}
          <section className="space-y-6">
            <h2 className="flex items-center gap-2 text-2xl font-black">
              👀 친구들이 증명한 나의 장점
              <span className="text-lg font-normal text-gray-400">({keywords.length})</span>
            </h2>
            <div className="flex min-h-[100px] flex-wrap content-start gap-3">
              {keywords.length > 0 ? (
                <>
                  {(isKeywordsExpanded ? keywords : keywords.slice(0, 8)).map((tag, i) => (
                    <span
                      key={i}
                      className="shadow-hard animate-in fade-in zoom-in rotate-1 transform border-2 border-black bg-white px-3 py-1 text-base font-bold duration-300"
                      style={{
                        transform: `rotate(${((i * 13) % 7) - 3}deg)`,
                        animationDelay: `${i * 50}ms`,
                      }}
                    >
                      {tag.startsWith('#') ? tag : `#${tag}`}
                    </span>
                  ))}
                  {keywords.length > 8 && (
                    <button
                      onClick={() => setIsKeywordsExpanded(!isKeywordsExpanded)}
                      className="shadow-hard flex h-fit items-center self-center border-2 border-black bg-gray-200 px-3 py-1 text-sm font-bold transition-colors hover:bg-gray-300"
                    >
                      {isKeywordsExpanded ? '접기' : `+${keywords.length - 8}`}
                    </button>
                  )}
                </>
              ) : (
                <div className="p-4 font-mono text-sm text-gray-400">데이터 없음</div>
              )}
            </div>
          </section>

          {/* Action: Only visible to Owner */}
          {user?.isOwner && (
            <section>
              <Card className="border-dashed bg-orange-100">
                <div className="space-y-4 text-center text-lg">
                  <div className="mb-4 flex items-center justify-between border-b-2 border-dashed border-gray-300 pb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">내 칭찬 감옥 공개 여부</span>
                      <span
                        className={`text-sm font-bold ${user.is_public ? 'text-orange-500' : 'text-gray-500'}`}
                      >
                        {user.is_public ? '공개' : '비공개'}
                      </span>
                    </div>
                    <div
                      role="switch"
                      aria-checked={user.is_public}
                      onClick={handleTogglePublic}
                      className={`relative h-7 w-12 cursor-pointer rounded-full transition-colors duration-300 ${
                        user.is_public ? 'bg-orange-500' : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-300 ${
                          user.is_public ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  </div>

                  <p className="font-bold">친구들에게 공유하기</p>
                  <div className="flex flex-col gap-3">
                    <Button
                      onClick={handleCopyPraiseLink}
                      className="w-full border-2 border-black bg-orange-500 text-base text-white hover:bg-orange-600 hover:text-white"
                    >
                      {copyPraiseSuccess ? '복사 완료! ✅' : '칭찬 써달라고 요청하기 📝'}
                    </Button>
                    <Button
                      onClick={handleCopyDashboardLink}
                      className="w-full border-2 border-black bg-white text-base text-black hover:bg-gray-100"
                    >
                      {copyDashboardSuccess ? '복사 완료! ✅' : '받은 칭찬 자랑하기 😎'}
                    </Button>
                  </div>
                </div>
              </Card>
            </section>
          )}

          {/* Action: Visitor View - Link to Praise Page */}
          {!user?.isOwner && (
            <section>
              <Card className="border-dashed bg-orange-100">
                <div className="space-y-4 text-center text-lg">
                  <p className="font-bold">{user?.nickname}님을 칭찬으로 혼쭐내러 왔나요?</p>
                  <div className="flex flex-col gap-3">
                    <Button
                      onClick={() => router.push(`/praise/${user?.id}`)}
                      className="w-full bg-orange-500 text-base font-bold text-white hover:bg-orange-600"
                    >
                      칭찬으로 혼쭐내기 ✨
                    </Button>
                    <Button
                      onClick={() => router.push('/')}
                      className="w-full border-2 border-black bg-white text-base text-black hover:bg-gray-100"
                    >
                      내 칭찬 감옥 가기 🥷
                    </Button>
                  </div>
                </div>
              </Card>
            </section>
          )}

          {/* Praise List */}
          <section className="space-y-6">
            <div className="flex flex-col gap-2 border-b-2 border-dashed border-gray-300 pb-4 sm:flex-row sm:items-end sm:justify-between">
              <h2 className="flex items-center gap-2 text-2xl font-black">
                <span>{activeTab === 'received' ? '💝 받은 메세지' : '📤 보낸 메세지'}</span>
                <span className="text-lg font-normal text-gray-400">
                  ({activeTab === 'received' ? praises.length : sentPraises.length})
                </span>
              </h2>
              <div className="flex gap-3">
                {user?.isOwner && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setActiveTab('received')
                        setVisibleCount(5)
                      }}
                      className={`h-8 border-2 ${activeTab === 'received' ? 'bg-orange-500 text-white hover:bg-orange-600 hover:text-white' : '!shadow-none hover:bg-gray-100'}`}
                    >
                      받은거
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setActiveTab('sent')
                        setVisibleCount(5)
                      }}
                      className={`h-8 border-2 ${activeTab === 'sent' ? 'bg-orange-500 text-white hover:bg-orange-600 hover:text-white' : '!shadow-none hover:bg-gray-100'}`}
                    >
                      보낸거
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="grid gap-6">
              {activeTab === 'received' ? (
                praises.length > 0 ? (
                  praises.slice(0, visibleCount).map((praise) => (
                    <Card
                      key={praise.id}
                      className="cursor-pointer space-y-2 transition-colors hover:bg-gray-50"
                      onClick={() => setSelectedPraise(praise)}
                    >
                      <div className="mb-2 text-base font-bold">#{praise.keyword}</div>
                      <p className="mb-2 line-clamp-3 min-h-[3rem] text-base font-medium whitespace-pre-wrap">
                        {praise.message}
                      </p>
                      <div className="text-right">
                        <span className="text-xs text-gray-400">
                          {new Date(praise.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="rounded-lg border-2 border-dashed border-gray-300 py-10 text-center font-mono text-gray-500">
                    칭찬 대기중...
                    <br />
                    친구들에게 링크를 보내보세요!
                  </div>
                )
              ) : sentPraises.length > 0 ? (
                sentPraises.slice(0, visibleCount).map((praise) => (
                  <Card
                    key={praise.id}
                    className="cursor-pointer space-y-2 bg-gray-50 transition-colors hover:bg-gray-100"
                    onClick={() => setSelectedPraise(praise)}
                  >
                    <div className="flex items-start justify-between">
                      <span className="box-border border-2 border-black bg-black px-3 py-0.5 text-sm font-bold text-white">
                        To. {praise.users?.nickname || '알 수 없는 수감자'}
                      </span>
                    </div>
                    <div className="mt-4 text-base font-bold">#{praise.keyword}</div>
                    <p className="mb-2 line-clamp-3 min-h-[3rem] text-base font-medium whitespace-pre-wrap">
                      {praise.message}
                    </p>
                    <div className="text-right">
                      <span className="text-xs text-gray-400">
                        {new Date(praise.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="rounded-lg border-2 border-dashed border-gray-300 py-10 text-center font-mono text-gray-500">
                  혼쭐 대기중...
                  <br />
                  친구들을 칭찬으로 혼쭐내세요!
                </div>
              )}
            </div>

            {/* Infinite Scroll Sentinel */}
            {((activeTab === 'received' && visibleCount < praises.length) ||
              (activeTab === 'sent' && visibleCount < sentPraises.length)) && (
              <div ref={loadMoreRef} className="flex h-10 items-center justify-center">
                <span className="animate-spin text-2xl">⛓️</span>
              </div>
            )}

            {/* End of List Indicator */}
            {((activeTab === 'received' && praises.length > 0 && visibleCount >= praises.length) ||
              (activeTab === 'sent' &&
                sentPraises.length > 0 &&
                visibleCount >= sentPraises.length)) && (
              <div className="animate-in fade-in slide-in-from-bottom-2 py-8 text-center text-sm font-medium text-gray-400">
                마지막 메세지 입니다.
              </div>
            )}
          </section>

          {/* Detail Modal */}
          {selectedPraise && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
              onClick={() => setSelectedPraise(null)}
              onKeyDown={(e) => e.key === 'Escape' && setSelectedPraise(null)}
              role="dialog"
              aria-modal="true"
            >
              <div
                className="shadow-hard animate-in zoom-in-95 relative w-full max-w-lg space-y-3 border-2 border-black bg-white p-6 duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between">
                  {activeTab === 'sent' ? (
                    <span className="box-border inline-block border-2 border-black bg-black px-3 py-0.5 text-sm font-bold text-white">
                      To. {selectedPraise.users?.nickname || '알 수 없는 수감자'}
                    </span>
                  ) : (
                    <div className="text-base font-bold">#{selectedPraise.keyword}</div>
                  )}
                </div>

                {activeTab === 'sent' && (
                  <div className="text-base font-bold">#{selectedPraise.keyword}</div>
                )}

                <div className="max-h-[60vh] min-h-[100px] overflow-y-auto py-2 text-lg font-medium whitespace-pre-wrap">
                  {selectedPraise.message}
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{new Date(selectedPraise.created_at).toLocaleString()}</span>
                </div>

                <Button
                  className="w-full bg-black text-white hover:bg-gray-800"
                  onClick={() => setSelectedPraise(null)}
                >
                  닫기
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
