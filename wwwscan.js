const program = require('commander');
const fs = require('fs');
const readline = require('readline');
const http = require('http');
const ora = require('ora');
const process = require('process');
const colors = require('colors');
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
var shortUrl = [];
var newArray = [];
var host = program.HostorDomain;  
var time = program.time;
var dict = program.dict;
var notfound = program.notfound || '1qwrt2add3zxv4vfr';
var spinner = ora({text:'start scanning...',spinner:'dots',interval:100}).start();

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
    shortUrl.push(line);
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
		gethash(newArray);
	}
	else if(program.only){
		let onlyArrary = program.only;
		for(let i of shortUrl){
			let ext = i.split('.').slice(-1);
			if(onlyArrary.includes(ext.join())){
				newArray.push(i);
			}
		}
		gethash(newArray);
	}
    else gethash(shortUrl);
})

//get请求，获取状态码
async function wwwscan(shorturl,hash){
	var total = shorturl.length;
	var reg = new RegExp(notfound);
    for(let i of shorturl){
		var url = host+i;
        spinner.start(`第${num}/${total}条 `+url);
        let test = http.get(url,(res)=>{
			var data1 = '';
            res.on('data',(data)=>{
				data1 = data1 + data;
			});
			res.on('end',()=>{
                let md5hash = crypto.createHash('md5').update(data1).digest('hex');
                if(md5hash != hash){
                    if(!data1.toString().match(reg)){
                        if(res.statusCode<404){
                            if (res.statusCode == 200)spinner.succeed(num+' '+res.req.agent.protocol+'//'+res.req.getHeaders().host+res.req.path+colors.green('\t [200]'));
                            else if(res.statusCode == 403) spinner.info(res.req.agent.protocol+'//'+res.req.getHeaders().host+res.req.path+colors.green('\t [403]'));
                            //else if(res.statusCode == 400) spinner.info(domain+res.req.path.replace('/','')+colors.green('\t [400]'));
                            else if(res.statusCode ==301) spinner.warn(res.req.agent.protocol+'//'+res.req.getHeaders().host+res.req.path+colors.green(`\t [${res.statusCode}]`));
                        }
                    }
                }
            })
        })
        test.on('error',(e)=>{
            spinner.fail(`第${num}条 `+url+'\t  '+colors.red(e.message));
        })
        await sleep(time);
        num++;
    }
    spinner.stop();
    console.log('done');
}
function gethash(ArrayElement){
    let hash = http.get(host+'qwertyuiopsdfghjkzxcvbnm',(res)=>{
        let Adata = '';
        res.on('data',(data)=>{
            Adata += data;
        })
        res.on('end',()=>{
            let md5hash = crypto.createHash('md5').update(Adata).digest('hex');
            wwwscan(ArrayElement,md5hash);
        })
    })
}