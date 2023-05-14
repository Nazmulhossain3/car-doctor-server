const express = require('express');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express()
const cors = require('cors');
const port = process.env.PORT || 5000

// middleware
app.use(cors())
app.use(express.json())


var uri = `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@ac-onjpk5k-shard-00-00.xskcn3u.mongodb.net:27017,ac-onjpk5k-shard-00-01.xskcn3u.mongodb.net:27017,ac-onjpk5k-shard-00-02.xskcn3u.mongodb.net:27017/?ssl=true&replicaSet=atlas-g07jbs-shard-0&authSource=admin&retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


const verifyJWT = (req,res,next)=> {
    console.log('hitting verify jwt')
       console.log(req.headers.authorization)
     const authorization = req.headers.authorization
     if(!authorization){
      return res.status(401).send({error : true , message : 'unauthorize access'})
     }
     const token = authorization.split(' ')[1];
     console.log('token inside verify jwt', token)
     jwt.verify(token,process.env.ACCESS_TOKEN, (error,decoded)=>{
        if(error){
            return res.status(403).send({error : true , message : 'unauthorize access'})

        }
        req.decoded = decoded
        next()
     })
}



async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();


    const serviceCollection = client.db('carDoctor').collection('services')
    const bookingCollection = client.db('carDoctor').collection('booking')

    // jwt

    app.post('/jwt', (req,res)=> {
        const user = req.body 
        const token = jwt.sign(user,process.env.ACCESS_TOKEN, {
            expiresIn: '1h'
        });
        res.send({token})
    })
    
    
    // routes
    
    app.get('/services', async(req,res)=>{
        const cursor = serviceCollection.find()
        const result = await cursor.toArray()
        res.send(result)
    })

    app.get('/services/:id', async(req,res)=>{
        const id = req.params.id 
        console.log(id)
        const query = {_id : new ObjectId(id)}

        const options = {
           
            projection: {  title: 1, title : 1, price : 1, service_id : 1, img:1 },
          };
      


        const result = await serviceCollection.findOne(query,options)
        res.send(result)
    })

    app.get('/booking',verifyJWT, async(req,res)=>{
     const decoded = req.decoded 
     console.log('come back after long time', decoded)

     if(decoded.email !== req.query.email){
        return res.status(403).send({error : true , message : 'forbidden access'})

     }

        // console.log(req.headers.authorization)
        let query = {}
        if(req.query?.email){
            query = { email : req.query?.email}
        }

        const result = await bookingCollection.find(query).toArray()
        res.send(result)
    })


    app.post('/bookings', async(req,res)=>{
        const bookings = req.body
        console.log(bookings)
        const result = await bookingCollection.insertOne(bookings)
        res.send(result)
    })

    app.delete('/booking/:id', async(req,res)=> {
        const id = req.params.id 
        const query = {_id : new ObjectId(id)}
        const result = await bookingCollection.deleteOne(query)
        res.send(result)
    })

    app.patch('/booking/:id', async(req,res)=> {
        const id = req.params.id 
        const filter = {_id : new ObjectId(id)}
        const updatedBooking = req.body
        console.log(updatedBooking)

        const updateDoc = {
            $set: {
              status: updatedBooking.status
            },
          };

          const result = await bookingCollection.updateOne(filter,updateDoc)
          res.send(result)
    })



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req,res)=> {
    res.send('doctor server is running')
})

app.listen(port, ()=>{
     console.log(`doctor server is running on port : ${port} `)
})