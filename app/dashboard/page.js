"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [bookmarks, setBookmarks] = useState([]);

  // ✅ Restore session after OAuth redirect
  useEffect(() => {
    let authSubscription;

    const initializeUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        window.location.href = "/";
        return;
      }

      setUser(session.user);
      fetchBookmarks(session.user.id);
    };

    initializeUser();

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
        fetchBookmarks(session.user.id);
      } else {
        setUser(null);
        window.location.href = "/";
      }
    });

    authSubscription = data.subscription;

    return () => {
      if (authSubscription) authSubscription.unsubscribe();
    };
  }, []);

  // ✅ Fetch bookmarks
  const fetchBookmarks = async (userId) => {
    const { data, error } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch error:", error);
      return;
    }

    setBookmarks(data || []);
  };

  // ✅ Realtime updates
  useEffect(() => {
    if (!user) return;

    let channel;

    const setupRealtime = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      channel = supabase
        .channel("bookmarks-live")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "bookmarks",
            filter: `user_id=eq.${user.id}`,
          },
          () => fetchBookmarks(user.id)
        )
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "bookmarks",
          },
          () => fetchBookmarks(user.id)
        )
        .subscribe();
    };

    setupRealtime();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [user]);

  // ✅ Add bookmark
  const addBookmark = async () => {
    if (!title || !url || !user) return;

    const { error } = await supabase.from("bookmarks").insert({
      title,
      url,
      user_id: user.id,
    });

    if (error) {
      console.error("Insert error:", error);
      return;
    }

    setTitle("");
    setUrl("");
  };

  // ✅ Delete bookmark
  const deleteBookmark = async (id) => {
    await supabase.from("bookmarks").delete().eq("id", id);
  };

  // ✅ Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (!user) return <p className="p-10">Loading user...</p>;

  return (
    <div className="p-10 max-w-xl mx-auto">
      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="bg-red-500 text-white px-4 py-2 mb-6 rounded"
      >
        Logout
      </button>

      <h1 className="text-2xl mb-4">My Bookmarks</h1>

      <input
        placeholder="Title"
        className="border p-2 w-full mb-2"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <input
        placeholder="URL"
        className="border p-2 w-full mb-2"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />

      <button
        onClick={addBookmark}
        className="bg-black text-white px-4 py-2 mb-6"
      >
        Add Bookmark
      </button>

      {bookmarks.length === 0 ? (
        <p>No bookmarks added yet.</p>
      ) : (
        bookmarks.map((b) => (
          <div key={b.id} className="border p-3 mb-2 flex justify-between">
            <a href={b.url} target="_blank">
              {b.title}
            </a>

            <button
              onClick={() => deleteBookmark(b.id)}
              className="text-red-500"
            >
              Delete
            </button>
          </div>
        ))
      )}
    </div>
  );
}
