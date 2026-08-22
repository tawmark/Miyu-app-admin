/**
 * 社交APP 后台原型 - 一键发布脚本
 *
 * 功能：双击「一键发布.bat」后自动完成：
 *   1. 语法校验主文件（提取所有 <script> 块做 JS 语法检查）
 *   2. 同步副本 admin-prototype.html（主文件 = 唯一真源）
 *   3. MD5 校验主文件与副本一致
 *   4. 生成发布产物 dist/（admin-prototype.html + version.txt，含时间戳与 MD5）
 *   5. 若存在 deploy-config.json 且 enable=true，执行 uploadCmd 上传（可选钩子）
 *
 * 部署钩子（可选）：把 deploy-config.example.json 复制为 deploy-config.json，
 * 将 uploadCmd 改成你的上传命令（COS / OSS / SCP / GitHub Pages 等）即可。
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const ROOT = __dirname;
const MAIN = path.join(ROOT, '后台原型界面.html');
const COPY = path.join(ROOT, 'admin-prototype.html');
const DIST = path.join(ROOT, 'dist');
const CFG = path.join(ROOT, 'deploy-config.json');

const BLUE = '\x1b[36m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

function md5(file) {
  return crypto.createHash('md5').update(fs.readFileSync(file)).digest('hex');
}

function fmtSize(bytes) {
  return bytes > 1024 * 1024 ? (bytes / 1024 / 1024).toFixed(2) + ' MB' : (bytes / 1024).toFixed(1) + ' KB';
}

function now() {
  const d = new Date();
  const zp = (n) => (n < 10 ? '0' + n : '' + n);
  return d.getFullYear() + '-' + zp(d.getMonth() + 1) + '-' + zp(d.getDate()) + ' ' + zp(d.getHours()) + ':' + zp(d.getMinutes()) + ':' + zp(d.getSeconds());
}

function step(msg) {
  console.log('\n' + BLUE + '==> ' + msg + RESET);
}

function ok(msg) {
  console.log('    ' + GREEN + '[OK] ' + msg + RESET);
}

function fail(msg) {
  console.log('    ' + RED + '[FAIL] ' + msg + RESET);
}

function syntaxCheck(file) {
  const html = fs.readFileSync(file, 'utf8');
  const re = /<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi;
  let m, all = '', n = 0;
  while ((m = re.exec(html)) !== null) {
    all += '\n' + m[1];
    n++;
  }
  try {
    new Function(all);
  } catch (e) {
    throw new Error('JS 语法错误: ' + e.message);
  }
  return n;
}

function main() {
  console.log('==============================================');
  console.log(' 社交APP 后台原型 - 一键发布工具');
  console.log('==============================================');

  let failed = false;

  // 1. 主文件存在性
  if (!fs.existsSync(MAIN)) {
    fail('未找到主文件: 后台原型界面.html');
    process.exit(1);
  }
  step('语法校验主文件');
  const blockCount = syntaxCheck(MAIN);
  ok('主文件脚本语法通过（共 ' + blockCount + ' 个 script 块）');

  // 2. 同步副本
  step('同步副本 admin-prototype.html');
  fs.copyFileSync(MAIN, COPY);
  ok('已同步副本');

  // 3. MD5 校验
  const h1 = md5(MAIN);
  const h2 = md5(COPY);
  if (h1 === h2) {
    ok('MD5 校验一致: ' + h1);
  } else {
    fail('MD5 不一致（主文件 ' + h1 + ' / 副本 ' + h2 + '），请检查工作区');
    failed = true;
  }

  // 4. 生成发布产物 dist/
  step('生成发布产物 dist/');
  if (!fs.existsSync(DIST)) fs.mkdirSync(DIST, { recursive: true });
  fs.copyFileSync(COPY, path.join(DIST, 'admin-prototype.html'));
  const ver = [
    '版本时间: ' + now(),
    '主文件 MD5: ' + h1,
    '文件大小: ' + fmtSize(fs.statSync(MAIN).size),
    '发布人: 后台管理',
  ].join('\n');
  fs.writeFileSync(path.join(DIST, 'version.txt'), ver, 'utf8');
  ok('dist/ 已生成（admin-prototype.html / version.txt）');

  // 5. 可选部署钩子
  step('部署钩子');
  if (fs.existsSync(CFG)) {
    try {
      const cfg = JSON.parse(fs.readFileSync(CFG, 'utf8'));
      if (cfg.enable === true && cfg.uploadCmd) {
        console.log('    执行上传命令...');
        execSync(cfg.uploadCmd, { cwd: ROOT, stdio: 'inherit', shell: true });
        ok('上传命令执行完成');
      } else {
        console.log('    ' + YELLOW + '[SKIP] deploy-config.json 未启用或未配置 uploadCmd' + RESET);
      }
    } catch (e) {
      fail('配置解析/上传失败: ' + e.message);
      failed = true;
    }
  } else {
    console.log('    ' + YELLOW + '[SKIP] 未发现 deploy-config.json，如需要上传请参考 deploy-config.example.json' + RESET);
  }

  console.log('\n==============================================');
  if (failed) {
    console.log(RED + ' 结果: 存在异常，请检查上方 [FAIL] 项' + RESET);
    process.exit(1);
  } else {
    console.log(GREEN + ' 结果: 全部通过，可分发 dist/ 目录' + RESET);
    console.log(BLUE + ' 时间: ' + now() + RESET);
  }
  console.log('==============================================');
}

main();