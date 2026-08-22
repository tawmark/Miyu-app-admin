# 社交APP 后台管理原型

蝶语社交APP 运营后台高保真原型（单文件 HTML，无外部依赖）。

## 文件

| 文件 | 说明 |
| --- | --- |
| `后台原型界面.html` | 本地唯一真源（不推送到 GitHub，仅存本地工作区） |
| `admin-prototype.html` | 自动同步副本，即 GitHub Pages 实际展示页面 |
| `index.html` | 入口页，访问根地址时自动跳转到 `admin-prototype.html` |
| `dist/` | 一键发布产物目录（含 version.txt） |

## 部署

双击 `一键发布.bat` 自动完成：语法校验 → 同步副本 → MD5 校验 → 生成产物 → 推送到 GitHub Pages。

部署脚本只推送白名单文件（`index.html` / `admin-prototype.html` / `dist/` / 脚本与文档），本地文件 `后台原型界面.html` 和 `一键发布.bat` 不会上传。

详细步骤见 [GitHub-Pages-部署说明.md](GitHub-Pages-部署说明.md)。

访问地址：`https://<你的账号>.github.io/<仓库名>/`