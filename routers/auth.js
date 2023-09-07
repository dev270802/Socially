const express=require('express')
const pool=require('../db')
const Ajv=require('ajv')
const { userSchema } = require('../schema')
const {compare} = require('../util')
const ajv=new Ajv()
const jwt=require('jsonwebtoken')
const config=require('../config')

const router=express.Router()
router.use(express.json({extended:true}))

const validateUsers=ajv.compile(userSchema)

router.post('/',async (req,res)=>{
    const formData=req.body
    const valid=validateUsers(formData)

    if(valid){
        const user=await pool.query('SELECT email,password FROM users WHERE email=$1 LIMIT 1',[formData.email])
        if(user.rows.length===0){
            return res.status(404).json({"Mesaage":"Invalid Credentials"})
        }
        const data=await user.rows
        const result=await compare(formData.password,data[0].password)
       if(!result){
        return res.status(404).json({"Mesaage":"Invalid Credentials"})
       }
        //create token
        const token=jwt.sign(
            {user_id:formData.email},
            config.secretKey,
            {
                expiresIn:"1h",
            }
        )

        return res.json({"auth_token":token})

    }
    else{
        const errors = validateUsers.errors.map(error => error.message);
        return res.status(400).json({ errors });
    }


})
module.exports=router