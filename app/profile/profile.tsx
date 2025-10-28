"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SparklesCore } from "../../components/ui/sparkles";
import { PixelatedCanvas } from "../../components/ui/pixelated-canvas";

export default function ProfilePage() {
  const router = useRouter();
  const [me, setMe] = useState<{
    id: string;
    name: string;
    email: string;
    imageUrl: string;
    role: string;
    yearOfStudy?: number | null;
    branch?: string | null;
    domain?: string | null;
    companies: string[];
    companiesInterested: string[];
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
      const query = `query { me { id name email imageUrl role yearOfStudy domain branch companies companiesInterested } }`;
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
    <div className="min-h-screen max-h-[100vh] w-full bg-neutral-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="bg-neutral-900 rounded-lg p-6 border border-neutral-800">
          <div className="flex justify-center items-center gap-6 mb-6">
            <div className="mx-auto mt-8">
              <PixelatedCanvas
                src={me?.imageUrl || "/images/placeholder-avatar.svg"}
                width={300}
                height={300}
                cellSize={2}
                dotScale={0.8}
                shape="square"
                backgroundColor="rgb(23 23 23)"
                dropoutStrength={0}
                interactive
                distortionStrength={15}
                distortionRadius={80}
                distortionMode="attract"
                followSpeed={0.4}
                jitterStrength={5}
                jitterSpeed={5}
                sampleAverage
                fadeOnLeave
                tintColor="#FFFFFF"
                tintStrength={0}
                className="rounded-xl border border-neutral-800 shadow-lg"
              />
            </div>
            <div className="flex-1 ">
              <h2 className="text-6xl font-semibold mb-1">{me?.name ?? ""}</h2>
              <p className="text-neutral-400 mb-3">{me?.email ?? ""}</p>
              <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                <span className="px-4 py-2 rounded-md border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 transition-colors">
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

          {error && <p className="text-red-400 mb-4 text-sm">{error}</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-neutral-800">
            <div>
              <p className="text-sm text-neutral-500 mb-1">Role</p>
              <p className="font-medium">{me?.role ?? "—"}</p>
            </div>
            <div>
              <p className="text-sm text-neutral-500 mb-1">Year of Study</p>
              <p className="font-medium">{me?.yearOfStudy ?? "—"}</p>
            </div>
            <div>
              <p className="text-sm text-neutral-500 mb-1">Branch</p>
              <p className="font-medium">{me?.branch ?? "—"}</p>
            </div>
            <div>
              <p className="text-sm text-neutral-500 mb-1">Domain</p>
              <p className="font-medium">{me?.domain ?? "—"}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-neutral-500 mb-1">Current Companies</p>
              <p className="font-medium">
                {me?.companies && me.companies.length > 0
                  ? me.companies.join(", ")
                  : "—"}
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-neutral-500 mb-1">
                Companies Interested In
              </p>
              <p className="font-medium">
                {me?.companiesInterested && me.companiesInterested.length > 0
                  ? me.companiesInterested.join(", ")
                  : "—"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
