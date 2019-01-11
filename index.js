const fs = require('fs');
const readline = require('readline');
const http = require('http');
const program = require('commander');
const ora = require('ora');
const process = require('process');
const colors = require('colors');
const ip = require('netmask').Netmask;
const puppeteer = require('puppeteer');

program
  .version('0.0.1')
  .option('-H, --ip <ip address>','domain or host')
  .option('-P, --port <number>','port')
  .option('-F, --listfile <file>','host list')
  .option('-O, --outfile <filename>','output file name')
  .parse(process.argv);

var spinner = ora({text:'start scanning...',spinner:'dots',interval:100}).start();
fs.writeFileSync(program.outfile,'### scan report  \n');
var port = deal_port(program.port);

if(program.listfile){
    var ipaddress = deal_iplist(program.listfile);
}
else{
    var ipaddress = deal_ip(program.ip);
    run(ipaddress);
}

function run(ipaddress) {
    puppeteer.launch({'headless':false,"args": ['--proxy-server=socks5://127.0.0.1:8888']}).then(async browser => {
        const page = await browser.newPage();
        await page.waitFor(60000);
        var num = ipaddress.length * port.length;
        var count = 1;
        for (let ipadd of ipaddress) {
            for (let portnum of port) {
                let url = 'http://' + ipadd + ':' + portnum;
                let jpg = 'pic/' + ipadd + '_' + portnum + '.jpg';
                spinner.start(`第${count}/${num}条 ` + url);
                count++;
                for(n = 0; n<3 ; n++){
                    try {
                        await page.goto(url, { 'timeout': 5000 });
                        await page.screenshot({ path: jpg });
                        await page.waitFor(2000);
                        fs.appendFileSync(program.outfile, '* url: ' + url + '  \n' + '<img src="' + jpg + '">  \n');
                        await page.reload();
                        }
                    catch (e) {
                        console.log(e.message);
                        await page.waitFor(2000);
                    }
                }
            }
        }
        await browser.close();
        spinner.stop('done');
    });
}

function deal_port(port){
    let port_return = [];
    let port_arr = port.split(',')
    for(let i of port_arr){
        if(i.match('-')){
            let portnum = i.split('-');
            for(let j = portnum[0];j <= portnum[1]; j++){
                port_return.push(j.toString())
            }
        }
        else{
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

function deal_iplist(ipaddr){
    var ip_return = [];
    const rl = readline.createInterface({
        input: fs.createReadStream(ipaddr),
        crlfDelay: Infinity
    });
    rl.on('line',(line)=>{
        let ipaddress = new ip(line);
        ipaddress.forEach(element => {
            ip_return.push(element);
        });
    })
    rl.on('close',()=>{
        run(ip_return);
    })
}