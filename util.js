const bcrypt=require('bcrypt')
const jwt=require('jsonwebtoken')
const pool =require('./db')
const config=require('./config')

const hashedPassword=async (password) => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
}
const compare= async(plainTextPassword, hashedPassword)=> {
      const result = await bcrypt.compare(plainTextPassword, hashedPassword);
      return result;
  }

  const verify=async(req,res,next)=>{
    const token=req.header("Authorization")
    if(!token){
        return res.status(401).json({"message":"Access denied"})
    }
    try {
        const verified=jwt.verify(token,config.secretKey)
        req.user=verified
        console.log(req.user)
        next()
    } catch(error){
        res.status(400).send("Invalid Token")
    }
  }
  const authorizeUser=async(email,id)=>{
    const user_id_query=await pool.query('SELECT id FROM users WHERE email=$1',[email])
    const user_id=await user_id_query.rows[0].id
    //from the post_id get the owner id
    const post_owner_query=await pool.query('SELECT user_id FROM posts WHERE id=$1',[id])
    if(post_owner_query.rows.length===0){
        return 0
    }
    const post_owner_id=post_owner_query.rows[0].user_id
    if(user_id!=post_owner_id){
        return -1
    }
    return 1
  }

module.exports={hashedPassword,compare,verify,authorizeUser}