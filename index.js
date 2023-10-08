const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const jwt = require('jsonwebtoken');
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
const verifyJWT = (req, res, next) => {
	const authorization = req.headers.authorization;
	if (!authorization) {
		return res.status(401).send({ error: true, message: 'unauthorized access' });
	}
	const token = authorization.split(' ')[1];
	jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
		if (err) {
			return res.status(402).send({ error: true, message: 'unauthorized access' });
		}
		//req a amra ekta property boshacchi as value decoded(parameter)
		req.decoded = decoded;
		console.log(decoded);
		next();
	});
};
async function run() {
	try {
		// Connect the client to the server	(optional starting in v4.7)
		await client.connect();
		const database = client.db('carsDoctor');
		const serviceCollection = database.collection('services');
		const bookingCollection = database.collection('bookings');
		//jwt-login er por ai khane hit korbe
		app.post('/jwt', (req, res) => {
			const user = req.body;
			const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
			res.send({ token });
		});

		//i am taking data from database and making them available in this url
		app.get('/services', async (req, res) => {
			const cursor = serviceCollection.find();
			const result = await cursor.toArray();
			res.send(result);
		});
		// specific data
		app.get('/checkout/:id', async (req, res) => {
			const id = req.params.id;
			const query = { _id: new ObjectId(id) };
			// options is query
			const options = {
				projection: { title: 1, price: 1, service_id: 1, img: 1 },
			};
			const result = await serviceCollection.findOne(query, options);
			res.send(result);
		});
		// bookings
		app.get('/bookings', verifyJWT, async (req, res) => {
			//jwt token ta pacchi
			// console.log(req.headers);
			const decoded = req.decoded;
			console.log(decoded);
			if (decoded.email !== req.query.email) {
				return res.status(403).send({ error: 1, message: 'forbidden access' });
			}
			let query = {};
			if (req.query?.email) {
				query = { email: req.query.email };
			}
			const result = await bookingCollection.find(query).toArray();
			res.send(result);
		});

		//booking er info server a send kortesi
		app.post('/bookings', async (req, res) => {
			const booking = req.body;
			const result = await bookingCollection.insertOne(booking);
			res.send(result);
		});

		app.patch('/bookings/:id', async (req, res) => {
			const id = req.params.id;
			const filter = { _id: new ObjectId(id) };
			const updatedBooking = req.body;
			console.log(updatedBooking);
			const updateDoc = {
				$set: {
					status: updatedBooking.status,
				},
			};
			const result = await bookingCollection.updateOne(filter, updateDoc);
			res.send(result);
		});

		app.delete('/bookings/:id', async (req, res) => {
			const id = req.params.id;
			const query = { _id: new ObjectId(id) };
			const result = await bookingCollection.deleteOne(query);
		});

		// some data
		app.get('/bookings', async (req, res) => {
			console.log(req.headers);
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
