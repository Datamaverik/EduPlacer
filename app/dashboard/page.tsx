"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CometCard } from "../../components/ui/comet-card";

type Role = "MENTOR" | "MENTEE";

export function SparklesPreview() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [recommended, setRecommended] = useState<any[]>([]);
  const [searchFilter, setSearchFilter] = useState({
    name: "",
    domain: "",
    branch: "",
    yearOfStudy: "",
  });
  // We will reuse the recommended list to show search results as well

  const [mentees, setMentees] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);

  useEffect(() => {
    async function fetchMe() {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      const query = `query Me { me { id name email role domain branch yearOfStudy companies companiesInterested } }`;
      const res = await fetch("/api/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query }),
      });
      const j = await res.json();
      if (j.errors) {
        localStorage.removeItem("token");
        router.push("/login");
        return;
      }
      setUser(j.data.me);
      setLoading(false);
      if (j.data.me?.role === "MENTEE") {
        await fetchRecommended();
      } else if (j.data.me?.role === "MENTOR") {
        await fetchMentorData();
      }
    }
    fetchMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function fetchRecommended() {
    const token = localStorage.getItem("token");
    if (!token) return;
    const query = `query Recommended { recommendedMentors { id name email imageUrl domain branch yearOfStudy companies } }`;
    const res = await fetch("/api/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query }),
    });
    const j = await res.json();
    if (!j.errors) setRecommended(j.data.recommendedMentors || []);
  }

  async function searchMentors() {
    const token = localStorage.getItem("token");
    if (!token) return;
    const filter: any = { role: "MENTOR" };
    if (searchFilter.name) filter.name = searchFilter.name;
    if (searchFilter.domain) filter.domain = searchFilter.domain;
    if (searchFilter.branch) filter.branch = searchFilter.branch;
    if (searchFilter.yearOfStudy)
      filter.yearOfStudy = Number(searchFilter.yearOfStudy);
    const query = `query Search($filter: UserFilter) { searchUsers(filter: $filter) { id name email imageUrl domain branch yearOfStudy companies } }`;
    const res = await fetch("/api/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query, variables: { filter } }),
    });
    const j = await res.json();
    if (j.errors) setError(j.errors[0]?.message || "Search error");
    else setRecommended(j.data.searchUsers || []);
  }

  async function sendRequest(mentorId: string) {
    const token = localStorage.getItem("token");
    if (!token) return;
    const query = `mutation Send($mentorId: String!) { sendFollowRequest(mentorId: $mentorId) }`;
    const res = await fetch("/api/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query, variables: { mentorId } }),
    });
    const j = await res.json();
    if (j.errors) setError(j.errors[0]?.message || "Failed to send request");
    else alert("Request sent");
  }

  async function fetchMentorData() {
    const token = localStorage.getItem("token");
    if (!token) return;
    const query = `query M { myMentees { id name email branch domain yearOfStudy } myPendingRequests { mentee { id name email } } }`;
    const res = await fetch("/api/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query }),
    });
    const j = await res.json();
    if (!j.errors) {
      setMentees(j.data.myMentees || []);
      setPending(j.data.myPendingRequests || []);
    }
  }

  async function respond(menteeId: string, action: "ACCEPT" | "REJECT") {
    const token = localStorage.getItem("token");
    if (!token) return;
    const query = `mutation R($menteeId: String!, $action: RequestAction!) { respondFollowRequest(menteeId: $menteeId, action: $action) }`;
    const res = await fetch("/api/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query, variables: { menteeId, action } }),
    });
    const j = await res.json();
    if (j.errors) setError(j.errors[0]?.message || "Action failed");
    else await fetchMentorData();
  }

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;

  return (
    <div className="min-h-screen w-full bg-black flex flex-col items-center overflow-y-auto scrollbar-hide">
      {error && <p className="text-red-400 mt-4">{error}</p>}

      {user?.role === "MENTEE" && (
        <div className="w-full max-w-5xl px-6 mt-8 text-white">
          <h2 className="text-2xl font-semibold mt-8 mb-2">Search mentors</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <input
              className="rounded-lg border border-neutral-800 bg-neutral-950 p-2"
              placeholder="Name"
              value={searchFilter.name}
              onChange={(e) =>
                setSearchFilter({ ...searchFilter, name: e.target.value })
              }
            />
            <select
              className="rounded-lg border border-neutral-800 bg-neutral-950 p-2"
              value={searchFilter.domain}
              onChange={(e) =>
                setSearchFilter({ ...searchFilter, domain: e.target.value })
              }
            >
              <option value="">Domain</option>
              <option value="SOFTWARE">Software</option>
              <option value="MANAGEMENT">Management</option>
              <option value="MARKETING">Marketing</option>
              <option value="ANALYST">Analyst</option>
              <option value="OTHER">Other</option>
            </select>
            <select
              className="rounded-lg border border-neutral-800 bg-neutral-950 p-2"
              value={searchFilter.branch}
              onChange={(e) =>
                setSearchFilter({ ...searchFilter, branch: e.target.value })
              }
            >
              <option value="">Branch</option>
              <option value="CSE">CSE</option>
              <option value="ECE">ECE</option>
              <option value="ICE">ICE</option>
              <option value="MME">MME</option>
              <option value="EEE">EEE</option>
              <option value="OTHER">Other</option>
            </select>
            <input
              className="rounded-lg border border-neutral-800 bg-neutral-950 p-2"
              placeholder="Year"
              value={searchFilter.yearOfStudy}
              onChange={(e) =>
                setSearchFilter({
                  ...searchFilter,
                  yearOfStudy: e.target.value,
                })
              }
            />
          </div>
          <button
            onClick={searchMentors}
            className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-sm"
          >
            Search
          </button>
          {/* Search results now replace the recommended list above */}
          <h2 className="text-2xl text-center mt-4 font-semibold">
            Recommended mentors
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommended.map((m) => (
              <CometCard key={m.id} className="w-80">
                <button
                  type="button"
                  className="my-10 flex w-full cursor-pointer flex-col items-stretch rounded-[16px] border-0 bg-[#1F2121] p-2 md:my-8 md:p-4"
                  aria-label="View invite F7RA"
                  style={{
                    transformStyle: "preserve-3d",
                    transform: "none",
                    opacity: 1,
                  }}
                >
                  <div className="mx-2 flex justify-center">
                    <div className="relative mt-2 aspect-[3/4] w-full">
                      <img
                        loading="lazy"
                        className="absolute inset-0 h-full w-full rounded-[16px] bg-[#000000] object-cover contrast-75"
                        alt="Invite background"
                        src={m?.imageUrl || "/images/placeholder-avatar.svg"}
                        style={{
                          boxShadow: "rgba(0, 0, 0, 0.05) 0px 5px 6px 0px",
                          opacity: 1,
                        }}
                      />
                    </div>
                  </div>
                  <div className="font-mono mt-1 text-white">
                    <div>{m.name}</div>
                    <div className="text-sm text-neutral-400">{m.email}</div>
                    <div className="text-xs text-neutral-500">
                      {m.domain || "-"} · {m.branch || "-"} ·{" "}
                      {m.yearOfStudy || "-"}
                    </div>
                    <button
                      onClick={() => sendRequest(m.id)}
                      className="inline-flex mt-2 h-12 animate-shimmer items-center justify-center rounded-md border border-slate-800 bg-[linear-gradient(110deg,#000103,45%,#1e2631,55%,#000103)] bg-[length:200%_100%] px-6 font-medium text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50"
                    >
                      Request
                    </button>
                  </div>
                </button>
              </CometCard>
            ))}
          </div>

          {recommended.length === 0 && (
            <div className="text-neutral-500">No recommendations yet.</div>
          )}
        </div>
      )}

      {user?.role === "MENTOR" && (
        <div className="w-full max-w-5xl px-6 mt-8 text-white">
          <h2 className="text-2xl font-semibold mb-2">Your mentees</h2>
          <ul className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {mentees.map((m) => (
                <CometCard className="w-80">
                  <button
                    type="button"
                    className="my-10 flex w-80 cursor-pointer flex-col items-stretch rounded-[16px] border-0 bg-[#1F2121] p-2 md:my-7 md:p-4"
                    aria-label="View invite F7RA"
                    style={{
                      transformStyle: "preserve-3d",
                      transform: "none",
                      opacity: 1,
                    }}
                  >
                    <div className="mx-2 flex justify-center">
                      <div className="relative mt-2 aspect-[3/4] w-full">
                        <img
                          loading="lazy"
                          className="absolute inset-0 h-full w-full rounded-[16px] bg-[#000000] object-cover contrast-75"
                          alt="Invite background"
                          src={m?.imageUrl || "/images/placeholder-avatar.svg"}
                          style={{
                            boxShadow: "rgba(0, 0, 0, 0.05) 0px 5px 6px 0px",
                            opacity: 1,
                          }}
                        />
                      </div>
                    </div>
                    <div className="font-mono text-white">
                      <div className="font-medium">{m.name}</div>
                      <div className="text-sm text-neutral-400">{m.email}</div>
                      <div className="text-xs text-neutral-500">
                        {m.domain || "-"} · {m.branch || "-"} ·{" "}
                        {m.yearOfStudy || "-"}
                      </div>
                    </div>
                  </button>
                </CometCard>
              ))}
            </div>
            {mentees.length === 0 && (
              <li className="text-neutral-500">No mentees yet.</li>
            )}
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-2">Pending requests</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {pending.map((r) => (
              <CometCard className="w-80">
                <div
                  className="my-10 flex w-80 cursor-pointer flex-col items-stretch rounded-[16px] border-0 bg-[#1F2121] p-2 md:my-7 md:p-4"
                  aria-label="View invite F7RA"
                  style={{
                    transformStyle: "preserve-3d",
                    transform: "none",
                    opacity: 1,
                  }}
                >
                  <div className="mx-2 flex justify-center">
                    <div className="relative mt-2 aspect-[3/4] w-full">
                      <img
                        loading="lazy"
                        className="absolute inset-0 h-full w-full rounded-[16px] bg-[#000000] object-cover contrast-75"
                        alt="Invite background"
                        src={r?.imageUrl || "/images/placeholder-avatar.svg"}
                        style={{
                          boxShadow: "rgba(0, 0, 0, 0.05) 0px 5px 6px 0px",
                          opacity: 1,
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="font-medium">{r.mentee.name}</div>
                    <div className="text-sm text-neutral-400">
                      {r.mentee.email}
                    </div>
                    <div className="space-x-2">
                      <button
                        onClick={() => respond(r.mentee.id, "ACCEPT")}
                        className="text-sm px-3 py-1 rounded bg-teal-600 hover:bg-teal-500"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => respond(r.mentee.id, "REJECT")}
                        className="text-sm px-3 py-1 rounded bg-rose-600 hover:bg-rose-500"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              </CometCard>
            ))}
            {pending.length === 0 && (
              <li className="text-neutral-500">No requests.</li>
            )}
          </div>
        </div>
      )}

      <div className="h-12" />
    </div>
  );
}

export default SparklesPreview;
