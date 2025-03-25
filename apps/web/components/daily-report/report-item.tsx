import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function ReportItem(props: { date: string }) {
    const { date } = props;
    const [hovered, setHovered] = useState(false);
    const router = useRouter();

    function handleClick() {
        const query = new URLSearchParams({ date }).toString();
        router.push(`/daily-report?${query}`);
    }

    return (
        <li
            key={date}
            className={`flex items-center justify-between p-2 rounded cursor-pointer ${hovered ? 'dark:bg-[#b2b3b5] bg-[#f3f4f6] dark:text-[black]' : ''}`}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={handleClick}
        >
            {date}
        </li>
    )
}