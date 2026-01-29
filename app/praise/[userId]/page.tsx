"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";


import { use } from "react";

export default function PraisePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const router = useRouter();
  const [step, setStep] = useState<-1 | 0 | 1 | 2 | 3 | 4>(0);
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [customKeyword, setCustomKeyword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);



  
  const [supabase] = useState(() => createClient());

  
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
             // 1. Ignore abort errors (network interrupt)
             if (error.message.includes("signal is aborted")) return;
             
             // 2. "Auth session missing!" just means not logged in -> Treat as Guest (Step 0)
             if (error.message.includes("Auth session missing")) {
                setStep(0);
                return;
             }

             console.error("Auth check error:", error);
        }

        if (user) {
          if (user.id === userId) {
            setStep(-1);
            return;
          }
          setStep(4); 
        } else {
          setStep(0);
        }
      } catch (e: any) {
        // Ignore abort errors
        if (e.message?.includes("signal is aborted")) return;
        console.error("Auth check exception:", e);
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, [userId, router, supabase]);

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/praise/${userId}`,
      },
    });
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
    if (!selectedKeyword || !message.trim()) {
        setAlertMessage("키워드나 메시지가 입력되지 않았습니다.");
        return;
    }
    
    if (message.trim().length < 10) {
        setAlertMessage("이유나 사례를 최소 10자 이상 작성해주세요!");
        return;
    }
        
        const LAST_SUBMIT_KEY = 'last_praise_submit_time';
        const COOLDOWN_MS = 30 * 1000; // 30 seconds
        const lastSubmitTime = localStorage.getItem(LAST_SUBMIT_KEY);
        
        if (lastSubmitTime) {
            const timeDiff = Date.now() - parseInt(lastSubmitTime);
            if (timeDiff < COOLDOWN_MS) {
                const remaining = Math.ceil((COOLDOWN_MS - timeDiff) / 1000);
                setAlertMessage(`⛔ 너무 빠릅니다!\n도배 방지를 위해 ${remaining}초 뒤에 다시 시도해주세요.`);
                return;
            }
        }

        const { data: { user } } = await supabase.auth.getUser();
        
        const { error } = await supabase.from("praises").insert({
            receiver_id: userId,
            keyword: selectedKeyword,
            message: message,
            sender_id: user?.id || null,
            sender_name: user?.user_metadata?.nickname || null 
        });
        
        if (error) {
            console.error("Praise submission error:", error);
            alert("칭찬 전송에 실패했습니다. (수감자가 존재하지 않거나 오류가 발생했습니다)");
            return; // Don't throw here to avoid generic error alert
        }
        
        localStorage.setItem('last_praise_submit_time', Date.now().toString());
        setStep(3);

    } catch (e: any) {
        console.error("Submission exception:", e);
        // Only show generic alert if it's an unexpected error
        alert("오류가 발생했습니다: " + (e.message || "알 수 없는 오류"));
    } finally {
        // Always reset sending state (unless success, step change handles UI)
        // But if success, we land on Step 3, so resetting isSubmitting is safe/ignored.
        setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen p-4 max-w-md mx-auto flex flex-col justify-center relative">
      {loading && step !== -1 && (
        <div className="flex items-center justify-center min-h-[50vh] font-mono">
            입소자 신원 확인 중...
        </div>
      )}

      {/* Step 0: Login / Guest Interstitial */}
      {!loading && step === 0 && (
        <div className="space-y-8 animate-in zoom-in duration-300 text-center">
             <div className="space-y-4">
                <div className="text-6xl animate-bounce">🗝️</div>
                <h1 className="text-3xl font-black">칭찬으로 혼내주러 입장</h1>
                <p className="text-lg text-gray-600">
                    친구를 칭찬으로 혼내주려면<br/>
                    신원 확인이 필요합니다.
                </p>
            </div>
            
            <div className="space-y-3">
                <Button 
                    className="w-full h-14 text-lg bg-[#FEE500] text-black border-black hover:bg-[#FDD835]"
                    onClick={handleLogin}
                >
                    카카오로 3초 만에 로그인
                </Button>
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-[#f3f4f6] px-2 text-gray-500 rounded-full">Or</span>
                    </div>
                </div>
                <Button 
                    variant="outline"
                    className="w-full h-12 border-2 text-gray-500 hover:text-black hover:bg-white"
                    onClick={() => setStep(4)}
                >
                    비로그인으로 계속하기
                </Button>
            </div>
        </div>
      )}

      {/* Step 4: Guidelines */}
      {!loading && step === 4 && (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500 h-[80vh] flex flex-col">
            <div className="space-y-2 text-center shrink-0">
                <h1 className="text-2xl font-black">👮칭찬으로 혼쭐내기 수칙</h1>
                <p className="text-gray-600">친구에 대한 객관적인 비평 또는 피드백? 그런거 원하지 않습니다. 무조건적인 박수갈채, 일방적이고 편향적인 칭찬을 지향합니다.</p>
            </div>
            
            <Card className="flex-1 overflow-y-auto p-4 space-y-6 border-black shadow-hard">
                <section className="space-y-3">
                    <h3 className="font-bold text-lg border-b border-gray-300 pb-1">1. 핵심 규칙</h3>
                    <ul className="list-disc pl-5 space-y-2 text-base">
                        <li>
                            <span className="font-bold">단일 키워드 + 한 줄 이유</span>만 작성해주세요.
                            <br/><span className="text-gray-500 text-xs">(예: 키워드는 한 개만, 이유는 실제 경험 기반)</span>
                        </li>
                        <li><strong>조언, 개선점, 희망사항</strong>은 <span className="text-red-500 font-bold">작성 금지</span> 🙅‍♂️</li>
                        <li>비교 표현 금지 ("가장", "제일", "누구보다" 등)</li>
                        <li>
                            <strong>여러번 작성 가능</strong>합니다. 많이많이 작성해주세요!
                        </li>
                    </ul>
                </section>

                <section className="space-y-3">
                    <h3 className="font-bold text-lg border-b border-gray-300 pb-1">2. 좋은 예 vs 나쁜 예</h3>
                    
                    <div className="space-y-2">
                        <div className="bg-red-50 p-3 rounded border border-red-300">
                            <div className="font-bold text-red-600 mb-1">❌ 나쁜 예 (복합 키워드)</div>
                            <div className="text-base"><span className="font-bold mr-2">키워드:</span>배려심도 깊고 똑똑해요</div>
                            <span className="font-bold mr-2">이유:</span>...
                        </div>

                        <div className="bg-blue-50 p-3 rounded border border-blue-300 space-y-2">
                            <div className="font-bold text-blue-600">⭕ 좋은 예 (단일 키워드로 여러번 칭찬)</div>
                            <div className="text-base">
                                <span className="font-bold mr-2">키워드:</span>배려심<br/>
                                <span className="font-bold mr-2">이유:</span>제가 추워 보인다고 담요를 챙겨주셔서 따뜻했어요.
                            </div>
                            <div className="border-t border-blue-100 my-1"></div>
                            <div className="text-base">
                                <span className="font-bold mr-2">키워드:</span>똑똑함<br/>
                                <span className="font-bold mr-2">이유:</span>새 프로젝트 구조를 빠르게 잡아서 정리하는 능력이 좋다고 느꼈어요.
                            </div>
                        </div>
                    </div>
                </section>
         
            </Card>

            <Button 
                className="w-full h-14 text-lg bg-black text-white hover:bg-gray-800 shrink-0"
                onClick={() => setStep(1)}
            >
                확인
            </Button>
        </div>
      )}

      {!loading && step === 1 && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="absolute top-4 left-4">
            <Button variant="ghost" className="pl-0 hover:bg-transparent" onClick={() => setStep(4)}>← 유의사항 다시보기</Button>
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-black">🔠 칭찬 키워드</h1>
            <div className="text-sm text-gray-500 space-y-1">
               <p>* 2자 이상, 20자 이하로 입력해주세요.</p>
               <p>* 단일 키워드만 입력해주세요.</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <input 
                className="w-full h-16 px-4 text-lg border-2 border-black shadow-hard focus:outline-none"
                placeholder="ex)정리왕🧹"
                value={customKeyword}
                onChange={(e) => {
                  if (e.target.value.length > 20) {
                    setAlertMessage('키워드는 20자 이하로 입력해주세요.');
                    return;
                  }
                  setCustomKeyword(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (customKeyword.trim().length < 2) {
                      setAlertMessage('키워드는 최소 2자 이상 입력해주세요.');
                      return;
                    }
                    setSelectedKeyword(customKeyword.trim());
                    setStep(2);
                  }
                }}
              />
              <div className="text-right text-xs text-gray-500 font-mono mt-1 px-1">
                  ({customKeyword.length}/20)
              </div>
              <Button 
                className="w-full h-16 px-6 text-lg mt-4"
                onClick={() => {
                      if (customKeyword.trim().length < 2) {
                        setAlertMessage('키워드는 최소 2자 이상 입력해주세요.');
                        return;
                      }
                      setSelectedKeyword(customKeyword.trim());
                      setStep(2);
                }}
              >
                다음
              </Button>
            </div>

          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
          <div className="absolute top-4 left-4">
            <Button variant="ghost" className="pl-0 hover:bg-transparent" onClick={() => setStep(1)}>← 뒤로가기</Button>
          </div>
          <div className="space-y-6">
             <div className="text-center space-y-2">
                <h1 className="text-2xl font-black">🚨 이유 or 사례</h1>
                  <div className="text-sm text-gray-500 space-y-1">
                    <p>* 최소 10자 이상 작성해주세요.</p>
                    <p>* 조언, 개선점, 희망사항은 작성 금지!</p>
                    <p>* 비교 표현 금지 ("가장", "제일", "누구보다" 등)</p> 
                  </div>
             </div>
            <div className="inline-block px-2 py-1 bg-orange-500 font-bold border-2 border-black">
              칭찬 키워드: {selectedKeyword}
            </div>
          </div>
          
          <div className="space-y-2">
            <textarea
              className="w-full h-40 p-4 border-2 border-black shadow-hard resize-none font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="키워드에 대한 이유를 구체적으로 작성해주세요."
              value={message}
              onChange={(e) => {
                if (e.target.value.length > 300) {
                  setAlertMessage("내용은 300자 이하로 입력해주세요.");
                  return;
                }
                setMessage(e.target.value);
              }}
            />
            <div className="text-right text-xs text-gray-500">
              {message.length} / 300자
            </div>
          </div>
          
          <Button 
            className="w-full h-14 text-lg" 
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "전송 중..." : "보내기"}
          </Button>
        </div>
      )}

      {step === 3 && (
        <div className="text-center space-y-6 animate-in zoom-in duration-500">
          <div className="text-6xl">🚔</div>
          <h1 className="text-3xl font-black">혼쭐냄!</h1>
          <p>접수된 증거로 인해<br/>친구가 칭찬 감옥에서 못 나오게 되었습니다.</p>
          
          <Button 
            className="w-full h-14 text-lg bg-[#FEE500] text-black border-black hover:bg-[#FDD835]"
            onClick={() => {
                setStep(1);
                setSelectedKeyword(null);
                setCustomKeyword("");
                setMessage("");
            }}
          >
            친구에게 칭찬 더 보내기
          </Button>

          <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#f3f4f6] px-2 text-gray-500 rounded-full">Or</span>
                </div>
          </div>

          <Button variant="outline" className="w-full h-14 text-lg" onClick={() => router.push("/")}>
            나도 칭찬 감옥 입소하기
          </Button>
        </div>
      )}

      {step === -1 && (
        <div className="flex-grow flex flex-col justify-center items-center space-y-6 animate-in zoom-in duration-500 w-full mb-10">
            <Card className="bg-red-50 border-red-500 border-dashed w-full p-6 text-center space-y-2">
                <div className="text-6xl animate-pulse">🚫</div>
                <p className="font-bold pt-2 text-lg">
                    본인의 칭찬 감옥 링크입니다!
                </p>
            </Card>
            <Button className="w-full bg-black text-white hover:bg-gray-800" onClick={() => router.replace("/dashboard")}>
                내 칭찬 감옥으로 이동
            </Button>
        </div>
      )}
      {alertMessage && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <Card className="w-full max-w-sm bg-white border-2 border-black shadow-hard p-6 text-center space-y-4">
             <div className="text-4xl animate-bounce">🚨</div>
             <p className="font-bold text-lg whitespace-pre-wrap">{alertMessage}</p>
             <Button 
                className="w-full bg-black text-white hover:bg-gray-800 h-12"
                onClick={() => setAlertMessage(null)}
             >
                확인
             </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
