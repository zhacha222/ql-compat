# 教学模块：Node.js 版本兼容性

这个目录是一套可以直接开课的教学材料，面向"本地能跑、上线就炸"这一类部署问题。

## 适用对象

- 学习 Node.js / 后端部署的在校学生
- 需要在课程里安排一次"部署排障"实验的教师
- 自学青龙面板、NAS、Docker 脚本维护的爱好者

## 课时安排（建议 2 学时）

| 课时 | 内容 | 文件 |
| --- | --- | --- |
| 第 1 学时 | 为什么本地通过不等于线上通过 | [01-why-local-passes-but-remote-fails.md](01-why-local-passes-but-remote-fails.md) |
| 第 1 学时 | 版本分界线速查表 | [02-node-api-timeline.md](02-node-api-timeline.md) |
| 第 2 学时 | 实验：修复三段不兼容脚本 | [03-lab-fix-incompatible-scripts.md](03-lab-fix-incompatible-scripts.md) |

## 学习目标

1. 能说清"运行环境版本"为什么会决定代码能否执行；
2. 能对照版本分界线判断某个 API 在目标环境是否存在；
3. 能用工具（`ql-compat`）而不是肉眼，批量发现这类问题；
4. 能写出带兼容兜底的替代实现。

## 实验材料自检

实验目录里的"错误示例"和"参考答案"都由仓库的自动化测试守着：

- `docs/labs/broken/` 下的脚本**必须**被检出问题；
- `docs/labs/solutions/` 下的脚本**必须**零告警。

也就是说，教学材料本身是可验证的，不会出现"老师给的答案自己都不干净"这种情况。

```bash
npm test
```
