import { useEffect, useState } from "react"
// import { useTranslation } from "react-i18next"
// import { Key, UserCircle } from "lucide-react"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "ui/components/card"
// // import { Button } from "ui/components/button"
import { LanguageSelector } from "@/components/language-selector"
import Loading from "ui/components/loading"
// 正确导入client，根据实际路径调整
import { client } from "@server/lib/api-client"
import { UserMenu } from "./user-menu"
// import { UserMenu } from "@/popup/user-menu"
// import ApiKeyForm from "./api-key-form"
// import AuthForm from "./auth-form"
// import UsageGuide from "./usage-guide"
// import SubscriptionPrompt from "./subscription-prompt"
// import "../i18n" // 导入i18n配置

// 根据新接口返回格式定义接口
export interface SessionResponse {
  success: boolean;
  data?: {
    session: {
      user: {
        id: string;
        name: string;
        email: string;
        image?: string;
      }
    };
    subscription: {
      active: boolean;
      expireAt: string | null;
    }
  };
  message?: string;
}

// 定义用户类型
export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  subscriptionActive: boolean;
  expireAt: string | null;
}

export default function SettingsPage() {
  // 保存用户信息，若无法获取则为 null
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasStoredApiKey, setHasStoredApiKey] = useState(false)
  const [storedApiKey, setStoredApiKey] = useState("")  // 新增状态来存储 API key
  // const { t } = useTranslation();

  // 使用client调用新的/users/session接口
  useEffect(() => {
    client.api.user.session.$get()
      .then(async (response) => {
        // 从Hono客户端响应中获取JSON数据
        const responseData = await response.json();
        
        // 类型守卫：检查是否有success和data属性
        if (responseData.success && 'data' in responseData) {
          const data = responseData.data;
          const { session, subscription } = data;
          
          // 合并session和subscription数据到用户对象
          const userData: User = {
            id: session.user.id,
            name: session.user.name,
            email: session.user.email,
            image: session.user.image || undefined,
            subscriptionActive: subscription.active,
            expireAt: subscription.expireAt
          };
          
          console.log(userData, "user data from session API");
          setUser(userData);
        }
        setLoading(false);
      })
      .catch((err: unknown) => {
        console.error("获取用户信息失败：", err);
        setLoading(false);
      });
  }, []);

  // 修改检查 chrome storage 的 useEffect
  useEffect(() => {
    chrome.storage.local.get(['openai_api_key'], (result) => {
      setHasStoredApiKey(!!result.openai_api_key)
      setStoredApiKey(result.openai_api_key || "") // 保存 API key 的值
    })
  }, [])

  // 点击"订阅引导"时，打开新的 tab 访问订阅引导页（替换下面的 URL）
  // const handleSubscribeGuide = () => {
  //   window.open("https://your-subscription-guide-url.com", "_blank")
  // }

  if (loading) {
    return <Loading />
  }

  return (
    <div className="mx-auto px-4 py-4 w-[360px] max-w-4xl font-mono container">
      {/* 顶部导航栏：语言选择器在左，用户菜单在右，两者垂直居中 */}
      <div className="flex justify-between items-center mb-4">
        {user && <UserMenu user={user} />}
        <LanguageSelector /> 
      </div>
    </div>
  )
}