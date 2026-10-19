# 第 3 讲：实验课 —— 修复三段不兼容脚本

## 实验目标

用工具定位问题，再手写兼容实现，最后用工具验证修好了。

## 环境要求

- Node.js 12 及以上（实验脚本本身兼容旧版）
- 本仓库（`npm test` 可运行）

## 步骤

### 1. 看现象

```bash
node bin/ql-compat.js check docs/labs/broken --node 14
```

会列出若干 `文件:行:列`，每条都写明"起始版本"和"建议"。

### 2. 自己判断

先不急着改，对照 [02-node-api-timeline.md](02-node-api-timeline.md) 说出：

- 每条命中的 API 在 Node 14 上会具体怎么坏？
- 哪些是崩掉，哪些是静默失真？

### 3. 改写

三个脚本各对应一类典型问题：

| 文件 | 问题类型 |
| --- | --- |
| `broken/01-async-fetch.js` | 依赖全局 `fetch` |
| `broken/02-deep-copy.js` | 依赖 `structuredClone` / `Object.hasOwn` |
| `broken/03-batch-task.js` | `node:` 前缀、顶层 `await`、`Array.at()` |

改写要点：

- **别改运行环境**。目标环境升不动，只能让代码向下兼容；
- **先探测再回退**，不要假定某个 API 一定存在；
- 顶层 `await` 包进 `async function main()`；
- 数组取末位用 `arr[arr.length - 1]`，不要用 `arr.at(-1)`。

### 4. 自验

```bash
node bin/ql-compat.js check docs/labs/solutions --node 14
```

参考答案应当**零输出**。也可以直接跑仓库测试：

```bash
npm test
```

测试里有一条专门守着这个实验：错误示例必须被检出、参考答案必须零告警。

## 验收标准

- [ ] 能说出每个 API 的起始版本
- [ ] 改写后的脚本在自己的目标版本上可以执行
- [ ] 用 `ql-compat` 复扫没有 `error` 级输出
- [ ] 至少有一个 API 采用了"先探测再回退"写法

## 思考题

如果某个 API 在旧版本无论如何都无法替代（例如 `fs.rmSync` 需要递归删除），
你会怎么处理？提示：查该 API 出现之前，官方推荐的做法是什么。
