"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const [me, setMe] = useState<{
    id: string;
    name: string;
    imageUrl: string;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    (async () => {
      const query = `query { me { id name imageUrl } }`;
      const res = await fetch("/api/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query }),
      });
      const j = await res.json();
      setMe(j.data?.me ?? null);
    })();
  }, [router]);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError("");
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const up = await fetch("/api/upload", { method: "POST", body: fd });
      const upj = await up.json();
      if (!up.ok) {
        throw new Error(upj?.error || "Upload failed");
      }

      const mutation = `mutation($url: String!) { updateProfileImage(imageUrl: $url) { id imageUrl } }`;
      const res = await fetch("/api/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query: mutation, variables: { url: upj.url } }),
      });
      const j = await res.json();
      if (j.errors)
        throw new Error(j.errors[0]?.message || "Failed to update profile");
      setMe((m) =>
        m ? { ...m, imageUrl: j.data.updateProfileImage.imageUrl } : m
      );
    } catch (err: any) {
      setError(String(err?.message || err));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-4">Your Profile</h1>
        <div className="bg-neutral-900 rounded-lg p-4 border border-neutral-800">
          <div className="flex items-center gap-4">
            <img
              src={me?.imageUrl || "/images/placeholder-avatar.svg"}
              alt="Avatar"
              className="w-20 h-20 rounded-full object-cover border border-neutral-800"
            />
            <div className="flex-1">
              <p className="text-lg font-semibold">{me?.name ?? ""}</p>
              <label className="mt-2 inline-flex items-center gap-2 text-sm cursor-pointer">
                <span className="px-3 py-2 rounded-md border border-neutral-700 bg-neutral-800 hover:bg-neutral-700">
                  {uploading ? "Uploading..." : "Change photo"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onFileChange}
                  disabled={uploading}
                />
              </label>
            </div>
          </div>
          {error && <p className="text-red-400 mt-3 text-sm">{error}</p>}
        </div>
      </div>
    </div>
  );
}
