"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace("/dashboard");
      }
    };
    checkSession();
  }, [router]);

  const handleLogin = async () => {


    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      alert("Supabase 환경 변수가 설정되지 않았습니다. (.env.local 확인)");

      return;
    }
    try {

      
      localStorage.removeItem('sb-auth-token');
      
      document.cookie.split(";").forEach((c) => {
        const name = c.trim().split("=")[0];
        if (name.startsWith("sb-")) {
            document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
            document.cookie = `${name}=; path=/; domain=${location.hostname}; expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
        }
      });
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "kakao",
        options: {
          redirectTo: `${location.origin}/auth/callback`,
        },
      });

      if (error) alert("Login Error: " + error.message);
    } catch (error) {
      console.error("Login unexpected error:", error);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full space-y-8">
        <div className="space-y-4">
          <div className="text-6xl animate-bounce">⛓️🏢⛓️</div>
          <h1 className="text-4xl font-black sm:text-5xl">
            칭찬감옥
          </h1>
          <p className="text-lg font-medium text-gray-600">
            로그인해서 칭찬으로 혼쭐한번 나보시죠
          </p>
        </div>

        <div className="pt-8 space-y-4">
          <Button 
            className="w-full h-14 text-lg bg-[#FEE500] text-black border-black hover:bg-[#FDD835]"
            onClick={handleLogin}
          >
            카카오로 3초 만에 로그인
          </Button>
        </div>
      </div>
    </main>
  );
}
