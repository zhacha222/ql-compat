# 第 2 讲：Node.js 版本分界线速查表

下表的"起始版本"是指**该 API 从哪个 Node.js 版本开始可直接使用**。
低于该版本调用，通常不是得到 `undefined`，而是**直接抛异常中断脚本**。

| API | 起始版本 | 低版本调用后果 |
| --- | --- | --- |
| `fs.rmSync()` | 14.14 | `TypeError: fs.rmSync is not a function` |
| `WeakRef` / `FinalizationRegistry` | 14.6 | 构造时 `TypeError` |
| CommonJS 顶层 `await` | 14.8 | `SyntaxError`（直接无法解析） |
| `require("node:fs")` 前缀 | 14.18 | `MODULE_NOT_FOUND` |
| `String.prototype.replaceAll()` | 15 | `TypeError` |
| `Promise.any()` | 15 | `TypeError` |
| `Array.prototype.at()` | 16.6 | `TypeError` |
| `Object.hasOwn()` | 16.9 | `TypeError` |
| `new Error(msg, { cause })` | 16.9 | 静默丢弃 `cause`（不报错，更难查） |
| `structuredClone()` | 17 | `ReferenceError` |
| `AbortSignal.timeout()` | 17.3 | `TypeError` |
| 全局 `fetch` | 18 | `ReferenceError: fetch is not defined` |

## 怎么用这张表

1. **先查版本**：`node -v`，或看镜像 tag、面板文档；
2. **再对表**：确认代码里用到的 API 起始版本都不高于目标版本；
3. **有冲突就改写**，而不是升级运行环境——路由器、NAS、面板的 Node 通常升不动。

## 两类后果的区别

做题时容易被忽略的一点：**不是所有不兼容都会报错**。

- `fetch is not defined` 这类会立刻崩，问题暴露得快；
- `Error` 的 `cause` 被丢弃不会报错，只是排查时信息缺失，属于**隐性故障**。

生产中第二类更麻烦。写兼容兜底时，两者都要覆盖。

## 兼容写法示例

```js
// 不兼容：Node 17.3 之前没有 AbortSignal.timeout
const signal = AbortSignal.timeout(3000);

// 兼容：有就用，没有就退化，都没有就返回 undefined
function mkSignal(ms) {
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(ms);
  }
  if (typeof AbortController === 'function') {
    const controller = new AbortController();
    setTimeout(function () { controller.abort(); }, ms);
    return controller.signal;
  }
  return undefined;
}
```

这段写法体现的原则：**先探测、再回退**，而不是假定当前环境有什么。

## 本讲的检查点

1. 你的目标环境支持 `fetch` 吗？依据是什么？
2. `Object.hasOwn` 和 `Error` 的 `cause`，哪一个失败得更隐蔽？
3. 用自己的话说明"先探测、再回退"和"直接调用"的区别。
