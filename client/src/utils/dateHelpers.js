export const getMonthName = (monthIndex) => {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthIndex];
};

export const getPreviousMonth = (currentDate) => {
    const date = new Date(currentDate);
    date.setMonth(date.getMonth() - 1);
    return date;
};

export const getNextMonth = (currentDate) => {
    const date = new Date(currentDate);
    date.setMonth(date.getMonth() + 1);
    return date;
};

export const formatMonthYear = (date) => {
    return `${getMonthName(date.getMonth())} ${date.getFullYear()}`;
};
