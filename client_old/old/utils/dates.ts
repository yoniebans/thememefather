export function getNextScanTime(): string {
    const now = new Date();
    const utcNow = new Date(now.getTime() + now.getTimezoneOffset() * 60000);

    // Set to today's 18:00 UTC
    const todayScan = new Date(Date.UTC(
        utcNow.getUTCFullYear(),
        utcNow.getUTCMonth(),
        utcNow.getUTCDate(),
        18, 0, 0, 0
    ));

    // If we're past today's scan, get tomorrow's
    if (utcNow > todayScan) {
        todayScan.setUTCDate(todayScan.getUTCDate() + 1);
    }

    return todayScan.toLocaleDateString();
} 