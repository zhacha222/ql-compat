# ql-compat

扫描青龙面板、群晖、路由器、Docker 容器里那些"本地跑得好好的、上线就报 `xxx is not a function`"的脚本。

这类环境的 Node 版本往往很旧，而本地默认是新版，问题只在远端炸。`ql-compat` 用零依赖的静态扫描，在提交前就把这些 API 找出来。

## 安装

```bash
npx ql-compat check ./scripts
```

或全局安装：

```bash
npm install -g ql-compat
ql-compat check ./scripts --node 14
```

要求 Node 12 及以上（本身也兼容老环境）。

## 用法

```bash
# 扫描目录，默认目标 Node 14
ql-compat check ./scripts

# 指定目标版本
ql-compat check ./scripts --node 12

# JSON 输出，接入 CI
ql-compat check ./scripts --json > report.json

# 忽略某条规则
ql-compat check ./scripts --ignore no-array-at,no-string-replace-all

# 查看全部规则
ql-compat rules
```

有 `error` 级问题时退出码为 `1`，只有 `warn` 时为 `0`，便于直接串进流水线：

```yaml
- run: npx ql-compat check ./scripts --node 14
```

## 规则

| 规则 | 起始版本 | 默认级别 | 说明 |
| --- | --- | --- | --- |
| `no-global-fetch` | 18 | error | 全局 `fetch` 未定义 |
| `no-abort-signal-timeout` | 17.3 | error | `AbortSignal.timeout()` 不存在 |
| `no-structured-clone` | 17 | error | `structuredClone()` 不存在 |
| `no-array-at` | 16.6 | warn | `Array.prototype.at()` 不存在 |
| `no-object-has-own` | 16.9 | error | `Object.hasOwn()` 不存在 |
| `no-fs-rm-sync` | 14.14 | error | `fs.rmSync()` 不存在 |
| `no-string-replace-all` | 15 | warn | `String.prototype.replaceAll()` 不存在 |
| `no-top-level-await` | 14.8 | error | CommonJS 顶层 `await` 直接语法错误 |
| `no-node-protocol` | 14.18 | error | `node:` 模块前缀不被识别 |
| `no-weak-ref` | 14.6 | error | `WeakRef` / `FinalizationRegistry` 不存在 |
| `no-promise-any` | 15 | error | `Promise.any()` 不存在 |
| `no-error-cause` | 16.9 | warn | `new Error(msg, { cause })` 被静默丢弃 |

## 准确性

扫描前会把字符串、模板字符串、行注释、块注释和正则字面量替换为空格，避免把注释里的示例当成真实调用；如果文件里已经声明了同名函数（例如自己写了 `fetch` 包装），该条规则会跳过，不产生噪音。

## 为什么会做这个

青龙、OpenWrt、群晖自带的 Node 版本参差不齐，很多脚本在本地 Node 20 上跑通，投到面板就报错。靠人工 review 很难覆盖，靠升级运行环境又常常不可行。把已知的版本分界线固化成规则，是最省事的一层防线。

欢迎提交新的版本差异规则。

## 自托管在线检查

仓库自带一个零依赖的演示服务，粘贴代码即可返回扫描结果，方便没有本地 Node 环境的面板用户使用：

```bash
PORT=8080 node web/server.js
# 打开 http://127.0.0.1:8080
```

接口：

```bash
curl -s http://127.0.0.1:8080/api/check \
  -H 'Content-Type: application/json' \
  -d '{"code":"fetch(\"https://example.com\")","node":14}'
```

服务只做内存分析，不写磁盘，单请求上限 200KB，单 IP 每分钟 60 次。Docker 与 systemd 部署示例见 `Dockerfile` 和 `deploy/ql-compat.service`。

## 教学模块

`docs/` 下是一套可直接开课的材料，用于讲解"为什么本地能跑、线上报错"这类部署兼容问题：

- 讲义：版本分界线是怎么产生的，为什么人工 review 容易漏
- 速查表：12 个 API 的起始版本与低版本调用后果
- 实验课：三段典型不兼容脚本 + 参考答案，学生先用工具定位、再手写兼容实现

实验材料由测试守着（`test/labs.js`）：错误示例必须被检出，参考答案必须零告警。

```bash
npm test
```

## 许可

[MIT](LICENSE)
