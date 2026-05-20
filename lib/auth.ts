import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
import { prisma } from "@/lib/prisma" // Your database client
import bcrypt from "bcryptjs"

// Overwrite or extend the authorize method with your Prisma database logic safely here
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    ...authConfig.providers.map((provider) => {
      if (provider.id === "credentials") {
        return {
          ...provider,
          async authorize(credentials:any) {
            if (!credentials?.username || !credentials?.password) return null

            const user = await prisma.user.findUnique({
              where: { username: credentials.username as string }
            })

            if (!user) return null

            const isValid = await bcrypt.compare(
              credentials.password as string,
              user.password
            )

            if (!isValid) return null
            return { id: user.id, name: user.username }
          }
        }
      }
      return provider
    })
  ]
})
