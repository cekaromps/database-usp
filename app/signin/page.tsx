"use client"

import { loginAction } from "@/app/actions/auth"
import { useState } from "react"

export default function SignInPage() {
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)
    const errorMessage = await loginAction(formData)

    if (errorMessage) {
      setError(errorMessage)
    }
  }

  return (
    <div style={{ maxWidth: "400px", margin: "100px auto", padding: "20px" }}>
      <h1>Sign In</h1>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <input name="username" type="text" placeholder="Username" required style={{ padding: "8px" }} />
        <input name="password" type="password" placeholder="Password" required style={{ padding: "8px" }} />
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit" style={{ padding: "10px", background: "green", color: "white" }}>
          Log In
        </button>
      </form>
    </div>
  )
}
