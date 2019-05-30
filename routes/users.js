var express = require('express');
var router = express.Router();
var query = require('../db/DBConfig');
var missionSQL = require('../db/Missionsql');
var userSQL = require('../db/Usersql');
var moment = require('moment');
var utility = require("utility");
var sms = require("../util/sms")
/* sms */

var responseJSON = function (res, ret) {
  if (typeof ret === 'undefined') {
    res.json({
      status: '-200',
      msg: '操作失败'
    });
    return;
  } else {
    res.json(ret);
  }
};

//用户登录
router.post('/login', async (req, res) => {
  var param = req.body;
  var user_name = param.user_name;
  var password = param.password;
  var _res = res;
  var data = {};
  var userInfos = [];
  const logins = await query(userSQL.queryAll)
  var LFlag = false;
  var md5Value = utility.md5(password);
  if (logins) {
    for (let i = 0; i < logins.length; i++) {
      if (logins[i].user_name == user_name && logins[i].password == md5Value) {
        LFlag = true;
        userInfos[i] = logins[i];
      } else if (logins[i].user_name == user_name && logins[i].password != password) {
        LFlag = false;
      }
    }
  }
  data.data = {};
  if (LFlag == true) {
    for (let i of userInfos) {
      data.data = i;
    }
    data.status = 0;
    data.msg = "登陆成功"
  } else {
    data.status = -1;
    data.msg = "用户名或密码错误";
  }
  responseJSON(_res, data);
});
//用户注册
router.post('/enroll', async (req, res) => {
  var roll = req.body;
  var user_name = roll.user_name;
  var password = roll.password;
  var tel = roll.tel;
  var department = roll.department;
  //var cid = roll.clientid;
  var _res = res;
  var data = {};
  const queryAll = await query(userSQL.queryAll)
  var verify = '';
  if (queryAll) {
    for (let i = 0; i < queryAll.length; i++) {
      if (queryAll[i].tel == roll.tel) {//手机号码或用户名唯一
        verify = -1;
      } else if (queryAll[i].user_name == roll.user_name) {
        verify = -2;
      }
    }
  }
  if (verify === -1) {
    data.status = -1;
    data.msg = "手机号已存在"
  } else if (verify === -2) {
    data.status = -2;
    data.msg = "用户名已存在"
  } else {
    await query(userSQL.enroll, [user_name, password, tel, department])
    data.status = 0;
    data.msg = "注册成功"
  }
  setTimeout(function () {
    responseJSON(_res, data)
  }, 300);
});
//查询个人信息
router.get('/selectUserMsg', async (req, res) => {
  var msg = req.query || req.params;
  var _res = res;
  var data = {};
  var userInfo = []
  const selects = await query(userSQL.getUserById, [msg.user_id])
  data.data = {};
  var selectsflag = false;
  if (selects) {
    selectsflag = true;
    for (var i = 0; i < selects.length; i++) {
      userInfo[i] = selects[i];
    }
  }
  if (selectsflag == true) {
    for (let i of userInfo) {
      data.data = i;
    }
    data.status = 0;
    data.msg = "查询成功"
  } else {
    data.status = -1;
    data.msg = "查询失败或用户不存在"
  }
  //console.log(data)
  responseJSON(_res, data);

});
//更新个人信息
router.post('/update', async (req, res) => {
  var updateInfo = req.body;//接收用户更新的信息
  var user_id = updateInfo.user_id;
  var password = updateInfo.password;
  var department = updateInfo.department;
  var sex = updateInfo.sex;
  var u_class = updateInfo.u_class;
  var data = {};
  var _res = res;
  const querys = await query(userSQL.getUserById, [user_id])
  if (querys) {
    var flag = ''
    for (let i = 0; i < querys.length; i++) {
      if (querys[i].user_id == user_id) {
        flag = 1;
      }
    }
  }
  if (flag === 1) {
    const aaa = await query(userSQL.update, [password, department, u_class, sex, user_id])
    if (aaa) {
      data.status = 0;
      data.msg = "个人信息更新成功"
    }
  } else {
    data.status = -1;
    data.msg = "用户不存在"
  }
  setTimeout(function () {
    responseJSON(_res, data)
  }, 300);
});

//sms
router.post('/sms',async function SMS(req, res) {
    var data = {}
    var _res = res;
    var phoneNumbers = [req.body.tel];
    var code = parseInt(Math.random() * 900000 | 0 + 100000)
    var params = [];
    var a = code;
    var b = 10;
    params.push(a);
    params.push(b);
    try {
      await sms.seen(phoneNumbers,params,callback)   
      function callback(err, res, resData) {
        if (err) {
          console.log("err: ", err);
        }else{
          //console.log(resData);
          if(resData.result === 0){
            data.code = params[0]
            console.log(data.code)
            data.status = 0;
            data.msg = resData.errmsg;
          }else{
            data.status= resData.result;
            data.msg = resData.errmsg;
          }
        }
        responseJSON(_res, data)
      }
    } catch (error) {
      console.log(error)
    }
  }
);

module.exports = router;
