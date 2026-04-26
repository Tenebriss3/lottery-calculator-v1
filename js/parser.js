// ===== 智能解析引擎 =====

class BetParser {
    constructor() {
        this.bets = [];
        this.numberStats = {};
        this.zodiacBets = [];
    }

    // 主解析方法
    parse(text) {
        if (!text || !text.trim()) {
            return { bets: [], numberStats: {}, zodiacBets: [] };
        }

        // 重置数据
        this.bets = [];
        this.numberStats = {};
        this.zodiacBets = [];

        // 按行分割
        const lines = text.split('\n').filter(line => line.trim());

        // 逐行解析
        lines.forEach(line => {
            this.parseLine(line.trim());
        });

        // 合并相同号码的统计
        this.aggregateStats();

        return {
            bets: this.bets,
            numberStats: this.numberStats,
            zodiacBets: this.zodiacBets
        };
    }

    // 解析单行 - 支持一行多条记录
    parseLine(line) {
        console.log('parseLine输入:', line);
        
        // 特殊处理: 如果包含"每个数",说明是特码格式,不要分割
        if (line.includes('每个数')) {
            console.log('检测到特码格式,直接解析');
            this.tryParseAllRules(line.trim());
            return;
        }
        
        // 策略1: 先尝试按"金额单位"分割(更准确)
        // 匹配模式: (米|蚊|块|元)后面跟着分隔符或直接结束
        const amountBasedSplit = this.splitByAmountPattern(line);
        
        console.log('策略1分割结果:', amountBasedSplit);
        
        if (amountBasedSplit.length > 1) {
            // 成功按金额分割,逐条解析
            amountBasedSplit.forEach(segment => {
                if (segment.trim()) {
                    console.log('解析片段:', segment.trim());
                    this.tryParseAllRules(segment.trim());
                }
            });
            return;
        }
        
        // 策略2: 如果无法按金额分割,尝试按标点符号分割(不包括冒号)
        const segments = line.split(/[。，,.]/).filter(s => s.trim());
        
        console.log('策略2分割结果:', segments);
        
        if (segments.length > 1) {
            segments.forEach(segment => {
                console.log('解析片段:', segment.trim());
                this.tryParseAllRules(segment.trim());
            });
        } else {
            // 只有一个子句,直接解析
            console.log('直接解析:', line.trim());
            this.tryParseAllRules(line.trim());
        }
    }

    // 按金额模式分割文本
    // 例如: "26.38各15米。33%27各10米" → ["26.38各15米", "33%27各10米"]
    splitByAmountPattern(text) {
        const segments = [];
        
        // 匹配模式: 数字+单位(米/蚊/块/元),后面可能跟着分隔符
        // 使用正则表达式找到所有"各XX米/蚊"的位置
        const pattern = /(各\s*\d+\s*(?:米|蚊|块|元)?)/g;
        let lastEnd = 0;
        let match;
        
        while ((match = pattern.exec(text)) !== null) {
            // 从上一个匹配结束到当前匹配结束作为一个片段
            const segment = text.substring(lastEnd, match.index + match[0].length);
            segments.push(segment);
            lastEnd = match.index + match[0].length;
            
            // 跳过后面的分隔符
            while (lastEnd < text.length && /[。，,.]/.test(text[lastEnd])) {
                lastEnd++;
            }
        }
        
        // 添加剩余部分
        if (lastEnd < text.length) {
            const remaining = text.substring(lastEnd).trim();
            if (remaining) {
                segments.push(remaining);
            }
        }
        
        return segments;
    }


    // 尝试所有解析规则
    tryParseAllRules(text) {
        if (!text || !text.trim()) return false;

        // 1. 尝试解析生肖投注
        if (this.tryParseZodiacBet(text)) {
            return true;
        }

        // 2. 尝试解析批量号码投注
        if (this.tryParseBatchBet(text)) {
            return true;
        }

        // 3. 尝试解析单个号码投注
        if (this.tryParseSingleBet(text)) {
            return true;
        }

        // 4. 尝试解析特码投注
        if (this.tryParseSpecialCodeBet(text)) {
            return true;
        }

        // 5. 尝试解析数字+中文金额格式(新规则)
        if (this.tryParseChineseAmountBet(text)) {
            return true;
        }

        return false;
    }

