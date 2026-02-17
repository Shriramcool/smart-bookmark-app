"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [bookmarks, setBookmarks] = useState([]);

  // ✅ Load logged-in user
  useEffect(() => {
    const loadUser = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data?.user) {
        console.log("No user found");
        return;
      }

      setUser(data.user);
      fetchBookmarks(data.user.id);
    };

    loadUser();
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

// ✅ REALTIME LISTENER (handles INSERT + DELETE correctly)
useEffect(() => {
  if (!user) return;

  let channel;

  const setupRealtime = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) return;

    channel = supabase
      .channel("bookmarks-live")

      // Listen for INSERT (user-specific)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "bookmarks",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchBookmarks(user.id);
        }
      )

      // Listen for DELETE (must NOT filter — Supabase doesn't send user_id reliably)
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "bookmarks",
        },
        () => {
          fetchBookmarks(user.id);
        }
      )

      .subscribe((status) => {
        console.log("Realtime status:", status);
      });
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
    // ❌ Do NOT manually refetch (Realtime will handle it)
  };

  // ✅ Delete bookmark
  const deleteBookmark = async (id) => {
    const { error } = await supabase.from("bookmarks").delete().eq("id", id);

    if (error) {
      console.error("Delete error:", error);
      return;
    }
    // ❌ Realtime updates automatically
  };

  // ✅ Prevent crash before user loads
  if (!user) {
    return <p className="p-10">Loading user...</p>;
  }

  return (
    <div className="p-10 max-w-xl mx-auto">
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
            <button onClick={() => deleteBookmark(b.id)}>Delete</button>
          </div>
        ))
      )}
    </div>
  );
}
