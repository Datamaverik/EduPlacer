"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import React from "react";
import { BackgroundBeams } from "../../components/ui/background-beams";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const query = `
      mutation Signup($data: SignupInput!) {
        signup(data: $data) {
          token
          user { id name email }
        }
      }
    `;
    const res = await fetch("/api/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        variables: { data: { name, email, password } },
      }),
    });
    const j = await res.json();
    if (j.errors) {
      setError(j.errors[0]?.message || "Error");
      return;
    }
    const token = j.data.signup.token;
    // demo: store token in localStorage (NOT HttpOnly) — for production prefer HttpOnly cookies
    localStorage.setItem("token", token);
    router.push("/dashboard");
  }

  return (
    <div className="w-full h-[100vh] bg-neutral-950 relative flex flex-col items-center justify-center antialiased">
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="relative z-10 text-lg md:text-7xl  bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-600  text-center font-sans font-bold">
          Sign up
        </h1>
        <p></p>
        <p className="text-neutral-500 max-w-lg mx-auto my-2 text-sm text-center relative z-10">
          Welcome to EduPlacer. Sign up to create your account and manage your
          educational placement journey.
        </p>
        <p className="text-neutral-500 max-w-lg mx-auto my-2 text-sm text-center relative z-10">
          Already have an account ?{" "}
          <a
            href="/login"
            className="text-teal-500 hover:text-teal-400 underline"
          >
            Log in instead
          </a>
        </p>
        <form
          className="text-xl flex w-full flex-col items-center font-bold relative z-20 mt-2 text-white"
          onSubmit={submit}
        >
          <div className="mt-4 w-full relative z-20">
            <input
              className="rounded-lg border border-neutral-800 focus:ring-2 focus:ring-teal-500  w-full relative z-10 mt-4  bg-neutral-950 placeholder:text-neutral-700 p-2"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
            />
          </div>
          <div className="mt-4 w-full relative z-20">
            <input
              className="rounded-lg border border-neutral-800 focus:ring-2 focus:ring-teal-500  w-full relative z-10 mt-4  bg-neutral-950 placeholder:text-neutral-700 p-2"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              type="email"
            />
          </div>
          <div className="mt-4 w-full relative z-20">
            <input
              className="rounded-lg border border-neutral-800 focus:ring-2 focus:ring-teal-500  w-full relative z-10 mt-4  bg-neutral-950 placeholder:text-neutral-700 p-2"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              type="password"
            />
          </div>
          <button
            type="submit"
            className="inline-flex mt-8 h-12 animate-shimmer items-center justify-center rounded-md border border-neutral-800 bg-[linear-gradient(110deg,#000103,45%,#1e2631,55%,#000103)] bg-[length:200%_100%] px-6 font-medium text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50"
          >
            Signup
          </button>
        </form>
        {error && <p style={{ color: "red" }}>{error}</p>}
      </div>

      <BackgroundBeams />
    </div>
  );
}
