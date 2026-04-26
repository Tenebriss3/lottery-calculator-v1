// ===== 界面交互模块 =====

class UIManager {
    constructor() {
        this.elements = {};
        this.resultsExpanded = true;
    }

    // 初始化DOM元素引用
    initElements() {
        this.elements = {
            currentDate: document.getElementById('currentDate'),
            totalReceived: document.getElementById('totalReceived'),
            totalPayout: document.getElementById('totalPayout'),
            profit: document.getElementById('profit'),
            chatInput: document.getElementById('chatInput'),
            parseBtn: document.getElementById('parseBtn'),
            confirmBtn: document.getElementById('confirmBtn'),
            clearBtn: document.getElementById('clearBtn'),
            clearAllBtn: document.getElementById('clearAllBtn'),
            resultsHeader: document.getElementById('resultsHeader'),
            resultsContent: document.getElementById('resultsContent'),
            toggleIcon: document.getElementById('toggleIcon'),
            previewSection: document.getElementById('previewSection'),
            previewCount: document.getElementById('previewCount'),
            previewAmount: document.getElementById('previewAmount'),
            previewList: document.getElementById('previewList'),
            numberStatsBody: document.getElementById('numberStatsBody'),
            zodiacBody: document.getElementById('zodiacBody'),
            betDetailsBody: document.getElementById('betDetailsBody'),
            payoutRate: document.getElementById('payoutRate'),
            saveRateBtn: document.getElementById('saveRateBtn'),
            winningNumbers: document.getElementById('winningNumbers'),
            calculateBtn: document.getElementById('calculateBtn'),
            exportExcelBtn: document.getElementById('exportExcelBtn'),
            exportTextBtn: document.getElementById('exportTextBtn'),
            importBtn: document.getElementById('importBtn'),
            archiveBtn: document.getElementById('archiveBtn'),
            fileInput: document.getElementById('fileInput'),
            payoutResult: document.getElementById('payoutResult'),
            payoutTotalBet: document.getElementById('payoutTotalBet'),
            payoutTotalPayout: document.getElementById('payoutTotalPayout'),
            payoutProfit: document.getElementById('payoutProfit')
        };
    }

