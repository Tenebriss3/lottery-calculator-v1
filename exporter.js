// ===== Excel导入导出模块 =====

class DataExporter {
    constructor() {
        this.SHEET_NAMES = {
            CURRENT: '当日前台操作页',
            CONFIG: '生肖配置后台',
            HISTORY: '全年历史归档总账'
        };
    }

    // 导出为Excel文件
    exportToExcel(currentData, history) {
        try {
            // 创建工作簿
            const wb = XLSX.utils.book_new();

            // Sheet1: 当日前台操作页
            const sheet1Data = this.formatCurrentDaySheet(currentData);
            XLSX.utils.book_append_sheet(wb, sheet1Data, this.SHEET_NAMES.CURRENT);

            // Sheet2: 生肖配置后台
            const sheet2Data = this.formatConfigSheet();
            XLSX.utils.book_append_sheet(wb, sheet2Data, this.SHEET_NAMES.CONFIG);

            // Sheet3: 全年历史归档总账
            const sheet3Data = this.formatHistorySheet(history);
            XLSX.utils.book_append_sheet(wb, sheet3Data, this.SHEET_NAMES.HISTORY);

            // 生成文件名
            const fileName = `六合彩下注_${currentData.date || getCurrentDate()}.xlsx`;

            // 下载文件
            XLSX.writeFile(wb, fileName);

            return { success: true, message: '导出成功' };
        } catch (error) {
            console.error('Excel导出失败:', error);
            return { success: false, message: '导出失败: ' + error.message };
        }
    }

    // 格式化当日数据Sheet
    formatCurrentDaySheet(data) {
        const rows = [];

        // 标题行
        rows.push(['日期', data.date || getCurrentDate()]);
        rows.push([]);

        // 下注明细表头
        rows.push(['=== 下注明细 ===']);
        rows.push(['序号', '类型', '号码/生肖', '金额', '原始记录', '时间']);

        // 下注明细数据
        if (data.bets && data.bets.length > 0) {
            data.bets.forEach((bet, index) => {
                rows.push([
                    index + 1,
                    bet.type === 'zodiac' ? '生肖' :
                    bet.type === 'batch' ? '批量' :
                    bet.type === 'special' ? '特码' : '单号',
                    bet.zodiac || bet.numbers.map(formatNumber).join(', '),
                    bet.amount,
                    bet.rawText,
                    bet.timestamp
                ]);
            });
        } else {
            rows.push(['暂无数据']);
        }

        rows.push([]);

        // 号码统计表头
        rows.push(['=== 号码统计 ===']);
        rows.push(['号码', '出现次数', '累计金额']);

        // 号码统计数据
        if (data.numberStats) {
            Object.entries(data.numberStats)
                .sort(([a], [b]) => a.localeCompare(b))
                .forEach(([number, stats]) => {
                    rows.push([
                        number,
                        stats.count,
                        stats.totalAmount
                    ]);
                });
        }

        rows.push([]);

        // 盈亏信息
        if (data.profitResult) {
            rows.push(['=== 今日盈亏核算 ===']);
            rows.push(['总收款', data.profitResult.totalReceived]);
            rows.push(['总赔付', data.profitResult.totalPayout]);
            rows.push(['盈亏', data.profitResult.profit]);
            rows.push(['开奖号码', data.winningNumbers?.map(formatNumber).join(', ') || '未设置']);
        }

        return XLSX.utils.aoa_to_sheet(rows);
    }

    // 格式化配置Sheet
    formatConfigSheet() {
        const rows = [];

        // 生肖对应表
        rows.push(['=== 生肖号码对应表 ===']);
        rows.push(['生肖', '相冲属相', '对应号码']);

        Object.entries(CONFIG.ZODIAC_MAP).forEach(([zodiac, numbers]) => {
            rows.push([
                zodiac,
                CONFIG.CLASH_MAP[zodiac] || '',
                numbers.map(formatNumber).join(', ')
            ]);
        });

        rows.push([]);

        // 赔率配置
        rows.push(['=== 赔率配置 ===']);
        rows.push(['项目', '数值']);
        rows.push(['赔付赔率', `1:${CONFIG.PAYOUT_RATE}`]);

        return XLSX.utils.aoa_to_sheet(rows);
    }