    // 尝试解析生肖投注
    tryParseZodiacBet(line) {
        // 匹配模式: 平特蛇2000, 包猪各25
        const zodiacPattern = /(平特|包|特码)?(鼠|牛|虎|兔|龙|蛇|马|羊|猴|鸡|狗|猪)(?:各)?(\d+)(米|蚊|块|元)?/;
        const match = line.match(zodiacPattern);

        if (match) {
            const [, prefix, zodiac, amountStr, unit] = match;
            const numbers = CONFIG.ZODIAC_MAP[zodiac];

            if (numbers) {
                let bet;
                
                // 判断是"各"还是总额
                if (line.includes('各')) {
                    // "包猪各25" - 每个号码25元
                    const amountPerNumber = this.parseAmount(amountStr, unit || '蚊');
                    const totalAmount = amountPerNumber * numbers.length;
                    
                    bet = {
                        id: this.bets.length + 1,
                        type: 'zodiac',
                        zodiac: zodiac,
                        numbers: numbers,
                        amount: totalAmount,
                        amountPerNumber: amountPerNumber,
                        rawText: line,
                        timestamp: getCurrentTimestamp()
                    };

                    // 更新号码统计 - 每个号码的金额
                    numbers.forEach(num => {
                        const numStr = formatNumber(num);
                        if (!this.numberStats[numStr]) {
                            this.numberStats[numStr] = { count: 0, totalAmount: 0 };
                        }
                        this.numberStats[numStr].count++;
                        this.numberStats[numStr].totalAmount += amountPerNumber;
                    });
                } else {
                    // "平特蛇2000" - 总额2000元,平均分配到每个号码
                    const totalAmount = this.parseAmount(amountStr, unit || '蚊');
                    const amountPerNumber = totalAmount / numbers.length;
                    
                    bet = {
                        id: this.bets.length + 1,
                        type: 'zodiac',
                        zodiac: zodiac,
                        numbers: numbers,
                        amount: totalAmount,
                        amountPerNumber: amountPerNumber,
                        rawText: line,
                        timestamp: getCurrentTimestamp()
                    };

                    // 更新号码统计
                    numbers.forEach(num => {
                        const numStr = formatNumber(num);
                        if (!this.numberStats[numStr]) {
                            this.numberStats[numStr] = { count: 0, totalAmount: 0 };
                        }
                        this.numberStats[numStr].count++;
                        this.numberStats[numStr].totalAmount += amountPerNumber;
                    });
                }

                this.bets.push(bet);
                this.zodiacBets.push(bet);

                return true;
            }
        }

        return false;
    }

    // 尝试解析批量号码投注
    tryParseBatchBet(line) {
        // 匹配模式: 26.38.41各15米, 新澳 26.38.41...各15米, 33%27%17各10米
        // "各"表示每个号码的金额,支持.%作为分隔符
        const batchPattern = /(?:[^0-9]*?)((?:\d{1,2}[.%\s]+)+\d{1,2})\s*各\s*(\d+)(米|蚊|块|元)?/;
        const match = line.match(batchPattern);

        if (match) {
            const [, numbersStr, amountStr, unit] = match;
            const numbers = this.extractNumbers(numbersStr);
            // "各20"表示每个号码20元,需要乘以号码数量得到总额
            const amountPerNumber = this.parseAmount(amountStr, unit || '蚊');
            const totalAmount = amountPerNumber * numbers.length;

            if (numbers.length > 0) {
                const bet = {
                    id: this.bets.length + 1,
                    type: 'batch',
                    numbers: numbers,
                    amount: totalAmount,
                    amountPerNumber: amountPerNumber,
                    rawText: line,
                    timestamp: getCurrentTimestamp()
                };

                this.bets.push(bet);

                // 更新号码统计 - 每个号码的金额就是amountPerNumber
                numbers.forEach(num => {
                    const numStr = formatNumber(num);
                    if (!this.numberStats[numStr]) {
                        this.numberStats[numStr] = { count: 0, totalAmount: 0 };
                    }
                    this.numberStats[numStr].count++;
                    this.numberStats[numStr].totalAmount += amountPerNumber;
                });

                return true;
            }
        }

        return false;
    }

