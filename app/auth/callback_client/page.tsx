"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("인증 처리 중...");

  useEffect(() => {
    const handleAuth = async () => {
      const code = searchParams.get("code");
      
      if (code) {
        const supabase = createClient();

        
        try {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            console.error("Client exchange error:", error);
            setStatus("인증 실패: " + error.message);
          } else {

            setStatus("인증 성공! 대시보드로 이동합니다...");
            // Force reload to ensure cookies are picked up
            window.location.href = "/dashboard";
          }
        } catch (e) {
          console.error("Unexpected error:", e);
          setStatus("알 수 없는 오류 발생");
        }
      } else {
        setStatus("인증 코드가 없습니다.");
        setTimeout(() => router.push("/"), 2000);
      }
    };

    handleAuth();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center font-mono">
      <div className="text-center space-y-4">
        <div className="text-4xl animate-spin">⛓️</div>
        <p className="text-xl font-bold">{status}</p>
      </div>
    </div>
  );
}
