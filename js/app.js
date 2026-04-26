// ===== 主应用模块 =====

class App {
    constructor() {
        this.currentData = null;
        this.parseResult = null;
        this.pendingBets = []; // 待确认的下注
    }

    // 初始化应用
    init() {
        console.log('六合彩下注管理系统启动...');

        // 初始化UI元素
        ui.initElements();

        // 加载保存的赔率
        this.loadPayoutRate();

        // 设置当前日期
        const today = getCurrentDate();
        ui.setCurrentDate(today);

        // 加载当日数据
        this.loadCurrentDayData();

        // 绑定事件
        this.bindEvents();

        console.log('系统初始化完成');
    }

    // 加载保存的赔率
    loadPayoutRate() {
        const savedRate = localStorage.getItem('lottery_payout_rate');
        if (savedRate) {
            const rate = parseInt(savedRate);
            if (rate > 0) {
                calculator.setPayoutRate(rate);
                ui.elements.payoutRate.value = rate;
                console.log(`加载保存的赔率: 1:${rate}`);
            }
        }
    }

    // 加载当日数据
    loadCurrentDayData() {
        this.currentData = storage.getCurrentDay();

        // 如果有已保存的数据,恢复显示
        if (this.currentData.bets && this.currentData.bets.length > 0) {
            this.parseResult = {
                bets: this.currentData.bets,
                numberStats: this.currentData.numberStats,
                zodiacBets: this.currentData.zodiacBets
            };

            this.updateDisplay();

            // 如果有盈亏结果,也恢复显示
            if (this.currentData.profitResult) {
                ui.showPayoutResult(this.currentData.profitResult);
            }

            // 如果有开奖号码,恢复显示
            if (this.currentData.winningNumbers && this.currentData.winningNumbers.length > 0) {
                ui.elements.winningNumbers.value =
                    this.currentData.winningNumbers.map(formatNumber).join(', ');
            }
        }
    }

    // 绑定事件处理器
    bindEvents() {
        ui.bindEvents({
            onParse: () => this.handleParse(),
            onConfirm: () => this.handleConfirm(),
            onClear: () => this.handleClear(),
            onClearAll: () => this.handleClearAll(),
            onSaveRate: () => this.handleSaveRate(),
            onCalculate: () => this.handleCalculate(),
            onExportExcel: () => this.handleExportExcel(),
            onExportText: () => this.handleExportText(),
            onFileSelect: (e) => this.handleFileSelect(e),
            onArchive: () => this.handleArchive(),
            onEdit: (index) => this.handleEdit(index),
            onDelete: (index) => this.handleDelete(index)
        });
    }

    // 处理解析 - 显示预览,不直接录入
    handleParse() {
        const chatText = ui.getChatInput();

        if (!chatText.trim()) {
            ui.showMessage('请先粘贴聊天记录');
            return;
        }

        try {
            // 执行解析
            this.pendingBets = parser.parse(chatText);

            // 显示预览
            ui.showPreview(this.pendingBets);

            ui.showMessage(`解析完成! 识别 ${this.pendingBets.bets.length} 条记录,请点击"确认添加"`);
        } catch (error) {
            console.error('解析失败:', error);
            ui.showMessage('解析失败: ' + error.message);
        }
    }

    // 处理确认添加
    handleConfirm() {
        if (!this.pendingBets || !this.pendingBets.bets || this.pendingBets.bets.length === 0) {
            ui.showMessage('没有可添加的数据');
            return;
        }

        try {
            // 如果已有数据,追加;否则新建
            if (!this.parseResult) {
                this.parseResult = {
                    bets: [],
                    numberStats: {},
                    zodiacBets: []
                };
            }

            // 追加新下注
            const startId = this.parseResult.bets.length + 1;
            this.pendingBets.bets.forEach((bet, index) => {
                bet.id = startId + index;
                this.parseResult.bets.push(bet);

                // 如果是生肖投注,添加到生肖列表
                if (bet.type === 'zodiac') {
                    this.parseResult.zodiacBets.push(bet);
                }
            });

            // 重新计算统计
            this.recalculateStats();

            // 更新显示
            this.updateDisplay();

            // 保存数据
            this.saveCurrentData();

            // 清空输入和预览
            ui.clearChatInput();
            ui.hidePreview();
            this.pendingBets = [];

            // 展开结果区
            if (!ui.resultsExpanded) {
                ui.toggleResults();
            }

            ui.showMessage('✅ 添加成功! 可以继续粘贴新的聊天记录');
        } catch (error) {
            console.error('添加失败:', error);
            ui.showMessage('添加失败: ' + error.message);
        }
    }

