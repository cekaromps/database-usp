"use client"

import { signupAction } from "@/app/actions/auth"
import { useState } from "react"

export default function SignUpPage() {
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)
    // Server actions return plain strings/objects, no JSON parsing needed!
    const errorMessage = await signupAction(formData)

    if (errorMessage) {
      setError(errorMessage)
    }
  }

  return (
    <div style={{ maxWidth: "400px", margin: "100px auto", padding: "20px" }}>
      <h1>Sign Up</h1>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <input name="username" type="text" placeholder="Username" required style={{ padding: "8px" }} />
        <input name="password" type="password" placeholder="Password" required style={{ padding: "8px" }} />
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit" style={{ padding: "10px", background: "blue", color: "white" }}>
          Register
        </button>
      </form>
    </div>
  )
}
