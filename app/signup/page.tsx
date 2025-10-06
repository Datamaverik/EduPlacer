'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import React from "react";

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const query = `
      mutation Signup($data: SignupInput!) {
        signup(data: $data) {
          token
          user { id name email }
        }
      }
    `
    const res = await fetch('/api/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { data: { name, email, password } } })
    })
    const j = await res.json()
    if (j.errors) {
      setError(j.errors[0]?.message || 'Error')
      return
    }
    const token = j.data.signup.token
    // demo: store token in localStorage (NOT HttpOnly) — for production prefer HttpOnly cookies
    localStorage.setItem('token', token)
    router.push('/dashboard')
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Signup</h1>
      <form onSubmit={submit}>
        <div><input required value={name} onChange={e=>setName(e.target.value)} placeholder="Name" /></div>
        <div><input required value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" type="email" /></div>
        <div><input required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" type="password" /></div>
        <button type="submit">Signup</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </main>
  )
}
