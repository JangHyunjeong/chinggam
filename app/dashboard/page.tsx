"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Emoji } from "@/components/ui/emoji";

export default function DashboardPage() {
  const router = useRouter();
  const [copySuccess, setCopySuccess] = useState(false);
  const [user, setUser] = useState<{
    id: string;
    nickname: string;
    email?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [praises, setPraises] = useState<any[]>([]);
  const [sentPraises, setSentPraises] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"received" | "sent">("received");
  const [keywords, setKeywords] = useState<string[]>([]);

  const [isKeywordsExpanded, setIsKeywordsExpanded] = useState(false);
  const [selectedPraise, setSelectedPraise] = useState<any | null>(null);
  const [visibleCount, setVisibleCount] = useState(5);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setVisibleCount((prev) => prev + 5);
      }
    });

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [activeTab, praises.length, sentPraises.length, visibleCount]);

  useEffect(() => {
    setVisibleCount(5);
  }, [activeTab]);

  useEffect(() => {
    if (!user) return;

    const fetchPraises = async () => {
      const supabase = createClient();

      const { data: receivedData, error: dbError } = await supabase
        .from("praises")
        .select("*")
        .eq("receiver_id", user.id)
        .order("created_at", { ascending: false });

      if (receivedData && receivedData.length > 0) {
        setPraises(receivedData);

        const counts: Record<string, number> = {};
        receivedData.forEach((p: any) => {
          if (p.keyword) {
            counts[p.keyword] = (counts[p.keyword] || 0) + 1;
          }
        });

        // Sort by count descending and take unique keys
        const sortedKeywords = Object.entries(counts)
          .sort(([, a], [, b]) => b - a)
          .map(([key]) => key);

        setKeywords(sortedKeywords);
      } else {
        setPraises([]);
        setKeywords(["#아직_조용함", "#칭찬_대기중"]);
      }

      const { data: sentData } = await supabase
        .from("praises")
        .select("*, users!receiver_id(nickname)")
        .eq("sender_id", user.id)
        .order("created_at", { ascending: false });

      if (sentData) {
        setSentPraises(sentData);
      }
    };

    fetchPraises();
  }, [user]);

  useEffect(() => {
    if (!loading && !user && !error) {
      router.push("/");
    }
  }, [loading, user, error, router]);

  useEffect(() => {
    const supabase = createClient();

    timerRef.current = setTimeout(() => {
      setLoading((prev) => {
        if (prev) {
          setError("로그인 정보를 불러올 수 없습니다. 다시 로그인해주세요.");
          return false;
        }
        return prev;
      });
    }, 5000);

    const clearLoadingTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const fetchProfile = async (userId: string) => {
      try {
        let retries = 3;
        while (retries > 0) {
          const dbPromise = supabase
            .from("users")
            .select("nickname")
            .eq("id", userId)
            .single();
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("DB Timeout")), 1500),
          );

          try {
            // @ts-ignore
            const { data: profile, error } = await Promise.race([
              dbPromise,
              timeoutPromise,
            ]);

            if (profile) return profile;
            if (
              error &&
              error.code !== "PGRST116" &&
              error.message !== "DB Timeout"
            ) {
              console.error("Profile fetch failed:", error.message);
              break;
            }
          } catch (err) {}
          await new Promise((r) => setTimeout(r, 500));
          retries--;
        }
      } catch (e) {}
      return null;
    };

    const finalizeLoad = async (
      userObj: { id: string; email?: string } | null,
    ) => {
      clearLoadingTimer();

      if (userObj) {
        setUser({
          id: userObj.id,
          email: userObj.email,
          nickname: "프로필 로딩 중...",
        });
        setLoading(false);

        fetchProfile(userObj.id).then((profile) => {
          setUser((prev) =>
            prev
              ? { ...prev, nickname: profile?.nickname || "신입 수감자" }
              : null,
          );
        });
      } else {
        setUser(null);
        setLoading(false);
      }
    };

    const initUser = async () => {
      const checkCookieAndHydrate = async () => {
        const cookies = document.cookie.split(";");

        const authCookie = cookies.find((c) =>
          c.trim().includes("-auth-token="),
        );

        if (authCookie) {
          try {
            const cookieValue = authCookie.split("=")[1];
            const decodedValue = decodeURIComponent(cookieValue);

            // Previously handled base64- prefix, now we expect direct JSON
            let sessionData;
            try {
              sessionData = JSON.parse(decodedValue);
            } catch (e) {
              console.warn(
                "Cookie parse failed. It might be an old session format. Please re-login.",
              );
            }

            if (
              sessionData &&
              sessionData.access_token &&
              sessionData.refresh_token
            ) {
              const { data, error } = await supabase.auth.setSession({
                access_token: sessionData.access_token,
                refresh_token: sessionData.refresh_token,
              });

              if (error) {
                console.error("setSession failed:", error);
              }

              if (data.session?.user) {
                await finalizeLoad({
                  id: data.session.user.id,
                  email: data.session.user.email,
                });
                return true;
              }
            }
          } catch (e) {
            console.error("Manual hydration failed during parsing:", e);
          }
        } else {
        }
        return false;
      };

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (session?.user) {
        await finalizeLoad({ id: session.user.id, email: session.user.email });
        return;
      }

      const hydrated = await checkCookieAndHydrate();
      if (hydrated) return;

      if (session?.user) {
        await finalizeLoad({ id: session.user.id, email: session.user.email });
        return;
      }

      const {
        data: { user: userObj },
      } = await supabase.auth.getUser();
      if (userObj) {
        await finalizeLoad({ id: userObj.id, email: userObj.email });
        return;
      }

      try {
        const {
          data: { session: refreshedSession },
        } = await supabase.auth.refreshSession();
        if (refreshedSession?.user) {
          await finalizeLoad({
            id: refreshedSession.user.id,
            email: refreshedSession.user.email,
          });
          return;
        }
      } catch (e) {}
    };

    initUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await finalizeLoad({ id: session.user.id, email: session.user.email });
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setLoading(false);
        clearLoadingTimer();
      }
    });

    return () => {
      subscription.unsubscribe();
      clearLoadingTimer();
    };
  }, []);

  const handleCopyLink = () => {
    const targetId = user?.id || "mock-user-id";
    const link = `${window.location.origin}/praise/${targetId}`;
    navigator.clipboard.writeText(link);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-mono">
        로딩 중... (수감 기록 조회)
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center font-mono space-y-4 text-center p-4">
        <div className="text-4xl">⚠️</div>
        <div className="text-red-500 font-bold">{error}</div>
        <Button onClick={() => router.push("/")}>메인으로 돌아가기</Button>
      </div>
    );
  }

  // ... (render logic) ...

  return (
    <div className="min-h-screen p-4 pb-20 max-w-2xl mx-auto space-y-12">
      {/* Header (same as before) */}
      <header className="flex justify-between items-center py-4 border-b-2 border-black">
        <div className="font-bold text-lg flex items-center">
          <div className="flex align-center gap-2">
            <Emoji symbol="👤" />
            <span className="block font-bold">
              {user ? user.nickname : "체험판 유저"}
            </span>
          </div>
        </div>
        <div className="text-right">
          <Button
            variant="ghost"
            size="sm"
            className="text-sm h-6 px-0 text-gray-500 hover:bg-transparent"
            onClick={async () => {
              const supabase = createClient();
              await supabase.auth.signOut();
              router.push("/");
            }}
          >
            로그아웃
          </Button>
        </div>
      </header>

      {/* Strength Cloud */}
      <section className="space-y-6">
        <h2 className="text-2xl font-black">👀 친구들이 증명한 나의 장점</h2>
        <div className="flex flex-wrap gap-3 min-h-[100px] content-start">
          {keywords.length > 0 ? (
            <>
              {(isKeywordsExpanded ? keywords : keywords.slice(0, 8)).map(
                (tag, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-white border-2 border-black font-bold text-base shadow-hard transform rotate-1 animate-in fade-in zoom-in duration-300"
                    style={{
                      transform: `rotate(${Math.random() * 6 - 3}deg)`,
                      animationDelay: `${i * 50}ms`,
                    }}
                  >
                    {tag.startsWith("#") ? tag : `#${tag}`}
                  </span>
                ),
              )}
              {keywords.length > 8 && (
                <button
                  onClick={() => setIsKeywordsExpanded(!isKeywordsExpanded)}
                  className="px-3 py-1 bg-gray-200 border-2 border-black font-bold text-sm shadow-hard hover:bg-gray-300 transition-colors flex items-center h-fit self-center"
                >
                  {isKeywordsExpanded ? "접기" : `+${keywords.length - 8}`}
                </button>
              )}
            </>
          ) : (
            <div className="text-gray-400 font-mono text-sm p-4">
              데이터 없음
            </div>
          )}
        </div>
      </section>

      {/* Action */}
      <section>
        <Card className="bg-orange-100 border-dashed">
          <div className="text-lg text-center space-y-4">
            <p className="font-bold">친구들에게 칭찬으로 혼쭐나기</p>
            <Button onClick={handleCopyLink} className="w-full text-base">
              {copySuccess ? "링크 복사됨! ✅" : "링크 공유해서 칭찬받기 🔗"}
            </Button>
          </div>
        </Card>
      </section>

      {/* Praise List */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2 border-b-2 border-dashed border-gray-300 pb-4">
          <h2 className="text-2xl font-black">
            {activeTab === "received" ? "💝 받은 메세지" : "📤 보낸 메세지"}
          </h2>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab("received")}
              className={`h-8 border-2 ${activeTab === "received" ? "bg-orange-500 text-white hover:bg-orange-600 hover:text-white" : "hover:bg-gray-100 !shadow-none"}`}
            >
              받은거
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab("sent")}
              className={`h-8 border-2 ${activeTab === "sent" ? "bg-orange-500 text-white hover:bg-orange-600 hover:text-white" : "hover:bg-gray-100 !shadow-none"}`}
            >
              보낸거
            </Button>
          </div>
        </div>

        <div className="grid gap-6">
          {activeTab === "received" ? (
            praises.length > 0 ? (
              praises.slice(0, visibleCount).map((praise) => (
                <Card
                  key={praise.id}
                  className="space-y-2 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setSelectedPraise(praise)}
                >
                  <div className="font-bold text-base mb-2">
                    #{praise.keyword}
                  </div>
                  <p className="font-medium text-base min-h-[3rem] whitespace-pre-wrap line-clamp-3 mb-2">
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
              <div className="text-center py-10 text-gray-500 font-mono border-2 border-dashed border-gray-300 rounded-lg">
                칭찬 대기중...
                <br />
                친구들에게 링크를 보내보세요!
              </div>
            )
          ) : sentPraises.length > 0 ? (
            sentPraises.slice(0, visibleCount).map((praise) => (
              <Card
                key={praise.id}
                className="space-y-2 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => setSelectedPraise(praise)}
              >
                <div className="flex justify-between items-start">
                  <span className="font-bold bg-black text-white px-3 py-0.5 text-sm border-2 border-black box-border">
                    To. {praise.users?.nickname || "알 수 없는 수감자"}
                  </span>
                </div>
                <div className="font-bold text-base mt-4">
                  #{praise.keyword}
                </div>
                <p className="font-medium text-base min-h-[3rem] whitespace-pre-wrap line-clamp-3 mb-2">
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
            <div className="text-center py-10 text-gray-500 font-mono border-2 border-dashed border-gray-300 rounded-lg">
              혼쭐 대기중...
              <br />
              친구들을 칭찬으로 혼쭐내세요!
            </div>
          )}
        </div>

        {/* Infinite Scroll Sentinel */}
        {((activeTab === "received" && visibleCount < praises.length) ||
          (activeTab === "sent" && visibleCount < sentPraises.length)) && (
          <div
            ref={loadMoreRef}
            className="h-10 flex items-center justify-center"
          >
            <span className="animate-spin text-2xl">⛓️</span>
          </div>
        )}
      </section>

      {/* Detail Modal */}
      {selectedPraise && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPraise(null)}
        >
          <div
            className="bg-white border-2 border-black shadow-hard max-w-lg w-full p-6 space-y-3 relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start">
              {activeTab === "sent" ? (
                <span className="font-bold bg-black text-white px-3 py-0.5 text-sm border-2 border-black box-border inline-block">
                  To. {selectedPraise.users?.nickname || "알 수 없는 수감자"}
                </span>
              ) : (
                <div className="font-bold text-base">
                  #{selectedPraise.keyword}
                </div>
              )}
            </div>

            {activeTab === "sent" && (
              <div className="font-bold text-base">
                #{selectedPraise.keyword}
              </div>
            )}

            <div className="min-h-[100px] max-h-[60vh] overflow-y-auto whitespace-pre-wrap text-lg font-medium py-2">
              {selectedPraise.message}
            </div>

            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>
                {new Date(selectedPraise.created_at).toLocaleString()}
              </span>
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
    </div>
  );
}
