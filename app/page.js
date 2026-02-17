"use client";

import { supabase } from "../lib/supabase";

export default function Home() {

  
const signInWithGoogle = async () => {
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: "http://localhost:3000/dashboard",
    },
  });
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
