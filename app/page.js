"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function Home() {
  const router = useRouter();

  //  Check if user already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getUser();

      if (data?.user) {
        router.push("/dashboard"); // go to dashboard if logged in
      }
    };

    checkSession();
  }, [router]);

  //  Login with Google
const signInWithGoogle = async () => {
  const redirectUrl =
    process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${redirectUrl}/dashboard`,
    },
  });

  if (error) console.error(error);
};

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <button
        onClick={signInWithGoogle}
        className="bg-black text-white px-6 py-3 rounded-lg"
      >
        Login with Google
      </button>
    </div>
  );
}
