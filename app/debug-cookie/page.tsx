"use client";
import { useEffect, useState } from "react";

export default function DebugCookiePage() {
  const [cookies, setCookies] = useState("");

  useEffect(() => {
    setCookies(document.cookie);
  }, []);

  return (
    <div className="p-8 font-mono break-all">
      <h1 className="text-xl font-bold mb-4">🍪 Cookie Inspector</h1>
      <div className="bg-gray-100 p-4 rounded">
        {cookies || "No cookies found"}
      </div>
      <div className="mt-8 text-sm text-gray-500">
        If you see 'sb-...-auth-token' here but the server says undefined, it's a header size issue.
      </div>
    </div>
  );
}
