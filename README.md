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

## 准确性

扫描前会把字符串、模板字符串、行注释、块注释和正则字面量替换为空格，避免把注释里的示例当成真实调用；如果文件里已经声明了同名函数（例如自己写了 `fetch` 包装），该条规则会跳过，不产生噪音。

## 为什么会做这个

青龙、OpenWrt、群晖自带的 Node 版本参差不齐，很多脚本在本地 Node 20 上跑通，投到面板就报错。靠人工 review 很难覆盖，靠升级运行环境又常常不可行。把已知的版本分界线固化成规则，是最省事的一层防线。

欢迎提交新的版本差异规则。

## 许可

[MIT](LICENSE)
