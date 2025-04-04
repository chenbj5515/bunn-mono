import { NextRequest, NextResponse } from "next/server";
import { getUserSubscription } from "@server/server-functions/get-subscription";

export async function GET(req: NextRequest) {
    try {
        // 使用提取的函数获取用户会话和订阅信息
        const userData = await getUserSubscription()

        return NextResponse.json({
            success: true,
            data: userData
        })
    } catch (error) {
        console.error('获取session出错:', error)
        // 如果是用户未登录错误，返回401状态码
        if (error instanceof Error && error.message === '用户未登录') {
            return NextResponse.json({
                success: false,
                message: '用户未登录'
            }, { status: 401 })
        }

        return NextResponse.json({
            success: false,
            message: '获取session失败'
        }, { status: 500 })
    }
} 