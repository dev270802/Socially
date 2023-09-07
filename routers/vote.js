const express=require('express')
const pool=require('../db')
const {verify,authorizeUser}=require('../util')
const router=express.Router()


router.use(express.json({extended:true}))


router.get('/:id',async(req,res)=>{
    const post_id=Number(req.params.id)
    if(Object.is(post_id,NaN)){
        return res.status(401).json({"message":`Please provide id in Number ${req.params.id}`})
    }
    const validPost=await pool.query('SELECT * FROM posts WHERE id=$1',[post_id])
    if(validPost.rows.length===0){
        return res.status(404).json({'MESSAGE':`POST ${post_id} does not exist`})
    }
    const total_votes=await pool.query('SELECT COUNT(user_id) as total_votes FROM votes WHERE post_id=$1',[post_id])
    return res.status(202).json({'MESSAGE':`POST ${post_id} has ${total_votes.rows[0].total_votes}`})
})

router.put('/',verify,async(req,res)=>{
    const email=req.user.user_id
    const post_id=req.body.post_id
    const id_query=await pool.query('SELECT id FROM users where email=$1',[email])
    const id=id_query.rows[0].id
    const validPost=await pool.query('SELECT * FROM posts WHERE id=$1',[post_id])
    if(validPost.rows.length===0){
        return res.status(404).json({'MESSAGE':`POST ${post_id} does not exist`})
    }
    const contains=await pool.query('SELECT * FROM votes WHERE user_id=$1 AND post_id=$2',[id,post_id])
    if(contains.rows.length===0){
        const like=await pool.query('INSERT INTO votes(user_id,post_id) VALUES($1,$2)',[id,post_id])
        return res.status(201).json({'MESSAGE':`LIKED POST ${post_id} SUCCESSFULLY`})
    }
    else{
        const unlike=await pool.query('DELETE FROM votes WHERE user_id=$1 AND post_id=$2',[id,post_id])
        res.status(204).json({'MESSAGE':`REMOVE LIKE FROM POST ${post_id} SUCCESSFULLY`})
    }
})


module.exports=router