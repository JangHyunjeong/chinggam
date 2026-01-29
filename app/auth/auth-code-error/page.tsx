import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AuthCodeError() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center space-y-4">
      <div className="text-6xl">😱</div>
      <h1 className="text-2xl font-black">로그인 실패!</h1>
      <p className="text-gray-600">
        인증 코드를 교환하는 과정에서 문제가 발생했습니다.
        <br />
        다시 시도해 주세요.
      </p>
      <Link href="/">
        <Button className="font-bold">다시 로그인 하러 가기</Button>
      </Link>
    </div>
  );
}
