"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [bookmarks, setBookmarks] = useState([]);

  // ✅ Restore session after Google OAuth redirect
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

    // Listen for login/logout changes
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

  // ✅ Initial fetch (only once on load)
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

  // ✅ TRUE Realtime (instant — no DB refetch)
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("bookmarks-live")

      // INSERT from another tab
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "bookmarks",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setBookmarks((prev) => {
            const exists = prev.find((b) => b.id === payload.new.id);
            if (exists) return prev;
            return [payload.new, ...prev];
          });
        }
      )

      // DELETE from another tab
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "bookmarks",
        },
        (payload) => {
          setBookmarks((prev) =>
            prev.filter((b) => b.id !== payload.old.id)
          );
        }
      )

      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // ✅ Add bookmark (instant UI update)
  const addBookmark = async () => {
    if (!title || !url || !user) return;

    const { data, error } = await supabase
      .from("bookmarks")
      .insert({
        title,
        url,
        user_id: user.id,
      })
      .select();

    if (error) {
      console.error("Insert error:", error);
      return;
    }

    setBookmarks((prev) => [data[0], ...prev]);
    setTitle("");
    setUrl("");
  };

  // ✅ Delete bookmark (instant UI update)
  const deleteBookmark = async (id) => {
    const { error } = await supabase.from("bookmarks").delete().eq("id", id);

    if (error) {
      console.error("Delete error:", error);
      return;
    }

    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  };

  // ✅ Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (!user) return <p className="p-10">Loading user...</p>;

  return (
    <div className="p-10 max-w-xl mx-auto">
      {/* Header Row */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Bookmarks</h1>

        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>

      {/* Add Bookmark */}
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

      {/* Bookmark List */}
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
