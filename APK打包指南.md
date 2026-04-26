# APK打包完整指南

## 🚀 三种方案(从易到难)

---

## 方案1: 在线APK生成器 (最简单!⭐⭐⭐⭐⭐)

### 推荐工具: Website 2 APK Builder

**步骤:**

1. **下载工具**
   - 访问: https://website2apk.com/
   - 下载Website 2 APK Builder Pro

2. **配置项目**
   - 打开软件
   - 选择"Local HTML Website"
   - 浏览选择文件夹: `E:\lottery-betting-tool`
   - App名称: 六合彩工具
   - Package Name: com.lottery.tool
   - Version: 1.0

3. **设置图标**(可选)
   - 准备一个512x512的PNG图片
   - 在Icon设置中上传

4. **生成APK**
   - 点击"Generate APK"
   - 等待编译完成
   - APK保存在输出目录

5. **安装到手机**
   - 通过USB传输APK到手机
   - 或者上传到网盘,手机下载
   - 安装即可使用

**优点:**
- ✅ 不需要编程知识
- ✅ 图形界面,操作简单
- ✅ 5分钟搞定
- ✅ 完全离线使用

**缺点:**
- ⚠️ 免费版可能有水印

---

## 方案2: 使用HBuilder X (国产,简单)

### 步骤:

1. **下载HBuilder X**
   - 访问: https://www.dcloud.io/hbuilderx.html
   - 下载标准版

2. **创建项目**
   - 打开HBuilder X
   - 文件 → 新建 → 项目
   - 选择"5+App"
   - 项目名称: 六合彩工具

3. **复制文件**
   - 删除项目中的默认文件
   - 把 `E:\lottery-betting-tool` 的所有文件复制进去

4. **云打包**
   - 右键项目 → 发行 → 原生App-云打包
   - 选择Android
   - 点击打包
   - 等待云端编译完成
   - 下载APK

**优点:**
- ✅ 中文界面
- ✅ 云打包,不需要本地环境
- ✅ 免费

---

## 方案3: 使用Cordova命令行 (已安装)

### 前提条件:

需要先安装:
1. **Java JDK 11+**
   - 下载: https://adoptium.net/
   - 安装后设置JAVA_HOME环境变量

2. **Android SDK**
   - 下载: https://developer.android.com/studio
   - 或只下载Command line tools
   - 设置ANDROID_HOME环境变量

3. **Gradle**
   - Cordova会自动下载

### 如果已安装Android环境:

```bash
cd E:\lottery-betting-tool\lottery-app
cordova build android
```

APK位置:
```
E:\lottery-betting-tool\lottery-app\platforms\android\app\build\outputs\apk\debug\app-debug.apk
```

---

## 💡 我的建议

### 如果你想要最快:
**✅ 使用方案1 (Website 2 APK Builder)**
- 下载安装软件
- 选择文件夹
- 一键生成APK
- 全程10分钟

### 如果你想要免费:
**✅ 使用方案2 (HBuilder X)**
- 注册DCloud账号
- 云打包
- 完全免费

### 如果你是开发者:
**✅ 使用方案3 (Cordova)**
- 需要配置Android环境
- 但最灵活可控

---

## 📱 APK安装到手机

### 方法1: USB传输
1. 手机连接电脑
2. 复制APK到手机
3. 手机打开文件管理器
4. 点击APK安装

### 方法2: 网盘分享
1. 上传APK到百度网盘/阿里云盘
2. 手机下载网盘APP
3. 下载APK并安装

### 方法3: QQ/微信传输
1. 发送APK到手机QQ/微信
2. 手机接收文件
3. 点击安装

---

## ⚙️ Android权限设置

为了让APP正常工作,需要在打包时添加以下权限:

```xml
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.INTERNET" />
```

大多数打包工具会自动添加这些权限。

---

## 🎨 APP图标制作

### 在线工具:
- https://www.iconfont.cn/
- https://flaticon.com/

### 要求:
- 格式: PNG
- 尺寸: 512x512 或 1024x1024
- 背景: 透明或纯色

---

## ❓ 常见问题

### Q: 为什么APK安装失败?
A: 
- 检查是否开启"允许安装未知来源应用"
- 检查手机存储空间
- 检查APK是否损坏

### Q: APP打开是空白?
A:
- 检查HTML文件路径是否正确
- 检查是否有JavaScript错误
- 尝试在浏览器中先测试

### Q: 数据能保存吗?
A:
- 可以!使用LocalStorage
- 数据保存在手机中
- 卸载APP会清除数据

---

## 🚀 立即开始

**推荐操作:**

1. 访问 https://website2apk.com/
2. 下载Website 2 APK Builder
3. 安装并打开
4. 选择 `E:\lottery-betting-tool` 文件夹
5. 点击"Generate APK"
6. 等待完成
7. 传输到手机安装

**全程只需10分钟!** 🎉

---

需要我帮你准备什么文件吗? 😊
