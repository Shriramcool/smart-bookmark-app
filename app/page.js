"use client";

import { supabase } from "../lib/supabase";

export default function Home() {

const signInWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin, 
    },
  });

  if (error) console.error("Login error:", error);
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