    // 格式化历史Sheet
    formatHistorySheet(history) {
        const rows = [];

        // 表头
        rows.push(['日期', '总投注数', '总收款', '总赔付', '盈亏', '开奖号码', '归档时间']);

        // 历史数据
        if (history && history.length > 0) {
            history.forEach(day => {
                const totalReceived = day.bets.reduce((sum, bet) => sum + bet.amount, 0);
                const totalPayout = day.profitResult?.totalPayout || 0;
                const profit = totalReceived - totalPayout;

                rows.push([
                    day.date,
                    day.bets.length,
                    totalReceived,
                    totalPayout,
                    profit,
                    day.winningNumbers?.map(formatNumber).join(', ') || '未设置',
                    day.archivedAt || ''
                ]);
            });
        } else {
            rows.push(['暂无历史数据']);
        }

        return XLSX.utils.aoa_to_sheet(rows);
    }

    // 导出为文本备份(JSON格式)
    exportAsText(currentData, history) {
        try {
            const backupData = {
                exportDate: getCurrentTimestamp(),
                currentDay: currentData,
                history: history
            };

            const text = JSON.stringify(backupData, null, 2);
            const fileName = `六合彩备份_${currentData.date || getCurrentDate()}.json`;

            this.downloadFile(fileName, text, 'application/json');

            return { success: true, message: '文本备份成功' };
        } catch (error) {
            console.error('文本导出失败:', error);
            return { success: false, message: '备份失败: ' + error.message };
        }
    }

    // 从Excel文件导入
    importFromExcel(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const wb = XLSX.read(data, { type: 'array' });

                    const result = {
                        currentDay: null,
                        history: []
                    };

                    // 读取Sheet1: 当日前台操作页
                    if (wb.Sheets[this.SHEET_NAMES.CURRENT]) {
                        result.currentDay = this.parseCurrentDaySheet(
                            XLSX.utils.sheet_to_json(wb.Sheets[this.SHEET_NAMES.CURRENT], { header: 1 })
                        );
                    }

                    // 读取Sheet3: 全年历史归档总账
                    if (wb.Sheets[this.SHEET_NAMES.HISTORY]) {
                        result.history = this.parseHistorySheet(
                            XLSX.utils.sheet_to_json(wb.Sheets[this.SHEET_NAMES.HISTORY], { header: 1 })
                        );
                    }

                    resolve({ success: true, data: result });
                } catch (error) {
                    reject({ success: false, message: '解析Excel失败: ' + error.message });
                }
            };

            reader.onerror = () => {
                reject({ success: false, message: '文件读取失败' });
            };

            reader.readAsArrayBuffer(file);
        });
    }

    // 从文本文件导入
    importFromText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);

                    if (!data.currentDay && !data.history) {
                        throw new Error('无效的备份文件格式');
                    }

                    resolve({
                        success: true,
                        data: {
                            currentDay: data.currentDay,
                            history: data.history || []
                        }
                    });
                } catch (error) {
                    reject({ success: false, message: '解析JSON失败: ' + error.message });
                }
            };

            reader.onerror = () => {
                reject({ success: false, message: '文件读取失败' });
            };

            reader.readAsText(file);
        });
    }

    // 解析当日数据Sheet
    parseCurrentDaySheet(rows) {
        // 简化解析,主要恢复基本结构
        const data = {
            date: getCurrentDate(),
            bets: [],
            numberStats: {},
            zodiacBets: [],
            winningNumbers: [],
            profitResult: null
        };

        // 尝试提取日期
        if (rows[0] && rows[0][1]) {
            data.date = rows[0][1];
        }

        return data;
    }

    // 解析历史Sheet
    parseHistorySheet(rows) {
        const history = [];

        // 跳过表头
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || !row[0]) continue;

            history.push({
                date: row[0],
                bets: [],
                winningNumbers: row[5] ? row[5].split(',').map(n => parseInt(n.trim())) : [],
                archivedAt: row[6]
            });
        }

        return history;
    }

    // 下载文件辅助方法
    downloadFile(fileName, content, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// 导出实例
const exporter = new DataExporter();
