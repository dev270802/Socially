const postSchema={
    type:"object",
    properties:{
        title:{type:'string'},
        content:{type:'string'},
        publish:{type:'boolean',default:'true'}
    },
    required:['title','content']
}

const userSchema={
    type:"object",
    properties:{
        email:{
            type:'string',
        },
        password:{type:'string'}
    },
    required:['email','password']
}


module.exports={postSchema,userSchema};