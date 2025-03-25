"use client"
import type React from "react"
import { useState } from "react"
import { Button } from "ui/components/button"
import { Input } from "ui/components/input"
import { Icons } from "@/components/icons"
import { useTranslation } from "react-i18next"
import "../i18n" // 导入i18n配置

export default function ApiKeyForm({
  initialApiKey = "",
  onSaved
}: {
  initialApiKey: string
  onSaved?: () => void
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [apiKey, setApiKey] = useState(initialApiKey)
  const { t } = useTranslation();

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setIsLoading(true)

    try {
      await chrome.storage.local.set({ openai_api_key: apiKey })
      setIsLoading(false)
      onSaved?.()  // 调用保存成功的回调函数
    } catch (error) {
      console.error('保存API Key失败:', error)
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Input
            type="password"
            placeholder={t('loginPage.apiKey.placeholder')}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            disabled={isLoading}
          />
          <p className="text-muted-foreground text-sm">
            {t('loginPage.apiKey.visitPage')}{" "}
            <a
              href="https://platform.openai.com/account/api-keys"
              target="_blank"
              className="text-primary hover:text-muted-foreground underline underline-offset-4"
            >
              {t('loginPage.apiKey.officialPage')}
            </a>{" "}
            {t('loginPage.apiKey.toObtain')}
          </p>
        </div>
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading && <Icons.spinner className="mr-2 w-4 h-4 animate-spin" />}
          {t('loginPage.apiKey.saveSettings')}
        </Button>
      </form>
    </div>
  )
}

