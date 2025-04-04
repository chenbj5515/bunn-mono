import ky from 'ky'

const baseUrl =
    process.env.NODE_ENV === 'development'
        ? 'http://localhost:3000'
        : process.env.NEXT_PUBLIC_APP_URL!

export const fetch = ky.extend({
    hooks: {
        afterResponse: [
            async (_, __, response: Response) => {
                if (response.ok) {
                    return response
                } else {
                    throw await response.json()
                }
            },
        ],
    },
})

// 定义API客户端
export const api = {
    ai: {
        generateText: async (prompt: string, model = 'gpt-4o-mini') => {
            return fetch.post(`${baseUrl}/api/ai/generate-text`, {
                json: { prompt, model }
            }).json()
        },
        generateTextStream: async (prompt: string, model = 'gpt-4o-mini') => {
            return fetch.post(`${baseUrl}/api/ai/generate-text-stream`, {
                json: { prompt, model }
            })
        },
        extractSubtitles: async (imageFile: File) => {
            const formData = new FormData()
            formData.append('image', imageFile)
            return fetch.post(`${baseUrl}/api/ai/extract-subtitles`, {
                body: formData
            }).json()
        }
    },
    user: {
        getSession: async () => {
            return fetch.get(`${baseUrl}/api/user/session`).json()
        }
    },
    stripe: {
        createPortal: async (locale = 'zh') => {
            return fetch.post(`${baseUrl}/api/stripe/portal`, {
                json: { locale }
            }).json()
        }
    }
}
