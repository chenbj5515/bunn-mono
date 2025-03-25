import { createAuthClient } from "better-auth/react"

export const authClient: ReturnType<typeof createAuthClient> = createAuthClient({
    baseURL: "http://localhost:3000" // the base url of your auth server
})

export const signIn = async (type: "github" | "google", options?: { callbackUrl?: string }) => {
    const data = await authClient.signIn.social({
        provider: type,
        callbackURL: options?.callbackUrl
    })
}
export const signOut = async () => {
    const data = await authClient.signOut()
}
export const { signUp, useSession } = createAuthClient()
