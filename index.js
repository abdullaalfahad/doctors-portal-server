const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const jwt = require('jsonwebtoken');

// middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4g4hk.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.send(401).send({ message: 'Unauthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' });
        }
        req.decoded = decoded;
        next();
    });
}

async function run() {
    try {
        await client.connect();
        const serviceCollection = client.db('doctors').collection('services');
        const bookingCollection = client.db('doctors').collection('booking');
        const userCollection = client.db('doctors').collection('users');


        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res.send({ result, token });
        })

        app.get('/users', verifyJWT, async (req, res) => {
            const users = await userCollection.find().toArray();
            res.send(users);
        })

        app.get('/services', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const user = await cursor.toArray();
            res.send(user);
        })

        app.get('/available', async (req, res) => {
            const date = req.query.date || 'May 17, 2022';

            // get all services
            const services = await serviceCollection.find().toArray();

            // get all booking of that day
            const query = { date: date };
            const bookings = await bookingCollection.find(query).toArray();

            // for each service
            services.forEach(service => {
                //find booking for that service
                const serviceBookings = bookings.filter(book => book.treatment === service.name);

                // select slots for service booking
                const bookedSlots = serviceBookings.map(book => book.slot);

                // select those slots that are not bookedSlots
                const available = service.slots.filter(slot => !bookedSlots.includes(slot));
                service.slots = available;
            })

            res.send(services);
        })

        app.get('/booking', verifyJWT, async (req, res) => {
            const patient = req.query.patientEmail;
            const decodedEmail = req.decoded.email;
            console.log(decodedEmail);
            if (patient === decodedEmail) {
                const query = { patientEmail: patient };
                const booking = await bookingCollection.find(query).toArray();
                return res.send(booking);
            }
            else {
                return res.status(403).send({ message: 'Forbidden access' });
            }
        })

        app.post('/booking', async (req, res) => {
            const booking = req.body;
            const query = { treatment: booking.treatment, date: booking.date, patientName: booking.patientName };
            const exists = await bookingCollection.findOne(query);
            if (exists) {
                return res.send({ success: false, booking: exists });
            }
            const result = await bookingCollection.insertOne(booking);
            return res.send({ success: true, result });
        })
    }
    finally {

    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Hello from doctors');
})

app.listen(port, () => {
    console.log('listening from on port', port)
})