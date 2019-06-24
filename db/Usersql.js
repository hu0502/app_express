var UserSQL = {
    queryAll: 'SELECT * FROM user', // 用户登录：查找用户表中所有数据
    getUserById: 'SELECT * FROM user WHERE user_id = ?', //根据user_id查看个人信息
    updateScoreById: 'UPDATE user set score=? WHERE user_id = ?', //根据user_id更新用户积分
    enroll:'INSERT INTO user VALUES(null,?,md5(?),?,?,now(),1000,null,null,null,?)',//用户注册
    update:'UPDATE user set password=md5(?),department=?,u_class=?,sex=? WHERE user_id = ?',//更新个人信息
   
};
module.exports = UserSQL;