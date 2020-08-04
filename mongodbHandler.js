const { MongoClient } = require('mongodb');
const { username, password, clusterUrl } = require('../dbconfig');
const uri = 'mongodb+srv://' + username + ':' + password + clusterUrl +'?retryWrites=true&w=majority';


async function getData(client, done){
    try {
        await client.connect();
        const collection = await client.db().collection('calculator');
        let options = {
            sort: { '_id': -1 },
            limit: 10
        };
        const cursor = await collection.find({}, options);
        if (await cursor.count() === 0) {
            console.log("No documents found!");
        }
        let documents = await cursor.toArray();
        let history = [];
        for (const data of documents) {
            history.push({
                expression: data.expression,
                result: data.result
            });
        }
        done(null, history);
    } catch (error) {
        console.log(error.message);
        done({ message: error.message }, null);
    }
}

async function postData(client, data, done) {
    try {
        await client.connect();
        const collection = await client.db().collection('calculator');
        const result = await collection.insertOne(data);

        let message = 'Atteptemed to add ' + data.expression + ' result: ' + JSON.stringify(result);
        done(null, {body: message});
    } catch (error) {
        console.log(error.message);
        done({ message: error.message }, null);
    }
}

exports.mongodbHandler = async (event, context, callback) => {
    console.log(`Recieved ${event.httpMethod} request`);
    const done = (err, res) => callback(null, {
        statusCode: err ? '400' : '200',
        body: err ? err.message : JSON.stringify(res),
        headers: {
            'Content-Type': 'application/json'
        }
    });

    const client = new MongoClient(uri, { useNewUrlParser: true });
    

    switch (event.httpMethod) {
        case 'GET':
            await getData(client,done);
            break;
        case 'POST':
            let body = await JSON.parse(event.body);
            let data = {
                expression: body.expression,
                result: body.result
            };
            console.log('JSON body: ' + event.body);
            await postData(client, data, done);
            break;
        default:
            done(new Error(`Unsupported method "${event.httpMethod}"`));
    }

    await client.close();
};