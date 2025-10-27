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
  const [role, setRole] = useState<"MENTOR" | "MENTEE">("MENTEE");
  const [yearOfStudy, setYearOfStudy] = useState<number | "">("");
  const [domain, setDomain] = useState<
    "SOFTWARE" | "MANAGEMENT" | "MARKETING" | "ANALYST" | "OTHER" | ""
  >("");
  const [branch, setBranch] = useState<
    "CSE" | "ECE" | "ICE" | "MME" | "EEE" | "OTHER" | ""
  >("");
  const [companies, setCompanies] = useState("");
  const [companiesInterested, setCompaniesInterested] = useState("");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const query = `
      mutation Signup($data: SignupInput!) {
        signup(data: $data) {
          token
          user { id name email role }
        }
      }
    `;
    const res = await fetch("/api/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        variables: {
          data: {
            name,
            email,
            password,
            role,
            yearOfStudy: yearOfStudy === "" ? null : Number(yearOfStudy),
            domain: domain === "" ? null : domain,
            branch: branch === "" ? null : branch,
            companies:
              role === "MENTOR"
                ? companies
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                : [],
            companiesInterested:
              role === "MENTEE"
                ? companiesInterested
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                : [],
          },
        },
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
    router.push("/landing");
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
          className="text-xl max-h-[65vh] flex w-full flex-col items-center font-bold relative z-20 mt-2 text-white"
          onSubmit={submit}
        >
          <div className="mt-4 w-full relative z-20">
            <label className="block text-sm text-neutral-400">Role</label>
            <select
              className="rounded-lg border border-neutral-800 focus:ring-2 focus:ring-teal-500  w-full relative z-10 mt-1  bg-neutral-950 placeholder:text-neutral-700 p-2"
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
            >
              <option value="MENTEE">Mentee</option>
              <option value="MENTOR">Mentor</option>
            </select>
          </div>
          <div className="mt-4 w-full relative z-20">
            <input
              className="rounded-lg border border-neutral-800 focus:ring-2 focus:ring-teal-500  w-full relative z-10 mt-2  bg-neutral-950 placeholder:text-neutral-700 p-2"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
            />
          </div>
          <div className="mt-2 w-full relative z-20">
            <input
              className="rounded-lg border border-neutral-800 focus:ring-2 focus:ring-teal-500  w-full relative z-10 mt-2  bg-neutral-950 placeholder:text-neutral-700 p-2"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              type="email"
            />
          </div>
          <div className="mt-2 w-full grid grid-cols-1 md:grid-cols-3 gap-3 relative z-20">
            <div>
              <input
                className="rounded-lg border border-neutral-800 focus:ring-2 focus:ring-teal-500  w-full relative z-10 mt-2  bg-neutral-950 placeholder:text-neutral-700 p-2"
                value={yearOfStudy}
                onChange={(e) =>
                  setYearOfStudy(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                placeholder="Year of Study (e.g., 3)"
                type="number"
                min={1}
                max={8}
              />
            </div>
            <div>
              <select
                className="rounded-lg border border-neutral-800 focus:ring-2 focus:ring-teal-500  w-full relative z-10 mt-2  bg-neutral-950 placeholder:text-neutral-700 p-2"
                value={domain}
                onChange={(e) => setDomain(e.target.value as any)}
              >
                <option value="">Domain</option>
                <option value="SOFTWARE">Software</option>
                <option value="MANAGEMENT">Management</option>
                <option value="MARKETING">Marketing</option>
                <option value="ANALYST">Analyst</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <select
                className="rounded-lg border border-neutral-800 focus:ring-2 focus:ring-teal-500  w-full relative z-10 mt-2  bg-neutral-950 placeholder:text-neutral-700 p-2"
                value={branch}
                onChange={(e) => setBranch(e.target.value as any)}
              >
                <option value="">Branch</option>
                <option value="CSE">CSE</option>
                <option value="ECE">ECE</option>
                <option value="ICE">ICE</option>
                <option value="MME">MME</option>
                <option value="EEE">EEE</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
          {role === "MENTOR" ? (
            <div className="mt-2 w-full relative z-20">
              <input
                className="rounded-lg border border-neutral-800 focus:ring-2 focus:ring-teal-500  w-full relative z-10 mt-2  bg-neutral-950 placeholder:text-neutral-700 p-2"
                value={companies}
                onChange={(e) => setCompanies(e.target.value)}
                placeholder="Companies (comma-separated)"
              />
            </div>
          ) : (
            <div className="mt-2 w-full relative z-20">
              <input
                className="rounded-lg border border-neutral-800 focus:ring-2 focus:ring-teal-500  w-full relative z-10 mt-2  bg-neutral-950 placeholder:text-neutral-700 p-2"
                value={companiesInterested}
                onChange={(e) => setCompaniesInterested(e.target.value)}
                placeholder="Companies Interested In (comma-separated)"
              />
            </div>
          )}
          <div className="mt-2 w-full relative z-20">
            <input
              className="rounded-lg border border-neutral-800 focus:ring-2 focus:ring-teal-500  w-full relative z-10 mt-2  bg-neutral-950 placeholder:text-neutral-700 p-2"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              type="password"
            />
          </div>
          <button
            type="submit"
            className="inline-flex mt-4 h-12 animate-shimmer items-center justify-center rounded-md border border-neutral-800 bg-[linear-gradient(110deg,#000103,45%,#1e2631,55%,#000103)] bg-[length:200%_100%] px-6 font-medium text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50"
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
