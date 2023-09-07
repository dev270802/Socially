const dotenv=require('dotenv')
dotenv.config()
module.exports={
    //DB CONFIG
user:process.env.DB_USER,
host:process.env.HOST,
db:process.env.DATABASE,
password:process.env.PASSWORD,
// Hashing
secretKey:process.env.SECRET_KEY,
//PORT_NUM
port:process.env.PORT
}