    // 绑定事件
    bindEvents(handlers) {
        // 解析按钮
        this.elements.parseBtn.addEventListener('click', handlers.onParse);

        // 确认添加按钮
        this.elements.confirmBtn.addEventListener('click', handlers.onConfirm);

        // 清空输入按钮
        this.elements.clearBtn.addEventListener('click', handlers.onClear);

        // 清空全部按钮
        if (this.elements.clearAllBtn) {
            this.elements.clearAllBtn.addEventListener('click', handlers.onClearAll);
        }

        // 保存赔率按钮
        if (this.elements.saveRateBtn) {
            this.elements.saveRateBtn.addEventListener('click', handlers.onSaveRate);
        }

        // 结果区折叠/展开
        this.elements.resultsHeader.addEventListener('click', () => {
            this.toggleResults();
        });

        // 计算盈亏按钮
        this.elements.calculateBtn.addEventListener('click', handlers.onCalculate);

        // 导出Excel按钮
        this.elements.exportExcelBtn.addEventListener('click', handlers.onExportExcel);

        // 导出文本按钮
        this.elements.exportTextBtn.addEventListener('click', handlers.onExportText);

        // 导入按钮
        this.elements.importBtn.addEventListener('click', () => {
            this.elements.fileInput.click();
        });

        // 文件选择
        this.elements.fileInput.addEventListener('change', handlers.onFileSelect);

        // 归档按钮
        this.elements.archiveBtn.addEventListener('click', handlers.onArchive);

        // 回车键触发计算
        this.elements.winningNumbers.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handlers.onCalculate();
            }
        });
    }

    // 切换结果区显示/隐藏
    toggleResults() {
        this.resultsExpanded = !this.resultsExpanded;

        if (this.resultsExpanded) {
            this.elements.resultsContent.classList.remove('collapsed');
            this.elements.toggleIcon.classList.remove('collapsed');
        } else {
            this.elements.resultsContent.classList.add('collapsed');
            this.elements.toggleIcon.classList.add('collapsed');
        }
    }

    // 更新顶部状态栏
    updateStatusBar(totalReceived, totalPayout, profit) {
        this.elements.totalReceived.textContent = formatMoney(totalReceived);
        this.elements.totalPayout.textContent = formatMoney(totalPayout);
        this.elements.profit.textContent = formatMoney(profit);

        // 设置盈亏颜色
        this.elements.profit.className = 'stat-value ' + (profit >= 0 ? 'positive' : 'negative');
    }

    // 更新号码统计表
    updateNumberStats(stats) {
        const tbody = this.elements.numberStatsBody;
        tbody.innerHTML = '';

        if (!stats || Object.keys(stats).length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="empty-msg">暂无数据</td></tr>';
            return;
        }

        // 按号码排序
        Object.entries(stats)
            .sort(([a], [b]) => a.localeCompare(b))
            .forEach(([number, data]) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${number}</td>
                    <td>${data.count}</td>
                    <td>${formatMoney(data.totalAmount)}</td>
                `;
                tbody.appendChild(row);
            });
    }

    // 更新生肖投注表
    updateZodiacBets(zodiacBets) {
        const tbody = this.elements.zodiacBody;
        tbody.innerHTML = '';

        if (!zodiacBets || zodiacBets.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="empty-msg">暂无数据</td></tr>';
            return;
        }

        zodiacBets.forEach(bet => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${bet.zodiac}</td>
                <td>${bet.numbers.map(formatNumber).join(', ')}</td>
                <td>${formatMoney(bet.amount)}</td>
            `;
            tbody.appendChild(row);
        });
    }

    // 更新下注明细表 (带编辑/删除按钮)
    updateBetDetails(bets, handlers) {
        const tbody = this.elements.betDetailsBody;
        tbody.innerHTML = '';

        if (!bets || bets.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="empty-msg">暂无数据</td></tr>';
            return;
        }

        bets.forEach((bet, index) => {
            const row = document.createElement('tr');
            const typeLabel = bet.type === 'zodiac' ? '生肖' :
                            bet.type === 'batch' ? '批量' :
                            bet.type === 'special' ? '特码' : '单号';

            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${bet.zodiac || bet.numbers.map(formatNumber).join(', ')}</td>
                <td>${formatMoney(bet.amount)}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn btn-sm btn-warning edit-btn" data-index="${index}">✏️</button>
                        <button class="btn btn-sm btn-danger delete-btn" data-index="${index}">🗑️</button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });

        // 绑定编辑和删除事件
        if (handlers) {
            tbody.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const index = parseInt(e.target.dataset.index);
                    handlers.onEdit(index);
                });
            });

            tbody.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const index = parseInt(e.target.dataset.index);
                    handlers.onDelete(index);
                });
            });
        }
    }

    // 显示盈亏结果
    showPayoutResult(result) {
        this.elements.payoutResult.style.display = 'block';
        this.elements.payoutTotalBet.textContent = formatMoney(result.totalReceived);
        this.elements.payoutTotalPayout.textContent = formatMoney(result.totalPayout);
        this.elements.payoutProfit.textContent = formatMoney(result.profit);

        // 设置盈亏颜色
        this.elements.payoutProfit.parentElement.className =
            'payout-item highlight ' + (result.profit >= 0 ? '' : 'negative');

        // 同时更新顶部状态栏
        this.updateStatusBar(result.totalReceived, result.totalPayout, result.profit);
    }

    // 隐藏盈亏结果
    hidePayoutResult() {
        this.elements.payoutResult.style.display = 'none';
    }

    // 设置当前日期显示
    setCurrentDate(date) {
        this.elements.currentDate.textContent = `📅 ${date}`;
    }

    // 获取聊天输入内容
    getChatInput() {
        return this.elements.chatInput.value;
    }

    // 清空聊天输入
    clearChatInput() {
        this.elements.chatInput.value = '';
    }

    // 获取开奖号码输入
    getWinningNumbers() {
        const input = this.elements.winningNumbers.value.trim();
        if (!input) return [];

        // 支持逗号、空格、顿号分隔
        return input.split(/[,，\s.]+/)
            .map(num => parseInt(num))
            .filter(num => num >= 1 && num <= 49);
    }

    // 清空开奖号码输入
    clearWinningNumbers() {
        this.elements.winningNumbers.value = '';
    }

    // 截断文本
    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    // 显示提示消息
    showMessage(message, type = 'info') {
        // 简单的alert,可以改进为更优雅的toast提示
        alert(message);
    }

    // 确认对话框
    confirm(message) {
        return window.confirm(message);
    }

    // 显示解析预览
    showPreview(parseResult) {
        if (!parseResult || !parseResult.bets || parseResult.bets.length === 0) {
            this.hidePreview();
            return;
        }

        // 显示预览区
        this.elements.previewSection.style.display = 'block';
        this.elements.confirmBtn.style.display = 'inline-block';

        // 更新统计
        this.elements.previewCount.textContent = parseResult.bets.length;
        const totalAmount = parseResult.bets.reduce((sum, bet) => sum + bet.amount, 0);
        this.elements.previewAmount.textContent = formatMoney(totalAmount);

        // 生成预览列表
        let html = '';
        parseResult.bets.forEach((bet, index) => {
            const typeLabel = bet.type === 'zodiac' ? '生肖' :
                            bet.type === 'batch' ? '批量' :
                            bet.type === 'special' ? '特码' : '单号';

            html += `
                <div class="preview-item">
                    <div class="preview-item-header">
                        <span class="preview-item-type">${typeLabel} #${index + 1}</span>
                        <span class="preview-item-amount">${formatMoney(bet.amount)}</span>
                    </div>
                    <div class="preview-item-numbers">
                        ${bet.zodiac || '号码: ' + bet.numbers.map(formatNumber).join(', ')}
                    </div>
                    <div class="preview-item-raw">
                        ${bet.rawText}
                    </div>
                </div>
            `;
        });

        this.elements.previewList.innerHTML = html;
    }

    // 隐藏解析预览
    hidePreview() {
        this.elements.previewSection.style.display = 'none';
        this.elements.confirmBtn.style.display = 'none';
        this.elements.previewList.innerHTML = '';
    }
}

// 导出UI管理器
const ui = new UIManager();
