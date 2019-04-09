var express = require('express');
var router = express.Router();
var query = require('../db/DBConfig');
var missionSQL = require('../db/Missionsql');
var userSQL = require('../db/Usersql');
var moment = require('moment');
var utility = require("utility");
var sms = require('../sms')
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
//用户查看自己已发布的所有任务(作为雇主)
router.post('/myMission', async (req, res) => {
  var myTask = req.body;
  var master = myTask.user_id;
  var _res = res;
  var mission_statu = '';
  var mission_id = '';
  var data = {}
  data.data = {}
  var queryAll = await query(missionSQL.queryAllTask)
  if (queryAll) {
    for (let i = 0; i < queryAll.length; i++) {
      var curtime = moment().format("YYYY-MM-DD HH:mm:ss");
      if (queryAll[i].validtime < curtime) {
        mission_statu = 3;
        mission_id = queryAll[i].mission_id;
      }
      await query(missionSQL.changeTaskStatus, [mission_statu, mission_id]);
    }
  }
  var myMission = await query(userSQL.getTask, [master])
  var list = [];
  var isQuery = false;
  if (myMission) {
    isQuery = true;
    for (let i = 0; i < myMission.length; i++) {
      list[i] = myMission[i];
    }
  }
  if (isQuery == true) {
    data.data = list;
    data.status = 0;
    data.msg = "success"
  }
  //console.log(data.data)
  responseJSON(_res, data);
})
//用户查看自己已接收的所有任务（作为打工仔）myAcceptMission
router.post('/myAcceptMission', async (req, res) => {
  var myTask = req.body;
  var slave = myTask.user_id;
  var _res = res;
  var mission_statu = '';
  var mission_id = '';
  var data = {}
  data.data = {}
  var queryAll = await query(missionSQL.queryAllTask)
  if (queryAll) {
    for (let i = 0; i < queryAll.length; i++) {
      var curtime = moment().format("YYYY-MM-DD HH:mm:ss");
      if (queryAll[i].validtime < curtime) {
        mission_statu = 3;
        mission_id = queryAll[i].mission_id;
      }
      await query(missionSQL.changeTaskStatus, [mission_statu, mission_id]);
    }
  }
  var myMission = await query(userSQL.getAccept, [slave])
  var list = [];
  var isQuery = false;
  if (myMission) {
    isQuery = true;
    for (let i = 0; i < myMission.length; i++) {
      list[i] = myMission[i]
    }
  }
  if (isQuery == true) {
    if (list.length != 0) {
      data.data = list;
      data.status = 0;
      data.msg = "查询成功"
    } else {
      data.data = "null"
      data.status = -1;
      data.msg = "暂无数据"
    }

  }
  responseJSON(_res, data);
})

router.post('/sms',  (req, res) => {
  var code = ''
  var data = {}
  var _res = res;
  var phoneNumbers = [req.body.tel];
  var aaa = parseInt(Math.random()*900000|0+100000)
  var params =[]; 
  var a = aaa ;
  var b = 10;
  params.push(a); 
  params.push(b);
  console.log(params)
  //sms.seen(phoneNumbers,params,callback)
  function callback(err, res, resData) {
    if (err) {
      console.log("err: ", err);
    } else{
      console.log(resData);
      console.log(resData.result)
     /*  if(resData.result==0){
        code = aaa;
        data.code = code;
        data.status = 0;
        data.msg = "success"
      } */
    }
  }
  
  responseJSON(_res, data);
});

module.exports = router;
