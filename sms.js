var QcloudSms = require("qcloudsms_js");
var appid = 1400189326;
var appkey = "a2b2a463d3ca0991038139655c54cd18";
var templateId = 287923;
var smsSign = "Serdy";
var qcloudsms = QcloudSms(appid, appkey);
var ssender = qcloudsms.SmsSingleSender();

exports.seen = function (phoneNumbers, params, callback) {
    ssender.sendWithParam(86, phoneNumbers[0], templateId,
        params, smsSign, "", "", callback);
}