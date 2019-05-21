const fs = require('fs');
const readline = require('readline');
const http = require('http');
const program = require('commander');
const ora = require('ora');
const process = require('process');
const colors = require('colors');
const ip = require('netmask').Netmask;
const puppeteer = require('puppeteer');
const net = require('net')
const Socket = net.Socket

program
    .version('0.0.1')
    .option('-H, --ip <ip address>', 'domain or host')
    .option('-P, --port <number>', 'port')
    .option('-F, --listfile <file>', 'host list')
    .option('-D, --listDomain <file>', 'host list')
    .option('-O, --outfile <filename>', 'output file name')
    .parse(process.argv);

var spinner = ora({
    text: 'start scanning...',
    spinner: 'dots',
    interval: 100
}).start();
fs.writeFileSync(program.outfile, '### scan report  \n');
var port = deal_port(program.port);
var urls = [];

function sleepwait(time) {
    return new Promise((resolve, rej) => {
        setTimeout(() => {
            resolve('test');
        }, time);
    })
}

if (program.listfile) {
    var ipaddress = deal_iplist(program.listfile);
} else if (program.listDomain) {
    var ipaddress = deal_hostlist(program.listDomain);
} else {
    var ipaddress = deal_ip(program.ip);
    run(ipaddress);
}

function run(ipaddress) {
    puppeteer.launch({
        'headless': false,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors', '--allow-running-insecure-content']
    }).then(async browser => {
        const page = await browser.newPage();
        var count = 1;
        var num = ipaddress.length;
        for (let ipadd of ipaddress) {
            let jpg = 'pic/' + ipadd.replace(/http[s]*:\/\//,'').replace(':','_') + '.jpg';
            spinner.start(`第${count}/${num}条 ` + ipadd);
            count++;
            try {
                await page.goto(ipadd, {
                    'timeout': 50000
                });
                await page.screenshot({
                    path: jpg
                });
                await page.waitFor(500);
                fs.appendFileSync(program.outfile, '* url: ' + ipadd + '  \n' + '<img src="' + jpg + '">  \n');
                await page.reload();
            } catch (e) {
                console.log(e.message);
                await page.waitFor(100);
            }
        }
        await browser.close();
        spinner.stop('done');
    });
}

function deal_port(port) {
    let port_return = [];
    let port_arr = port.split(',')
    for (let i of port_arr) {
        if (i.match('-')) {
            let portnum = i.split('-');
            for (let j = portnum[0]; j <= portnum[1]; j++) {
                port_return.push(j.toString())
            }
        } else {
            port_return.push(i);
        }
    }
    return port_return;
}

function deal_ip(ipaddr) {
    let ipaddress = new ip(ipaddr);
    let ip_return = [];
    ipaddress.forEach(element => {
        ip_return.push(element);
    });
    return ip_return;
}

function deal_ip1(ipaddr) {
    var iplist = ipaddr.split('.')[3];
    var ip_return = [];
    for (let i = iplist; i < 255; i++) {
        ip_return.push(ipaddr.slice(0, -3) + i)
    }
    return ip_return
}

function deal_hostlist(ipaddr) {
    var ip_return = [];
    const rl = readline.createInterface({
        input: fs.createReadStream(ipaddr),
        crlfDelay: Infinity
    });
    rl.on('line', (line) => {
        let ipaddress = line;
        ip_return.push(ipaddress);
    })
    rl.on('close', () => {
        cheak_openTCP(ip_return);
    })
}

function deal_iplist(ipaddr) {
    var ip_return = [];
    const rl = readline.createInterface({
        input: fs.createReadStream(ipaddr),
        crlfDelay: Infinity
    });
    rl.on('line', (line) => {
        let ipaddress = new ip(line);
        ipaddress.forEach(element => {
            ip_return.push(element);
        });
    })
    rl.on('close', () => {
        cheak_openTCP(ip_return);
    })
}

function cheak_open(port, host, flag) {
    var socket = new Socket()
    var status = null;

    socket.setTimeout(500);

    socket.on('timeout', function () {
        status = false
        error = new Error('Timeout 500ms')
        socket.destroy()
    })


    socket.on('connect', function () {
        status = true
        socket.destroy()
    })

    socket.on('close', function (exception) {
        //console.log(flag)
        if (status) {
            if (flag === 0) {
                if (port === '443') {
                    var total_host = 'https://' + host;
                } else if (port === '8443') {
                    var total_host = 'https://' + host + ':8443';
                } else {
                    var total_host = 'http://' + host + ':' + port
                }
                urls.push(total_host)
            } else {
                //console.log(1111);
                run(urls);
            }
        }
        else{
            if(flag === 1){
                //console.log(1111);
                run(urls);
            }
        }
    })

    socket.connect(port, host);
}
async function cheak_openTCP(ipaddress) {
    var num = ipaddress.length * port.length;
    var count = 1;
    for (let ipadd of ipaddress) {
        for (let portnum of port) {
            spinner.start(`${count}/${num} checking ${ipadd}:${portnum}`);
            if (count < num)
                cheak_open(portnum, ipadd, 0);
            else {
                cheak_open(portnum, ipadd, 1)
            }
            count++;
            //console.log(count,num);
            await sleepwait(500);
        }
    }
}
