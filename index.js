const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
require('dotenv').config();
//middleware
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
	res.send('Doctor Is Running');
});

const uri = `mongodb+srv://${process.env.USER}:${process.env.PASS}@cluster0.xozjpaf.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
	serverApi: {
		version: ServerApiVersion.v1,
		strict: true,
		deprecationErrors: true,
	},
});

async function run() {
	try {
		// Connect the client to the server	(optional starting in v4.7)
		await client.connect();
		const database = client.db('carsDoctor');
		const services = database.collection('services');
		const bookingCollection = database.collection('bookings');

		//i am taking data from database and making them available in this url
		app.get('/services', async (req, res) => {
			const cursor = services.find();
			const result = await cursor.toArray();
			res.send(result);
		});
		// specific data
		app.get('/checkout/:id', async (req, res) => {
			const id = req.params.id;
			const query = { _id: new ObjectId(id) };
			// options is query
			const options = {
				projection: { title: 1, price: 1, service_id: 1 },
			};
			const result = await services.findOne(query, options);
			res.send(result);
		});
		//booking er info server a send kortesi
		app.post('/bookings', async (req, res) => {
			const booking = req.body;
			const result = await bookingCollection.insertOne(booking);
			res.send(result);
		});

		// some data
		app.get('/bookings', async (req, res) => {
			const query = {};
			if (req.query?.email) {
				query = { email: req.query.email };
			}
			const result = await bookingCollection.find().toArray();
			res.send(result);
		});
		// Send a ping to confirm a successful connection
		await client.db('admin').command({ ping: 1 });
		console.log('Pinged your deployment. You successfully connected to MongoDB!');
	} finally {
		// Ensures that the client will close when you finish/error
		// await client.close();
	}
}
run().catch(console.dir);

app.listen(port, () => {
	console.log(` car Doctor Server is running on port ${port} `);
});
