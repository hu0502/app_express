'use strict';
var GeTui = require('./GT.push');
var Target = require('./getui/Target');
var SingleMessage = require('./getui/message/SingleMessage');
var TransmissionTemplate = require('./getui/template/TransmissionTemplate');
var APPID = 'dg52AT3NpQArApulOh2EU';
var APPKEY = '	FC6vbbYwdO8OG3LDNNSGU4';
var MASTERSECRET = 'IMGDYwmCSC7W7uDLcPuGR1';
//var CID = 'e560b884d8d9bf5bc5a0f9da545a11f3';//填入CID
//别名推送方式
//var ALIAS = '';
var HOST = 'http://sdk.open.api.igexin.com/apiex.htm';

var gt = new GeTui(HOST, APPKEY, MASTERSECRET);

gt.connect(function () {
    pushMessageToSingle();
});
function pushMessageToSingle() {
    var template = TransmissionTemplateDemo();
    //单推消息体
    var message = new SingleMessage({
        isOffline: true,                        //是否离线
        offlineExpireTime: 3600 * 12 * 1000,    //离线时间
        data: template                          //设置推送消息类型
    });
    //接收方
    var target = new Target({
        appId: APPID,
        clientId: CID
        //alias:ALIAS
    });

    target.setAppId(APPID).setClientId(CID);
    //target.setAppId(APPID).setAlias(ALIAS);
    gt.pushMessageToSingle(message, target, function(err, res){
        if(err != null && err.exception != null && err.exception instanceof  RequestError){
            var requestId = err.exception.requestId;
            console.log(err.exception.requestId);
            //发送异常重传
            gt.pushMessageToSingle(message,target,requestId,function(err, res){
                console.log(err);
                console.log(res);
            });
        }
    });
}
function TransmissionTemplateDemo() {
    var template =  new TransmissionTemplate({
        appId: APPID,
        appKey: APPKEY,
        transmissionType: 1,
        transmissionContent: '测试离线'
    });
    return template;
}
