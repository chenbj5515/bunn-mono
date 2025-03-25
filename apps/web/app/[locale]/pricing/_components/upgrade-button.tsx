'use client'
import { useState } from "react"
import { Button } from "ui/components/button"
import { createCheckoutSession } from "../_server-functions/create-checkout-session"
import LoadingButton from "ui/components/loading-button"

export function UpgradeButton({ upgradeText }: { upgradeText: string }) {
  const [isLoading, setIsLoading] = useState(false)
  
  const handleUpgrade = async () => {
    try {
      setIsLoading(true)
      const { url } = await createCheckoutSession()
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      setIsLoading(false)
      console.error('Failed to create checkout session:', error)
    }
  }

  return (
    <LoadingButton isLoading={isLoading} onClick={handleUpgrade} className="mt-[30px] w-full">
      {upgradeText}
    </LoadingButton>
  )
}