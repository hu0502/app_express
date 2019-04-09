var MissionSQL = {
   //发布任务
   issueWork: 'INSERT INTO mission (mission_id,mission_order,description,title,label,mission_statu,location,validtime,create_time,score,master,master_name) values(null,round(round(rand(),10)*10000000000),?,?,?,0,?,?,?,?,?,?)',
   //查询任务列表
   queryAllTask:'SELECT * FROM mission',
   //任务超时则更改任务状态
   changeTaskStatus:'UPDATE mission set mission_statu=? WHERE mission_id=?',
   //查询所有mission_statu = 0的（未接单）任务
   queryAllStatu :'SELECT * FROM mission WHERE mission_statu = 0',
   //查看任务详情
   details:'SELECT * FROM mission WHERE mission_id =?',
   //接收任务
   accept:'UPDATE mission set mission_statu=?,slave=?,slave_name=?,accepttime=? WHERE mission_id=?',
   //完成任务
   achieve:'UPDATE mission set mission_statu=?,end_time=? WHERE mission_id=?',
   //如果任务超时未确认完成，把接收时间作为end_time
   //如果任务超时未被接单，把创建任务时间作为end_time 和 accept_time

};
module.exports = MissionSQL;