    // 尝试解析单个号码投注
    tryParseSingleBet(line) {
        // 匹配模式: 25.=50米, 25=50米
        const singlePattern = /(\d{1,2})[.=]\s*(\d+)(米|蚊|块|元)/;
        const match = line.match(singlePattern);

        if (match) {
            const [, numStr, amountStr, unit] = match;
            const number = parseInt(numStr);
            const amount = this.parseAmount(amountStr, unit);

            if (number >= 1 && number <= 49) {
                const bet = {
                    id: this.bets.length + 1,
                    type: 'single',
                    numbers: [number],
                    amount: amount,
                    rawText: line,
                    timestamp: getCurrentTimestamp()
                };

                this.bets.push(bet);

                // 更新号码统计
                const formattedNum = formatNumber(number);
                if (!this.numberStats[formattedNum]) {
                    this.numberStats[formattedNum] = { count: 0, totalAmount: 0 };
                }
                this.numberStats[formattedNum].count++;
                this.numberStats[formattedNum].totalAmount += amount;

                return true;
            }
        }

        return false;
    }

    // 尝试解析特码投注
    tryParseSpecialCodeBet(line) {
        // 匹配模式: 新奥： 特码01,02,06...每个数5蚊 或 每个数20
        // 改进: 使用更宽松的匹配,支持各种分隔符
        const specialPattern = /特码[\s:：]*([0-9,\s.%、]+?)\s*每个数\s*(\d+)(米|蚊|块|元)?/;
        const match = line.match(specialPattern);

        if (match) {
            const [, numbersStr, amountStr, unit] = match;
            
            // 调试输出
            console.log('特码匹配成功:', {
                numbersStr,
                amountStr,
                unit
            });
            
            const numbers = this.extractNumbers(numbersStr);
            
            console.log('提取的号码:', numbers);
            
            // 如果没有单位,默认是"蚊"(元)
            const amountPerNumber = this.parseAmount(amountStr, unit || '蚊');

            if (numbers.length > 0) {
                const totalAmount = amountPerNumber * numbers.length;

                const bet = {
                    id: this.bets.length + 1,
                    type: 'special',
                    numbers: numbers,
                    amount: totalAmount,
                    amountPerNumber: amountPerNumber,
                    rawText: line,
                    timestamp: getCurrentTimestamp()
                };

                this.bets.push(bet);

                // 更新号码统计
                numbers.forEach(num => {
                    const numStr = formatNumber(num);
                    if (!this.numberStats[numStr]) {
                        this.numberStats[numStr] = { count: 0, totalAmount: 0 };
                    }
                    this.numberStats[numStr].count++;
                    this.numberStats[numStr].totalAmount += amountPerNumber;
                });

                return true;
            }
        } else {
            console.log('特码匹配失败:', line);
        }

        return false;
    }

