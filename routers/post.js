const express=require('express')
const Ajv=require('ajv')
const ajv=new Ajv()
const pool=require('../db')
const {postSchema}=require('../schema')
const {verify,authorizeUser}=require('../util')
const router=express.Router()

const validatePost=ajv.compile(postSchema)

router.use(express.json({extended:true}))

router.get('/',async (req,res)=>{
    let limit = parseInt(req.query.limit || 5);
    let page = parseInt(req.query.pagina || 1);
    let offset = (page-1) * limit
    let search=req.query.search
    if(search){
        const post=await pool.query('SELECT * FROM posts WHERE title ILIKE $3 LIMIT $1 OFFSET $2',[limit,offset,search])
        return res.json(await post.rows)
    }
    else{
        const post=await pool.query('SELECT posts.title,posts.content,posts.id,COUNT(votes.user_id) FROM posts LEFT OUTER JOIN votes ON posts.id=votes.post_id GROUP by posts.id LIMIT $1 OFFSET $2',[limit,offset])
        return res.json(await post.rows)
    }
    
    
})

router.get('/:id',verify,async (req,res)=>{
    const id=Number(req.params.id)
    const user_email=req.user.user_id
    //console.log(id)
    if(Object.is(id,NaN)){
        return res.status(401).json({"message":`Please provide id in Number ${req.params.id}`})
    }
    const code=await authorizeUser(user_email,id)
    if(code===0){
        return res.status(404).json({"message":`No post with id of ${req.params.id}`})
    }
    if(code==-1){
        return res.status(403).json({"Message":"Cannot get other user's post"})
    }
    const post=await pool.query('SELECT posts.title,posts.content,posts.id,COUNT(votes.user_id) FROM posts LEFT OUTER JOIN votes ON posts.id=votes.post_id WHERE posts.id=$1 GROUP by posts.id',[id])
    const response=await post.rows
    res.json({"message":`Get post with id of ${req.params.id}`,"response":response})
})

router.post('/',verify,async (req,res)=>{
    const formData = req.body; // Parsed form data
    const user_email=req.user.user_id;
    console.log(user_email)
    const valid=validatePost(formData)
    if(valid){
        if(formData.publish===undefined){
            formData.publish=postSchema.properties.publish.default
        }
        const user_id_query=await pool.query('SELECT id FROM users WHERE email=$1',[user_email])
        const user_id=await user_id_query.rows[0].id
        const post=await pool.query('INSERT INTO posts(title,content,published,user_id) VALUES ($1,$2,$3,$4) RETURNING *',[formData.title,formData.content,formData.publish,user_id])
        res.status(201).json({"message":"Created New Post","data":post.rows})
    }
    else{
        const errors = validatePost.errors.map(error => error.message);
        return res.status(400).json({ errors });
    }
    
})

router.delete('/:id',verify,async (req,res)=>{
    const id=Number(req.params.id)
    //get user gmail who have signed in
    const user_email=req.user.user_id;
    if(Object.is(id,NaN)){
        return res.status(401).json({"message":`Please provide id in Number ${req.params.id}`})
    }
    const code=await authorizeUser(user_email,id)
    if(code===0){
        return res.status(404).json({"message":`No post with id of ${req.params.id}`})
    }
    if(code==-1){
        return res.status(403).json({"Message":"Cannot delete other user's post"})
    }
    const post=await pool.query('DELETE FROM posts WHERE id=$1 RETURNING *',[id])
    
    return res.sendStatus(204)
})

router.put('/:id',verify,async (req,res)=>{
    const id=Number(req.params.id)
    const user_email=req.user.user_id;
    const body=req.body
    if(Object.is(id,NaN)){
        return res.status(401).json({"message":`Please provide id in Number ${req.params.id}`})
    }
    const valid=validatePost(req.body)
    if(valid){
        if(body.publish===undefined){
            body.publish=postSchema.properties.publish.default
        }
        const code=await authorizeUser(user_email,id)
        if(code===0){
            return res.status(404).json({"message":`No post with id of ${req.params.id}`})
        }
        if(code===-1){
            return res.status(403).json({"Message":"Cannot update other user's post"})
        }
        const post=await pool.query('UPDATE posts SET title=$1,content=$2,published=$3 WHERE id=$4 RETURNING *',[body.title,body.content,body.publish,id])
        res.status(200).json({"message":`Post updated successfull of id ${req.params.id}`,post})
    }
    else{
        const errors = validatePost.errors.map(error => error.message);
        return res.status(400).json({ errors });
    }
})

module.exports=router