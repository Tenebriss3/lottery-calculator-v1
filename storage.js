// ===== 数据存储模块 =====

class DataStorage {
    constructor() {
        this.STORAGE_KEYS = {
            CURRENT_DAY: 'lottery_current_day',
            HISTORY: 'lottery_history',
            CONFIG: 'lottery_config'
        };
    }

    // 保存当日数据
    saveCurrentDay(data) {
        try {
            const storageData = {
                date: data.date || getCurrentDate(),
                bets: data.bets || [],
                numberStats: data.numberStats || {},
                zodiacBets: data.zodiacBets || [],
                winningNumbers: data.winningNumbers || [],
                profitResult: data.profitResult || null,
                lastUpdated: getCurrentTimestamp()
            };

            localStorage.setItem(this.STORAGE_KEYS.CURRENT_DAY, JSON.stringify(storageData));
            return true;
        } catch (error) {
            console.error('保存当日数据失败:', error);
            return false;
        }
    }

    // 获取当日数据
    getCurrentDay() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEYS.CURRENT_DAY);
            if (!data) {
                return this.createEmptyDayData();
            }
            return JSON.parse(data);
        } catch (error) {
            console.error('读取当日数据失败:', error);
            return this.createEmptyDayData();
        }
    }

    // 创建空的当日数据
    createEmptyDayData() {
        return {
            date: getCurrentDate(),
            bets: [],
            numberStats: {},
            zodiacBets: [],
            winningNumbers: [],
            profitResult: null,
            lastUpdated: null
        };
    }

    // 归档当日数据到历史记录
    archiveCurrentDay() {
        try {
            const currentData = this.getCurrentDay();

            if (currentData.bets.length === 0) {
                return { success: false, message: '今日无数据可归档' };
            }

            // 获取历史记录
            const history = this.getHistory();

            // 检查是否已归档今日数据
            const existingIndex = history.findIndex(item => item.date === currentData.date);
            if (existingIndex !== -1) {
                // 更新已有记录
                history[existingIndex] = {
                    ...currentData,
                    archivedAt: getCurrentTimestamp()
                };
            } else {
                // 添加新记录
                history.push({
                    ...currentData,
                    archivedAt: getCurrentTimestamp()
                });
            }

            // 保存历史记录
            localStorage.setItem(this.STORAGE_KEYS.HISTORY, JSON.stringify(history));

            // 清空当日数据
            this.clearCurrentDay();

            return { success: true, message: '归档成功' };
        } catch (error) {
            console.error('归档失败:', error);
            return { success: false, message: '归档失败: ' + error.message };
        }
    }

    // 获取历史记录
    getHistory() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEYS.HISTORY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('读取历史记录失败:', error);
            return [];
        }
    }

    // 清空当日数据
    clearCurrentDay() {
        try {
            localStorage.removeItem(this.STORAGE_KEYS.CURRENT_DAY);
            return true;
        } catch (error) {
            console.error('清空当日数据失败:', error);
            return false;
        }
    }

    // 从导入恢复数据
    restoreFromImport(data) {
        try {
            if (data.currentDay) {
                this.saveCurrentDay(data.currentDay);
            }

            if (data.history) {
                localStorage.setItem(this.STORAGE_KEYS.HISTORY, JSON.stringify(data.history));
            }

            return { success: true, message: '数据恢复成功' };
        } catch (error) {
            console.error('数据恢复失败:', error);
            return { success: false, message: '数据恢复失败: ' + error.message };
        }
    }

    // 获取存储统计信息
    getStorageInfo() {
        const currentDay = this.getCurrentDay();
        const history = this.getHistory();

        return {
            currentDate: currentDay.date,
            betCount: currentDay.bets.length,
            historyCount: history.length,
            totalBetsInHistory: history.reduce((sum, day) => sum + day.bets.length, 0)
        };
    }

    // 清除所有数据(危险操作)
    clearAll() {
        try {
            localStorage.removeItem(this.STORAGE_KEYS.CURRENT_DAY);
            localStorage.removeItem(this.STORAGE_KEYS.HISTORY);
            return { success: true, message: '所有数据已清除' };
        } catch (error) {
            console.error('清除数据失败:', error);
            return { success: false, message: '清除数据失败: ' + error.message };
        }
    }
}

// 导出存储实例
const storage = new DataStorage();