    // 尝试解析数字+中文金额格式
    // 例如: 28.08.38各五, 07.16各十, 14.三十五
    tryParseChineseAmountBet(line) {
        // 中文数字映射
        const chineseNumbers = {
            '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
            '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
            '十一': 11, '十二': 12, '十三': 13, '十四': 14, '十五': 15,
            '十六': 16, '十七': 17, '十八': 18, '十九': 19, '二十': 20,
            '三十': 30, '四十': 40, '五十': 50, '一百': 100
        };

        // 匹配模式: 数字列表 + 中文金额
        // 例如: 28.08.38.31.04各五, 07.16.32.19各十, 14.三十五
        const pattern = /([\d.\s]+?)[各.]?([一二三四五六七八九十百]+)/;
        const match = line.match(pattern);

        if (match) {
            const [, numbersStr, chineseAmount] = match;
            const numbers = this.extractNumbers(numbersStr);
            
            // 转换中文数字为阿拉伯数字
            let amount = 0;
            if (chineseNumbers[chineseAmount]) {
                amount = chineseNumbers[chineseAmount];
            } else {
                // 尝试解析组合数字(如"三十五")
                amount = this.parseChineseNumber(chineseAmount);
            }

            if (numbers.length > 0 && amount > 0) {
                const totalAmount = amount * numbers.length;

                const bet = {
                    id: this.bets.length + 1,
                    type: 'batch',
                    numbers: numbers,
                    amount: totalAmount,
                    amountPerNumber: amount,
                    rawText: line,
                    timestamp: getCurrentTimestamp()
                };

                this.bets.push(bet);

                // 更新号码统计
                numbers.forEach(num => {
                    const numStr = formatNumber(num);
                    if (!this.numberStats[numStr]) {
                        this.numberStats[numStr] = { count: 0, totalAmount: 0 };
                    }
                    this.numberStats[numStr].count++;
                    this.numberStats[numStr].totalAmount += amount;
                });

                return true;
            }
        }

        return false;
    }

    // 解析中文数字(支持组合如"三十五")
    parseChineseNumber(chinese) {
        const basicNumbers = {
            '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
            '六': 6, '七': 7, '八': 8, '九': 9, '十': 10
        };

        // 直接匹配
        if (basicNumbers[chinese]) {
            return basicNumbers[chinese];
        }

        // 处理"三十五"这种组合
        const tensMatch = chinese.match(/([一二三四五六七八九])十([一二三四五六七八九])?/);
        if (tensMatch) {
            const tens = basicNumbers[tensMatch[1]] || 0;
            const ones = tensMatch[2] ? (basicNumbers[tensMatch[2]] || 0) : 0;
            return tens * 10 + ones;
        }

        // 处理"二十"这种
        const twentyMatch = chinese.match(/([一二三四五六七八九])十$/);
        if (twentyMatch) {
            return (basicNumbers[twentyMatch[1]] || 0) * 10;
        }

        return 0;
    }

    // 从字符串中提取号码(支持多种分隔符: . % , 空格)
    extractNumbers(str) {
        // 先替换所有分隔符为空格
        const normalized = str.replace(/[.%，,\s]+/g, ' ');
        
        // 提取所有1-2位数字
        const matches = normalized.match(/\d{1,2}/g);
        if (!matches) return [];

        return matches
            .map(num => parseInt(num))
            .filter(num => num >= 1 && num <= 49)
            .filter((num, index, self) => self.indexOf(num) === index); // 去重
    }

    // 解析金额
    parseAmount(amountStr, unit = '蚊') {
        const amount = parseInt(amountStr);
        const multiplier = CONFIG.AMOUNT_UNITS[unit] || 1;
        return amount * multiplier;
    }

    // 聚合统计数据
    aggregateStats() {
        // 重新计算每个号码的总金额
        const recalculated = {};

        this.bets.forEach(bet => {
            const singleAmount = bet.amount / bet.numbers.length;
            bet.numbers.forEach(num => {
                const numStr = formatNumber(num);
                if (!recalculated[numStr]) {
                    recalculated[numStr] = { count: 0, totalAmount: 0 };
                }
                recalculated[numStr].count++;
                recalculated[numStr].totalAmount += singleAmount;
            });
        });

        this.numberStats = recalculated;
    }

    // 获取总收款
    getTotalReceived() {
        return this.bets.reduce((sum, bet) => sum + bet.amount, 0);
    }
}

// 导出解析器
const parser = new BetParser();
