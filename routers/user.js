const express=require('express')
const Ajv=require('ajv')
const ajv=new Ajv()
const {hashedPassword}=require('../util')
const {userSchema}=require('../schema')
const validator = require("validator")
const pool=require('../db')
const validateUsers=ajv.compile(userSchema)

const router=express.Router()

router.use(express.json({extended:true}))
router.post('/',async(req,res)=>{
    const formData=req.body
    const valid=validateUsers(formData)

    formData.password=await hashedPassword(formData.password)
    if (!validator.isEmail(formData.email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    if(valid){
        const post=await pool.query('INSERT INTO users(email,password) VALUES($1,$2) RETURNING email,id',[formData.email,formData.password])
        res.status(201).json(await post.rows)
    }
    else{
        const errors = validatePost.errors.map(error => error.message);
        return res.status(400).json({ errors });
    }
})

router.get('/:id',async (req,res)=>{
    const id=Number(req.params.id)
    if(Object.is(id,NaN)){
        return res.status(401).json({"message":`Please provide id in Number ${req.params.id}`})
    }
    const user=await pool.query('SELECT email FROM users WHERE id=$1 LIMIT 1',[id])
    if(user.rows.length===0){
       return res.status(404).json({"message":`No post with id of ${req.params.id}`})
    }
    res.json({"message":`Get post with id of ${req.params.id}`,"response":user.rows})

})

module.exports=router