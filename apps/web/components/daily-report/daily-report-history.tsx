"use client"
import { Suspense } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "ui/components/accordion"
import { TooltipProvider } from 'ui/components/tooltip';
import { actionTypeEnum, relatedTypeEnum, userActionLogs } from '@db/schema';
import { use } from 'react';
import Loading from 'ui/components/loading';
import { ReportItem } from './report-item';
import { useLocale, useTranslations } from 'next-intl';
import { getMonthKey } from '@/utils/time';

interface MonthData {
    month: string;
    dates: string[];
}

interface IProps {
    logsPromise: Promise<typeof userActionLogs.$inferSelect[]>
}

function processLogsData(logs: Awaited<IProps['logsPromise']>, locale: string): MonthData[] {
    const dateMap = new Map<string, Set<string>>();

    // 按月份收集日期
    logs.forEach(log => {
        const date = new Date(log.createTime);
        const monthKey = getMonthKey(date.getFullYear(), date.getMonth() + 1, locale);
        const dateStr = date.toISOString().split('T')[0];

        if (!dateMap.has(monthKey)) {
            dateMap.set(monthKey, new Set());
        }
        dateMap.get(monthKey)?.add(dateStr);
    });

    // 转换成数组格式
    const monthlyData: MonthData[] = Array.from(dateMap).map(([month, dates]) => ({
        month,
        dates: Array.from(dates).sort()
    }));

    // 按月份倒序排序
    return monthlyData.sort((a, b) => b.month.localeCompare(a.month));
}

function DailyReportContent({ logsPromise }: IProps) {
    const logs = use(logsPromise);
    const locale = useLocale();
    const monthlyData = processLogsData(logs, locale);
    const t = useTranslations('dailyReport');

    return (
        <div className="m-auto p-4 max-w-[768px]">
            <h2 className="mb-4 font-semibold text-xl">{t('history.title')}</h2>
            <div className="p-4 border rounded-md">
                <Accordion type="single" collapsible className="w-full" defaultValue="item-0">
                    {monthlyData.map((monthData, index) => (
                        <AccordionItem value={`item-${index}`} key={index}>
                            <AccordionTrigger>{monthData.month}</AccordionTrigger>
                            <AccordionContent>
                                <ul className="space-y-2">
                                    {monthData.dates.map((date) => (
                                        <ReportItem date={date} key={date} />
                                    ))}
                                </ul>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </div>
    )
}

export default function DailyReportHistory(props: IProps) {
    return (
        <TooltipProvider>
            <Suspense fallback={<Loading />}>
                <DailyReportContent {...props} />
            </Suspense>
        </TooltipProvider>
    )
}
