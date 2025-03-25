"use client"
import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import "remixicon/fonts/remixicon.css";
import { localCardListAtom } from '@/lib/atom';
import { Provider, useSetAtom } from 'jotai';
import { Footer } from './footer';
import { UnloginHeader, LoginedHeader } from './header';
import { useHtmlBg } from '@/hooks/use-html-bg';

export default function LayoutClient({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const pathname = usePathname();
    const setLocalCardList = useSetAtom(localCardListAtom);
    useHtmlBg();
    // const dispatch = useDispatch();

    const currentRoute = pathname.split('/').pop() || '';

    const noNavPaths = ["exam", "login", "payment-result"];
    const noNav = noNavPaths.includes(currentRoute);

    const unloginHeaderPaths = ["home", "guide", "pricing", "privacy-policy", "terms-of-service", "business-disclosure"];
    const unloginHeader = unloginHeaderPaths.includes(currentRoute);

    useEffect(() => {
        setLocalCardList([]);
        return () => {
            setLocalCardList([]);
        }
    }, [pathname]);

    return (
        <Provider>
            {
                unloginHeader
                    ? <UnloginHeader />
                    : noNav
                        ? null
                        : <LoginedHeader />
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
        </Provider>
    )
}
