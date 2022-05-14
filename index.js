const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

// middleware
app.use(cors());
app.use(express.json());


const uri = "mongodb+srv://doctorsuser:<password>@cluster0.4g4hk.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
client.connect(err => {
    const serviceCollection = client.db("doctors").collection("services");
    // perform actions on the collection object
    console.log('database connected');
    client.close();
});


app.get('/', (req, res) => {
    res.send('Hello from doctors');
})

app.listen(port, () => {
    console.log('listening from on port', port)
})