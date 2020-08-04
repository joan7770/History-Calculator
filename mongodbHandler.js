const fs = require('fs');
const https = require('https');

const { MongoClient } = require('mongodb');
const qs = require('querystring');
const url = require('url');

const { certificate, keyfile } = require('./sslconfig');
const { username, password, clusterUrl } = require('./dbconfig');
const uri = 'mongodb+srv://' + username + ':' + password + clusterUrl +'?retryWrites=true&w=majority';

const port = 8080;
const options = {
    key: fs.readFileSync(keyfile),
    cert: fs.readFileSync(certificate)
};

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
        done.statusCode = 200;
        done.data = history;
    } catch (error) {
        console.log(error.message);
        done.statusCode = 400;
        done.data = error;
    }
}

async function postData(client, data, done) {
    try {
        await client.connect();
        const collection = await client.db().collection('calculator');
        const result = await collection.insertOne(data);

        done.statusCode = 200;
        let message = 'Atteptemed to add ' + data.expression + ' result: ' + JSON.stringify(result);
        done.message = { body: message };
    } catch (error) {
        done.statusCode = 400;
        done.data = error;
    }
}

let server = https.createServer( options, async function (request, response) {
    console.log(`Recieved ${request.method} request`);
    let done = {};

    const client = new MongoClient(uri, { useNewUrlParser: true });

    switch (request.method) {
        case 'GET':
            await getData(client, done);
            response.writeHead(done.statusCode, {
                'Content-Type': 'application/json'
            });
            response.end(JSON.stringify(done.data));
            break;
        case 'POST':
            let requestData = '';
            let resolveCallback;
            let data;

            let parseData = new Promise((resolve, reject) => {
                resolveCallback = resolve;
            }).then((result) => {
                console.log('data parsed: ' + JSON.stringify(result));
                data = {
                    expression: result.expression,
                    result: result.result
                };
            });

            request.on('data', function (data) {
                requestData += data;
            });

            request.on('end', function () {
                resolveCallback(JSON.parse(requestData));
                console.log('data parsed: ' + JSON.stringify(parseData));
            });

            await parseData;

            await postData(client, data, done);

            response.writeHead(done.statusCode, {
                'Content-Type': 'application/json'
            });
            response.end(JSON.stringify(done.data));
            break;
        default:
            done.statusCode = 400;
            done.data = 'Path requested does not exist';
            response.writeHead(done.statusCode, {
                'Content-Type': 'application/json'
            });
            response.end(done.data);
    }

    await client.close();
});

server.listen(8080);