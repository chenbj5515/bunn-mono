"use client"
import React from 'react';
import { usePathname } from 'next/navigation';
import "remixicon/fonts/remixicon.css";
import { Footer } from './footer';
import { UnloginHeader, LoginedHeader } from './header';
import { useHtmlBg } from '@/hooks/use-html-bg';
import { Dock } from '@/components/dock/dock';
import { useAddMemoCard } from '@/hooks/use-add-memo-card';

export default function LayoutClient({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const pathname = usePathname();

    useAddMemoCard();

    useHtmlBg();

    const currentRoute = pathname.split('/').pop() || '';

    const noNavPaths = ["exam", "login", "payment-result"];
    const noNav = noNavPaths.includes(currentRoute);

    const unloginHeaderPaths = ["home", "guide", "pricing", "privacy-policy", "terms-of-service", "business-disclosure"];
    const unloginHeader = unloginHeaderPaths.includes(currentRoute);

    return (
        <>
            {
                unloginHeader
                    ? <UnloginHeader />
                    : noNav
                        ? null
                        : <LoginedHeader />
            }
            {
                unloginHeader ? null : <Dock />
            }
            <div style={{
                paddingTop: noNav ? 0 : "64px",
                paddingBottom: unloginHeader ? "100px" : 0
            }}>
                {children}
            </div>
            {
                unloginHeader ? <Footer /> : null
            }
        </>
    )
}
