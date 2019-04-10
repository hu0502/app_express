var LabelSQL = {
    //查询用户是否存在
    queryAll : 'SELECT * FROM label',
    //跑腿：help 代取：take 兼职：parttime 技能：skill
    //首次增加用户F
    Fhelp : 'INSERT INTO label(label_id,user_id,help) VALUES(null,?,help+1)',
    Ftake : 'INSERT INTO label(label_id,user_id,take) VALUES(null,?,take+1)',
    Fparttime : 'INSERT INTO label(label_id,user_id,parttime) VALUES(null,?,parttime+1)',
    Fskill : 'INSERT INTO label(label_id,user_id,skill) VALUES(null,?,skill+1)',
   //用户已存在
    Shelp : 'UPDATE label set help=help+1 WHERE user_id = ?',
    Stake : 'UPDATE label set take=take+1 WHERE user_id = ?',
    Sparttime : 'UPDATE label set parttime=parttime+1 WHERE user_id = ?',
    Sskill : 'UPDATE label set skill=skill+1 WHERE user_id = ?',
};
module.exports = LabelSQL;