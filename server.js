const express=require('express')
const pool=require('./db')
const post=require('./routers/post')
const user=require('./routers/user')
const login=require('./routers/auth')
const vote=require('./routers/vote')
const config=require('./config')
const cors=require('cors')
const app=express()

app.use(cors())


pool.query('SELECT NOW()', (err, result) => {
  if (err) {
    console.error('Error connecting to PostgreSQL:', err);
  } else {
    console.log('Connected to PostgreSQL at:', result.rows[0].now);
  }
});

app.use('/users',user)
app.use('/posts',post)
app.use('/login',login)
app.use('/vote',vote)

app.listen(config.port)