// ===== 盈亏计算模块 =====

class ProfitCalculator {
    constructor() {
        this.payoutRate = CONFIG.PAYOUT_RATE;
    }

    // 设置赔率
    setPayoutRate(rate) {
        if (rate && rate > 0) {
            this.payoutRate = parseInt(rate);
            // 同时更新配置
            CONFIG.PAYOUT_RATE = this.payoutRate;
            return true;
        }
        return false;
    }

    // 获取当前赔率
    getPayoutRate() {
        return this.payoutRate;
    }

    // 计算盈亏
    calculate(winningNumbers, bets) {
        if (!winningNumbers || winningNumbers.length === 0) {
            return {
                totalReceived: 0,
                totalPayout: 0,
                profit: 0,
                winningBets: [],
                message: '请输入开奖号码'
            };
        }

        // 标准化中奖号码
        const normalizedWinningNumbers = winningNumbers.map(num => {
            return typeof num === 'string' ? parseInt(num) : num;
        }).filter(num => num >= 1 && num <= 49);

        // 计算总收款
        const totalReceived = bets.reduce((sum, bet) => sum + bet.amount, 0);

        // 计算赔付金额
        let totalPayout = 0;
        const winningBets = [];

        bets.forEach(bet => {
            const matchedNumbers = bet.numbers.filter(num =>
                normalizedWinningNumbers.includes(num)
            );

            if (matchedNumbers.length > 0) {
                // 每个中奖号码的赔付 = (投注总额 / 号码数量) × 赔率
                const singleBetAmount = bet.amount / bet.numbers.length;
                const payoutForThisBet = singleBetAmount * this.payoutRate * matchedNumbers.length;

                totalPayout += payoutForThisBet;

                winningBets.push({
                    betId: bet.id,
                    numbers: matchedNumbers,
                    payout: payoutForThisBet,
                    rawText: bet.rawText
                });
            }
        });

        // 计算盈亏
        const profit = totalReceived - totalPayout;

        return {
            totalReceived,
            totalPayout,
            profit,
            winningBets,
            winningNumbers: normalizedWinningNumbers,
            message: profit >= 0 ? '今日盈利' : '今日亏损'
        };
    }

    // 格式化盈亏结果
    formatResult(result) {
        return {
            totalReceived: formatMoney(result.totalReceived),
            totalPayout: formatMoney(result.totalPayout),
            profit: formatMoney(result.profit),
            isProfit: result.profit >= 0,
            winningCount: result.winningBets.length,
            message: result.message
        };
    }

    // 生成盈亏报告
    generateReport(result) {
        const formatted = this.formatResult(result);

        return {
            ...formatted,
            timestamp: getCurrentTimestamp(),
            date: getCurrentDate(),
            winningNumbers: result.winningNumbers.map(formatNumber).join(', '),
            winningDetails: result.winningBets.map(bet => ({
                numbers: bet.numbers.map(formatNumber).join(', '),
                payout: formatMoney(bet.payout),
                rawText: bet.rawText
            }))
        };
    }
}

// 导出计算器
const calculator = new ProfitCalculator();
