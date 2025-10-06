'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const query = `
      mutation Login($data: LoginInput!) {
        login(data: $data) {
          token
          user { id name email }
        }
      }
    `
    const res = await fetch('/api/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { data: { email, password } } })
    })
    const j = await res.json()
    if (j.errors) {
      setError(j.errors[0]?.message || 'Error')
      return
    }
    const token = j.data.login.token
    localStorage.setItem('token', token)
    router.push('/dashboard')
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Login</h1>
      <form onSubmit={submit}>
        <div><input required value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" type="email" /></div>
        <div><input required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" type="password" /></div>
        <button type="submit">Login</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </main>
  )
}
