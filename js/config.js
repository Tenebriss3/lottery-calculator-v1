// ===== 系统配置常量 =====

const CONFIG = {
    // 赔率配置
    PAYOUT_RATE: 47,

    // 生肖与号码对应关系
    ZODIAC_MAP: {
        "马": [1, 13, 25, 37, 49],
        "蛇": [2, 14, 26, 38],
        "龙": [3, 15, 27, 39],
        "兔": [4, 16, 28, 40],
        "虎": [5, 17, 29, 41],
        "牛": [6, 18, 30, 42],
        "鼠": [7, 19, 31, 43],
        "猪": [8, 20, 32, 44],
        "狗": [9, 21, 33, 45],
        "鸡": [10, 22, 34, 46],
        "猴": [11, 23, 35, 47],
        "羊": [12, 24, 36, 48]
    },

    // 相冲属相关系
    CLASH_MAP: {
        "马": "鼠",
        "蛇": "猪",
        "龙": "狗",
        "兔": "鸡",
        "虎": "猴",
        "牛": "羊",
        "鼠": "马",
        "猪": "蛇",
        "狗": "龙",
        "鸡": "兔",
        "猴": "虎",
        "羊": "牛"
    },

    // 金额单位转换
    AMOUNT_UNITS: {
        "米": 1,
        "蚊": 1,
        "块": 1,
        "元": 1
    },

    // 生肖关键词
    ZODIAC_KEYWORDS: ["平特", "包", "特码"],

    // 所有生肖列表
    ALL_ZODIACS: ["鼠", "牛", "虎", "兔", "龙", "蛇", "马", "羊", "猴", "鸡", "狗", "猪"]
};

// 获取今日日期字符串
function getCurrentDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 获取当前时间戳
function getCurrentTimestamp() {
    const now = new Date();
    return now.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

// 格式化金额
function formatMoney(amount) {
    return '¥' + Number(amount).toLocaleString('zh-CN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
}

// 格式化号码为两位数
function formatNumber(num) {
    return String(num).padStart(2, '0');
}
