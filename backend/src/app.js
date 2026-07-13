import express from 'express'
import cookieParser from 'cookie-parser'

const app = express()

app.use(express.json())
app.use(cookieParser())
app.use(express.urlencoded({ extended: true }))

app.get("/",(req,res)=>{
  res.json({message:"server is running"});
})

// app.use("api/auth",authRouter)

export default app