    // 处理清空输入
    handleClear() {
        ui.clearChatInput();
        ui.hidePreview();
        this.pendingBets = [];
        ui.showMessage('已清空输入');
    }

    // 处理清空全部数据
    handleClearAll() {
        if (ui.confirm('⚠️ 确定要清空所有已录入的数据吗?此操作不可恢复!')) {
            this.parseResult = null;
            this.currentData = storage.createEmptyDayData();
            this.pendingBets = [];

            ui.clearChatInput();
            ui.clearWinningNumbers();
            ui.hidePayoutResult();
            ui.hidePreview();
            this.updateDisplay();
            storage.clearCurrentDay();

            ui.showMessage('已清空全部数据');
        }
    }

    // 处理保存赔率
    handleSaveRate() {
        const rateInput = ui.elements.payoutRate;
        const newRate = parseInt(rateInput.value);

        if (!newRate || newRate <= 0) {
            ui.showMessage('请输入有效的赔率(大于0的数字)');
            return;
        }

        const success = calculator.setPayoutRate(newRate);

        if (success) {
            // 保存到LocalStorage
            localStorage.setItem('lottery_payout_rate', newRate);
            ui.showMessage(`✅ 赔率已保存: 1:${newRate}`);
        } else {
            ui.showMessage('保存失败,请重试');
        }
    }

    // 处理计算盈亏
    handleCalculate() {
        if (!this.parseResult || !this.parseResult.bets || this.parseResult.bets.length === 0) {
            ui.showMessage('请先解析下注记录');
            return;
        }

        const winningNumbers = ui.getWinningNumbers();

        if (winningNumbers.length === 0) {
            ui.showMessage('请输入开奖号码');
            return;
        }

        try {
            // 计算盈亏
            const result = calculator.calculate(winningNumbers, this.parseResult.bets);

            // 显示结果
            ui.showPayoutResult(result);

            // 保存盈亏结果和开奖号码
            this.currentData.winningNumbers = winningNumbers;
            this.currentData.profitResult = result;
            this.saveCurrentData();

            // 生成报告
            const report = calculator.generateReport(result);
            console.log('盈亏报告:', report);

            ui.showMessage(`${result.message}: ${formatMoney(result.profit)}`);
        } catch (error) {
            console.error('计算失败:', error);
            ui.showMessage('计算失败: ' + error.message);
        }
    }

    // 处理导出Excel
    handleExportExcel() {
        if (!this.parseResult || this.parseResult.bets.length === 0) {
            ui.showMessage('暂无数据可导出');
            return;
        }

        try {
            const history = storage.getHistory();
            const result = exporter.exportToExcel(this.currentData, history);

            if (result.success) {
                ui.showMessage(result.message);
            } else {
                ui.showMessage(result.message);
            }
        } catch (error) {
            console.error('导出失败:', error);
            ui.showMessage('导出失败: ' + error.message);
        }
    }

    // 处理导出文本
    handleExportText() {
        if (!this.parseResult || this.parseResult.bets.length === 0) {
            ui.showMessage('暂无数据可备份');
            return;
        }

        try {
            const history = storage.getHistory();
            const result = exporter.exportAsText(this.currentData, history);

            if (result.success) {
                ui.showMessage(result.message);
            } else {
                ui.showMessage(result.message);
            }
        } catch (error) {
            console.error('备份失败:', error);
            ui.showMessage('备份失败: ' + error.message);
        }
    }

    // 处理文件选择(导入)
    async handleFileSelect(event) {
        const file = event.target.files[0];

        if (!file) {
            return;
        }

        try {
            let result;

            // 根据文件类型选择导入方式
            if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                result = await exporter.importFromExcel(file);
            } else if (file.name.endsWith('.json') || file.name.endsWith('.txt')) {
                result = await exporter.importFromText(file);
            } else {
                ui.showMessage('不支持的文件格式');
                return;
            }

            if (result.success) {
                // 恢复数据
                const restoreResult = storage.restoreFromImport(result.data);

                if (restoreResult.success) {
                    // 重新加载数据
                    this.loadCurrentDayData();
                    ui.showMessage(restoreResult.message);
                } else {
                    ui.showMessage(restoreResult.message);
                }
            } else {
                ui.showMessage(result.message);
            }
        } catch (error) {
            console.error('导入失败:', error);
            ui.showMessage('导入失败: ' + error.message);
        }

