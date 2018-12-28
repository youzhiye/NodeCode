### 当初为了学习nodejs自己写的一个小脚本，现在有点时间了，重新把它完善了一下。

### 特性

* 自动识别404页面
* 支持使用正则过滤404页面
* 支持对字典的黑/白名单过滤
* 从字典的指定位置继续扫描
* 指定时间间隔发送请求

#### ToDo

* Haed发包（有需求了再写）

#### 命令参数

```
node wwwscan.js -h
Usage: wwwscan [options]

Options:
  -V, --version               output the version number
  -H, --HostorDomain <host>   domain or host
  -T, --time <number>         the sprit sleep time
  -D, --dict <string>         the dict you select
  -C, --continueNum [mnmber]  from continue number to scan
  -B, --blacklist <list>      blacklist
  -N, --notfound <string>     404 regx
  -O, --only <string>         only scan type
  -h, --help                  output usage information
```
