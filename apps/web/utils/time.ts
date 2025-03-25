export function getTimeAgo(date: string) {
    const ONE_MINUTE = 60 * 1000;
    const ONE_HOUR = 60 * ONE_MINUTE;
    const ONE_DAY = 24 * ONE_HOUR;
    const ONE_WEEK = 7 * ONE_DAY;
    const ONE_MONTH = 30 * ONE_DAY;

    const now = new Date().getTime();
    const inputDate = new Date(date).getTime();
    const timeDiff = now - inputDate;

    if (timeDiff < ONE_HOUR) {
        const minutes = Math.floor(timeDiff / ONE_MINUTE);
        return `${minutes}分钟前`;
    } else if (timeDiff < ONE_DAY) {
        const hours = Math.floor(timeDiff / ONE_HOUR);
        return `${hours}时前`;
    } else if (timeDiff < ONE_WEEK) {
        const days = Math.floor(timeDiff / ONE_DAY);
        return `${days}日前`;
    } else if (timeDiff < ONE_MONTH) {
        const weeks = Math.floor(timeDiff / ONE_WEEK);
        return `${weeks}周前`;
    } else {
        const months = Math.floor(timeDiff / ONE_MONTH);
        return `${months}月前`;
    }
}

export function formatDate(dateString: string) {
    const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
    ];
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = months[date.getMonth()];
    const day = date.getDate();
    return `${month} ${day}, ${year}`;
}

export function getMonthKey(year: number, month: number, locale: string): string {
    switch (locale) {
        case 'zh':
        case 'zh-TW':
            return `${year}年${month}月`;
        default: // 'en'
            const monthNames = [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
            ];
            return `${monthNames[month - 1]} ${year}`;
    }
}
