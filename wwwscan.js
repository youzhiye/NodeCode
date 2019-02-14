const program = require('commander');
const fs = require('fs');
const urlmoudle = require('url');
const readline = require('readline');
const http = require('http');
const ora = require('ora');
const process = require('process');
const colors = require('colors');
const https = require('https');
var crypto = require('crypto');

//定义命令行参数
program
  .version('0.0.1')
  .option('-H, --HostorDomain <host>','domain or host')
  .option('-T, --time <number>','the sprit sleep time')
  .option('-D, --dict <string>','the dict you select')
  .option('-C, --continueNum [mnmber]','from continue number to scan')
  .option('-B, --blacklist <list>','blacklist')
  .option('-N, --notfound <string>','404 regx')
  .option('-O, --only <string>','only scan type')
  .parse(process.argv);

//定义变量
var num = 1;
var reg = '';
var hash = '';
var shortUrl = [];
var newArray = [];
var ArrayElement = '';
var dict = program.dict;
var time = program.time || 20;
var host = program.HostorDomain;
var historyFile = 'history/'+host.split('/')[2]+'.txt';
var whatHttp = inputHost(program.HostorDomain);
var notfound = program.notfound || '1qwrt2add3zxv4vfr';
var spinner = ora({text:'start scanning...',spinner:'dots',interval:100}).start();

fileCreate();

//设置延时
var sleep = (time) => {
    return new Promise((resolve, rej) => {
        setTimeout(() => {
            resolve('1');
        }, time);
    })
}

//读取字典文件
const rl = readline.createInterface({
    input: fs.createReadStream(dict),
    crlfDlay: Infinity
});

//将path存入数组
rl.on('line',(line) => {
    shortUrl.push(line.toString());
}).on('close',()=>{
    if(program.continueNum){
        let start = program.continueNum;
        shortUrl.splice(0,start-1);
        num = start;
	}
	if(program.blacklist){
		let blackArrary = program.blacklist.split(',');
		for(let i of shortUrl){
			let ext = i.split('.').slice(-1);
			if(!blackArrary.includes(ext.join())){
				newArray.push(i);
			}
        }
        ArrayElement = newArray;
		gethash();
	}
	else if(program.only){
		let onlyArrary = program.only;
		for(let i of shortUrl){
			let ext = i.split('.').slice(-1);
			if(onlyArrary.includes(ext.join())){
				newArray.push(i);
			}
        }
        ArrayElement = newArray;
		gethash();
	}
    else {
        ArrayElement = shortUrl;
        gethash();
    }
})

//get请求，获取状态码
async function wwwscan(shorturl){
	var total = shorturl.length;
	reg = new RegExp(notfound);
    for(let i of shorturl){
		var url = new URL(i,host);//host+i;
        spinner.start(`第${num}/${total}条 `+url);
        if(whatHttp)
        var test = https.get(url,AllRequest);
        else
        var test = http.get(url,AllRequest);
        test.on('error',(e)=>{
            spinner.fail(`第${num}条 `+url+'\t  '+colors.red(e.message));
        })
        await sleep(time);
        num++;
    }
    spinner.stop();
    console.log('done');
}
function gethash(){
    if(whatHttp){
    https.get(host+'qwertyuiopsdfghjkzxcvbnm',firstRequest);}
    else{
    http.get(host+'qwertyuiopsdfghjkzxcvbnm',firstRequest);}
}
function inputHost(host){
    if(host.slice(0,5) == 'https'){
        return true
    }
    else if(host.slice(0,4) == 'http'){
        return false
    }
    else{
        process.exit(0);
    }
}
function firstRequest(res){
    //console.log(res);
    let Adata = '';
        res.on('data',(data)=>{
            Adata += data;
        })
        res.on('end',()=>{
            hash = crypto.createHash('md5').update(Adata).digest('hex');
            wwwscan(ArrayElement);
        })
}
function AllRequest(res){
    var data1 = '';
    res.on('data', (data) => {
        data1 = data1 + data;
    });
    res.on('end', () => {
        let md5hash = crypto.createHash('md5').update(data1).digest('hex');
        if (md5hash != hash) {
            if (!data1.toString().match(reg)) {
                if (res.statusCode < 404) {
                    if (res.statusCode == 200){
                        let tips = res.req.agent.protocol + '//' + res.req.getHeaders().host + res.req.path + colors.green('\t [200]');
                        let tipsToFile = res.req.agent.protocol + '//' + res.req.getHeaders().host + res.req.path + '\t [200]' + '\n';
                        spinner.succeed(tips);
                        fileWrite(tipsToFile);
                    } 
                    else if (res.statusCode == 403){
                        let tips = res.req.agent.protocol + '//' + res.req.getHeaders().host + res.req.path + colors.green('\t [403]');
                        let tipsToFile = res.req.agent.protocol + '//' + res.req.getHeaders().host + res.req.path + '\t [403]' + '\n';
                        spinner.info(tips);
                        fileWrite(tipsToFile);
                    } 
                    else if (res.statusCode == 301|| res.statusCode == 302 || res.statusCode != 400){
                        let tips = res.req.agent.protocol + '//' + res.req.getHeaders().host + res.req.path + colors.green(`\t [${res.statusCode}]`);
                        let tipsToFile = res.req.agent.protocol + '//' + res.req.getHeaders().host + res.req.path + `\t [${res.statusCode}]` + '\n';
                        spinner.warn(tips);
                        fileWrite(tipsToFile);
                    } 
                }
            }
        }
    })
}

function fileCreate(){
    if(!fs.existsSync(historyFile))    fs.writeFileSync(historyFile,new Date().toLocaleString()+'\n');
    else    fs.appendFileSync(historyFile,'\n\n'+new Date().toLocaleString()+'\n')
}

function fileWrite(data){
    fs.appendFileSync(historyFile,data);
}