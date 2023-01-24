
export function timeDifferenceString(lastAccessed) {
    const timeDifference = Date.now() - lastAccessed;
    let secondsDiff = timeDifference / 60000;
    let minutesDiff = secondsDiff / 60;
    let hoursDiff = minutesDiff / 60;
    let daysDiff = hoursDiff / 24;

    let timeString;
    if (daysDiff >= 1) {
        timeString = `${Math.floor(daysDiff)} days ago`;
    } else if (hoursDiff >= 1) {
        timeString = `${Math.floor(hoursDiff)} hours ago`;
    } else if (minutesDiff >= 1) {
        timeString = `${Math.floor(minutesDiff)} minutes ago`;
    } else {
        timeString = "just now";
    }
    return timeString;
}