        // 清空文件输入,允许重复导入同一文件
        event.target.value = '';
    }

    // 处理归档
    handleArchive() {
        if (!this.parseResult || this.parseResult.bets.length === 0) {
            ui.showMessage('今日无数据可归档');
            return;
        }

        if (!ui.confirm('确定要归档今日数据吗?\n归档后将清空当前页面。')) {
            return;
        }

        try {
            const result = storage.archiveCurrentDay();

            if (result.success) {
                // 清空当前显示
                this.parseResult = null;
                this.currentData = storage.createEmptyDayData();
                this.pendingBets = [];

                ui.clearChatInput();
                ui.clearWinningNumbers();
                ui.hidePayoutResult();
                ui.hidePreview();
                this.updateDisplay();

                ui.showMessage(result.message);
            } else {
                ui.showMessage(result.message);
            }
        } catch (error) {
            console.error('归档失败:', error);
            ui.showMessage('归档失败: ' + error.message);
        }
    }

    // 处理编辑记录
    handleEdit(index) {
        if (!this.parseResult || !this.parseResult.bets[index]) {
            ui.showMessage('记录不存在');
            return;
        }

        const bet = this.parseResult.bets[index];
        const newAmount = prompt(`修改金额 (当前: ${formatMoney(bet.amount)}):\n\n原始记录: ${bet.rawText}`);

        if (newAmount === null) return; // 用户取消

        const amount = parseInt(newAmount);
        if (isNaN(amount) || amount <= 0) {
            ui.showMessage('请输入有效的金额');
            return;
        }

        // 更新金额
        const oldAmount = bet.amount;
        bet.amount = amount;

        // 重新计算统计
        this.recalculateStats();

        // 更新显示和保存
        this.updateDisplay();
        this.saveCurrentData();

        ui.showMessage(`✅ 已修改: ${formatMoney(oldAmount)} → ${formatMoney(amount)}`);
    }

    // 处理删除记录
    handleDelete(index) {
        if (!this.parseResult || !this.parseResult.bets[index]) {
            ui.showMessage('记录不存在');
            return;
        }

        const bet = this.parseResult.bets[index];

        if (!ui.confirm(`确定要删除这条记录吗?\n\n${bet.rawText}\n金额: ${formatMoney(bet.amount)}`)) {
            return;
        }

        // 删除记录
        this.parseResult.bets.splice(index, 1);

        // 如果是生肖投注,也从生肖列表中删除
        if (bet.type === 'zodiac') {
            const zodiacIndex = this.parseResult.zodiacBets.findIndex(z => z.id === bet.id);
            if (zodiacIndex !== -1) {
                this.parseResult.zodiacBets.splice(zodiacIndex, 1);
            }
        }

        // 重新编号
        this.parseResult.bets.forEach((b, i) => {
            b.id = i + 1;
        });

        // 重新计算统计
        this.recalculateStats();

        // 更新显示和保存
        this.updateDisplay();
        this.saveCurrentData();

        ui.showMessage('🗑️ 已删除');
    }

    // 重新计算统计数据
    recalculateStats() {
        if (!this.parseResult) return;

        const stats = {};

        this.parseResult.bets.forEach(bet => {
            // 如果有amountPerNumber字段,直接使用;否则平均分配
            const amountPerNumber = bet.amountPerNumber || (bet.amount / bet.numbers.length);
            
            bet.numbers.forEach(num => {
                const numStr = formatNumber(num);
                if (!stats[numStr]) {
                    stats[numStr] = { count: 0, totalAmount: 0 };
                }
                stats[numStr].count++;
                stats[numStr].totalAmount += amountPerNumber;
            });
        });

        this.parseResult.numberStats = stats;
    }

    // 更新界面显示
    updateDisplay() {
        if (!this.parseResult) {
            // 清空显示
            ui.updateNumberStats({});
            ui.updateZodiacBets([]);
            ui.updateBetDetails([], null);
            ui.updateStatusBar(0, 0, 0);
            return;
        }

        // 更新统计表
        ui.updateNumberStats(this.parseResult.numberStats);
        ui.updateZodiacBets(this.parseResult.zodiacBets);
        ui.updateBetDetails(this.parseResult.bets, {
            onEdit: (index) => this.handleEdit(index),
            onDelete: (index) => this.handleDelete(index)
        });

        // 更新总收款
        const totalReceived = this.parseResult.bets.reduce((sum, bet) => sum + bet.amount, 0);
        ui.updateStatusBar(totalReceived, 0, 0);
    }

    // 保存当前数据
    saveCurrentData() {
        if (!this.parseResult) return;

        const dataToSave = {
            date: getCurrentDate(),
            bets: this.parseResult.bets,
            numberStats: this.parseResult.numberStats,
            zodiacBets: this.parseResult.zodiacBets,
            winningNumbers: this.currentData?.winningNumbers || [],
            profitResult: this.currentData?.profitResult || null
        };

        storage.saveCurrentDay(dataToSave);
    }
}

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();

    // 暴露到全局,方便调试
    window.lotteryApp = app;
});
