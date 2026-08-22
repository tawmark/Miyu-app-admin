/**
 * GitHub Pages 自动部署脚本
 *
 * 由「一键发布.bat」调用（deploy-config.json -> uploadCmd: "node deploy-github.js"）。
 * 职责：把最新 HTML 产物推送到 GitHub 仓库 main 分支，GitHub Pages 自动发布。
 *
 * 首次使用（一次性）：
 *   1. 在 GitHub 新建仓库（任意名字，建议 public 或 private + Pages 公开）
 *   2. 复制仓库地址，例如 https://github.com/你的账号/social-app-admin.git
 *   3. 在本目录执行： git remote add origin 你的仓库地址
 *   4. GitHub 仓库 Settings -> Pages -> Source: Deploy from a branch -> main / (root) -> Save
 *   之后每次双击「一键发布.bat」即可自动推送。
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = __dirname;
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

// 需要纳入版本管理的文件（均为工作区内的项目产物）
const TRACKED = [
  '后台原型界面.html',
  'admin-prototype.html',
  'dist',
  'sync-publish.js',
  'deploy-github.js',
  '一键发布.bat',
  'deploy-config.example.json',
  'README.md',
  '.gitignore'
];

function run(cmd, opts) {
  return execSync(cmd, Object.assign({ cwd: ROOT, stdio: ['pipe', 'pipe', 'pipe'], encoding: 'utf8', shell: true }, opts || {}));
}

function git(cmd) {
  return run('git ' + cmd).trim();
}

function step(msg) { console.log('\n' + CYAN + '==> ' + msg + RESET); }
function ok(msg)   { console.log('    ' + GREEN + '[OK] ' + msg + RESET); }
function warn(msg) { console.log('    ' + YELLOW + '[INFO] ' + msg + RESET); }
function fail(msg) { console.log('    ' + RED + '[FAIL] ' + msg + RESET); process.exit(1); }

function parsePagesUrl() {
  try {
    const remote = git('config --get remote.origin.url');
    let m = remote.match(/github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?$/);
    if (!m) return null;
    const user = m[1].replace(/^git@/, '');
    const repo = m[2].replace(/\.git$/, '');
    return 'https://' + user + '.github.io/' + repo + '/';
  } catch (e) {
    return null;
  }
}

function main() {
  console.log('==============================================');
  console.log(' GitHub Pages 自动部署');
  console.log('==============================================');

  // 0. git 可用性
  try {
    git('--version');
  } catch (e) {
    fail('未检测到 git，请先安装 Git for Windows: https://git-scm.com/downloads');
  }

  // 1. 仓库初始化
  if (!fs.existsSync(path.join(ROOT, '.git'))) {
    step('初始化 git 仓库');
    run('git init -b main');
    // 仓库级身份配置（不影响全局），避免首次提交报错
    try { git('config user.name'); } catch (e) { run('git config user.name "Social Admin"'); }
    try { git('config user.email'); } catch (e) { run('git config user.email "social-admin@users.noreply.github.com"'); }
    ok('已初始化 main 分支（提交身份使用仓库本地配置 "Social Admin"，可在 .git/config 中修改）');
  }

  // 2. remote 检查
  let hasRemote = true;
  try { git('config --get remote.origin.url'); } catch (e) { hasRemote = false; }
  if (!hasRemote) {
    fail('尚未配置 GitHub 远程仓库。请先执行一次：\n        git remote add origin https://github.com/你的账号/你的仓库名.git\n    然后在 GitHub 仓库 Settings -> Pages -> Deploy from a branch -> main/(root) 启用 Pages 后重试');
  }
  ok('远程仓库已配置: ' + git('config --get remote.origin.url'));

  // 3. 暂存产物
  step('暂存发布产物');
  const missing = TRACKED.filter(function (f) { return !fs.existsSync(path.join(ROOT, f)); });
  if (missing.length) warn('以下文件不存在将跳过: ' + missing.join(', '));
  const targets = TRACKED.filter(function (f) { return fs.existsSync(path.join(ROOT, f)); });
  git('add ' + targets.map(JSON.stringify).join(' '));
  ok('已暂存: ' + targets.join(', '));

  // 4. 提交（无变更则跳过）
  step('提交');
  let hasChanges = true;
  try {
    const diff = git('diff --cached --quiet');
    hasChanges = false;
  } catch (e) {
    hasChanges = true; // diff --quiet 非零退出码 = 有变更
  }
  if (!hasChanges) {
    warn('没有新变更，跳过提交');
  } else {
    const d = new Date();
    const zp = (n) => (n < 10 ? '0' + n : '' + n);
    const ts = d.getFullYear() + '-' + zp(d.getMonth() + 1) + '-' + zp(d.getDate()) + ' ' + zp(d.getHours()) + ':' + zp(d.getMinutes());
    git('commit -m "auto deploy: ' + ts + '"');
    ok('已提交');
  }

  // 5. 推送
  step('推送到 GitHub');
  try {
    git('push origin main');
    ok('推送成功');
  } catch (e) {
    fail('推送失败：' + e.message.split('\n').filter(function (l) { return l.trim(); }).slice(-3).join(' | ') + '\n    如为第一次推送，请确认仓库已创建且分支无冲突（可尝试 git pull origin main --rebase 后重试）');
  }

  // 6. 输出访问地址
  const url = parsePagesUrl();
  console.log('\n==============================================');
  if (url) {
    console.log(GREEN + ' 部署完成！固定访问地址（GitHub Pages 生效约需 1-2 分钟）：');
    console.log('   ' + url + RESET);
  } else {
    console.log(YELLOW + ' 部署完成！访问地址请到 GitHub 仓库 Settings -> Pages 查看' + RESET);
  }
  console.log('==============================================');
}

main();