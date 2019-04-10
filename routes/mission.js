var async = require('async');
var express = require('express');
var router = express.Router();
var query = require('../db/DBConfig');
var missionSQL = require('../db/Missionsql');
var userSQL = require('../db/Usersql');
var labelSQL = require('../db/Labelsql');
var moment = require('moment');
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
//发布任务
router.post('/issue', async (req, res) => {
  var task = req.body;
  var master = task.master;
  var score = task.score;
  var title = task.title;
  var description = task.description;
  var label = task.label;
  var location = task.location;
  var master_name = ''
  var create_time = moment().format("YYYY-MM-DD HH:mm:ss")
  var validtime = moment(task.validtime).format("YYYY-MM-DD HH:mm:ss")
  var data = {}
  if (validtime < create_time) {
    data.status = -1;
    data.msg = "有效时间不能小于当前时间"
  } else {
    const rows = await query(userSQL.getUserById, [master])
    if (rows) {
      var sss = '';
      for (let i = 0; i < rows.length; i++) {
        if (rows[i].user_id == master) {
          sss = rows[i].score;
          sss = (sss - score);
          master_name = rows[i].user_name
        }
      }
    }
    await query(userSQL.updateScoreById, [sss, master])
    const str = [description, title, label, location, validtime, create_time, score, master, master_name]
    const issueWork = await query(missionSQL.issueWork, str)
    //不使用await 返回的issueWork是promise对象，无法获取值
    if (issueWork) {
      data.status = 0;
      data.msg = "任务发布成功"
    }
  }
  responseJSON(res, data);
})
//接收任务
router.post('/accept', async (req, res) => {
  var data = {}
  var mission_id = req.body.mission_id;
  var user_id = req.body.user_id;//打工仔id
  var mission_statu = 1;
  var accepttime = moment().format("YYYY-MM-DD HH:mm:ss")
  var mstatu = '';
  var mid = '';
  var slave_name = ''
  var queryAll = await query(missionSQL.queryAllTask)
  if (queryAll) {
    for (let i = 0; i < queryAll.length; i++) {
      var curtime = moment().format("YYYY-MM-DD HH:mm:ss");
      if (queryAll[i].validtime < curtime) {
        mstatu = 3;
        mid = queryAll[i].mission_id;
      }
      await query(missionSQL.changeTaskStatus, [mstatu, mid]);
    }
  }
  var slave = await query(userSQL.getUserById, [user_id])
  var mdata = await query(missionSQL.details, [mission_id])
  if (mdata) {
    for (let i = 0; i < mdata.length; i++) {
      if (mdata[i].mission_statu === 0) {//任务状态必须为0
        if (mdata[i].master != user_id) {//雇主与打工仔不能是同一人
          for (let i = 0; i < slave.length; i++) {
            slave_name = slave[i].user_name
          }
          var str = [mission_statu, user_id, slave_name, accepttime, mission_id]
          await query(missionSQL.accept, str)
          data.status = 0;
          data.msg = "success",
            data.data = "true"
        } else {
          data.status = -200
          data.msg = "不能接取自己发布的任务"
        }
      } else if (mdata[i].mission_statu === 1) {
        data.status = -1
        data.msg = "任务进行中,不可接取"
      } else if (mdata[i].mission_statu === 2) {
        data.status = -2
        data.msg = "任务已经完成,不可接取"
      } else if (mdata[i].mission_statu === 3) {
        data.status = -3
        data.msg = "任务超时！"
      }
    }
  }
  responseJSON(res, data);
})
//完成任务
router.post('/achieve', async (req, res) => {
  var data = {}
  var flag = '';
  var mission_id = req.body.mission_id;
  var user_id = req.body.user_id;//打工仔id
  var mission_statu = 2;
  var end_time = moment().format("YYYY-MM-DD HH:mm:ss")
  var mstatu = '';
  var mid = '';
  var _master = '' //如果超时则把积分退还给雇主
  var _score = ''//任务积分
  var score = ''
  //判断是否超时
  var queryAll = await query(missionSQL.queryAllTask)
  if (queryAll) {
    for (let i = 0; i < queryAll.length; i++) {
      if (queryAll[i].validtime < end_time) {
        mstatu = 3;
        mid = queryAll[i].mission_id;
      }
      await query(missionSQL.changeTaskStatus, [mstatu, mid]);
    }
  }
  data.data = {}
  var mdata = await query(missionSQL.details, [mission_id])
  for (let i = 0; i < mdata.length; i++) {
    if (mdata[i].mission_statu == 1 && mdata[i].slave == user_id) {
      flag = 1;
    } else if (mdata[i].mission_statu == 2 && mdata[i].slave == user_id) {
      flag = 2;
    } else if (mdata[i].mission_statu == 3 && mdata[i].slave == user_id) {
      flag = 3;
    }
    if (flag == 1) {
      _score = mdata[i].score;
      //获取该任务积分--送给打工仔
      var str = [mission_statu, end_time, mission_id]
      await query(missionSQL.achieve, str)
      var slave = await query(userSQL.getUserById, [user_id])//先获取打工仔积分
      for (let i = 0; i < slave.length; i++) {
        score = slave[i].score + _score //任务确认完成打工仔获得积分
      }
      await query(userSQL.updateScoreById, [score, user_id])
      var DATA = await query(missionSQL.details, [mission_id])
      for (let i = 0; i < DATA.length; i++) {
        data.data = DATA[i];
      }
      data.status = 0;
      data.msg = "任务已完成"
    } else if (flag == 2) {
      data.status = -2;
      data.msg = "任务已完成，不能重复提交"
    } else if (flag == 3) {
      _score = mdata[i].score;
      _master = mdata[i].master;
      var query_master = await query(userSQL.getUserById, [_master])
      for (let i = 0; i < query_master.length; i++) {
        score = query_master[i].score + _score //任务超时把积分退还给雇主
      }
      await query(userSQL.updateScoreById, [score, _master])
      var DATA = await query(missionSQL.details, [mission_id])
      for (let i = 0; i < DATA.length; i++) {
        data.data = DATA[i];
      }
      data.status = -3;
      data.msg = "任务已超时，不能提交，下次加油"
    }
  }
  responseJSON(res, data);
})
//查看所有未接单任务
router.get('/unaccpetedlist', async (req, res) => {
  var msg = req.query || req.params;
  var mission_statu = msg.mission_statu;
  var mission_id = msg.mission_id;
  var data = {}
  data.data = {}
  const queryInfo = await query(missionSQL.queryAllTask)
  if (queryInfo) {
    for (let i = 0; i < queryInfo.length; i++) {
      //未接单超时任务自动更改任务状态
      var curtime = moment().format("YYYY-MM-DD HH:mm:ss");
      if (queryInfo[i].validtime < curtime) {
        mission_statu = 3;
        mission_id = queryInfo[i].mission_id;
      }
      await query(missionSQL.changeTaskStatus, [mission_statu, mission_id]);
    }
  }
  //查询所有未接单任务
  const task = await query(missionSQL.queryAllStatu);
  var unacceptTask = [];
  var isQuery = false;
  if (task) {
    isQuery = true;
    for (let i = 0; i < task.length; i++) {
      unacceptTask[i] = task[i];
    }
    //console.log(task.length)
  }
  if (isQuery == true) {
    data.data = unacceptTask;
    data.status = 0;
    data.msg = "查询未接单任务成功"
  }
  responseJSON(res, data);
})
//查看所有任务
router.get('/worklist', async (req, res) => {
  var msg = req.query || req.params;
  var mission_statu = msg.mission_statu;
  var mission_id = msg.mission_id;
  var data = {}
  data.data = {}
  var queryAll = await query(missionSQL.queryAllTask)
  if (queryAll) {
    for (let i = 0; i < queryAll.length; i++) {
      //未接单超时任务自动更改任务状态
      var curtime = moment().format("YYYY-MM-DD HH:mm:ss");
      if (queryAll[i].validtime < curtime) {
        mission_statu = 3;
        mission_id = queryAll[i].mission_id;
      }
      await query(missionSQL.changeTaskStatus, [mission_statu, mission_id]);
    }
  }
  //重新查询所有任务
  const taskall = await query(missionSQL.queryAllTask);
  var list = [];
  var isQuery = false;
  if (taskall) {
    isQuery = true;
    for (let i = 0; i < taskall.length; i++) {
      list[i] = taskall[i];
    }
  }
  if (isQuery == true) {
    data.data = list;
    data.status = 0;
    data.msg = "查询所有任务成功"
  }
  responseJSON(res, data);
})
//查看任务详情
router.post('/details', async (req, res) => {
  var mid = req.body.mission_id;
  var uid = req.body.user_id;//当前用户id 用于统计点击次数
  var data = {}
  data.data = {}
  var mission_statu = ''
  var Times = ''
  var midIsExist = false;
  /* var qDetail = await query(missionSQL.details, [mid])
  var curtime = moment().format("YYYY-MM-DD HH:mm:ss");
  if (qDetail.validtime < curtime) {
    mission_statu = 3;
    await query(missionSQL.changeTaskStatus, [mission_statu, mid]);
  } */
  var queryAll = await query(labelSQL.queryAll)
  for(let i=0;i<queryAll.length;i++){
    if(queryAll[i].user_id == uid) midIsExist = true;
  }
  var ddata = await query(missionSQL.details, [mid])
  for (let i = 0; i < ddata.length; i++) {
    Times = ddata[i].times +1;
    if(midIsExist == true){
      if(ddata[i].label == "跑腿") query(labelSQL.Shelp,[uid]) 
      if(ddata[i].label == "代取") query(labelSQL.Stake,[uid]) 
      if(ddata[i].label == "兼职") query(labelSQL.Sparttime,[uid]) 
      if(ddata[i].label == "技能") query(labelSQL.Sskill,[uid]) 
    }else{
      if(ddata[i].label == "跑腿") query(labelSQL.Fhelp,[uid]) 
      if(ddata[i].label == "代取") query(labelSQL.Ftake,[uid]) 
      if(ddata[i].label == "兼职") query(labelSQL.Fparttime,[uid]) 
      if(ddata[i].label == "技能") query(labelSQL.Fskill,[uid]) 
    }
  }
  query(missionSQL.changeTimes, [Times, mid])
  var ddatas = await query(missionSQL.details, [mid])
  for (let i = 0; i < ddatas.length; i++) {
    data.data = ddata[i];
    data.status = 0;
    data.msg = "success"
  }
  responseJSON(res, data);
})
module.exports = router;