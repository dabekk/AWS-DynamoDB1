var aws = require('aws-sdk');
var s3 = require('aws-sdk/clients/s3');
const express = require('express')
const app = express()
const port = 3000
app.use(express.static('static'))
var AWS = require("aws-sdk");

    AWS.config.update({
        region: "eu-west-1",
        accessKeyId: "AKIAV7LDPSZRBZNPSBPF",
        secretAccessKey: "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"
    });

app.get('/instructions/:type/:title/:year', handleRequest)

function handleRequest(req, res) {

    var response = {"alert" : "Type Not Recognised"}
    let type = req.params.type;
    let title = req.params.title;
    let year = req.params.year;

    console.log("Database Instruction:", type)

    if(type == "create"){
        createDB();
        response = {"alert" : "Recieved Create Type"};
        res.json(response);
    }
    else if(type == "query"){
        let jsonArr = queryDB(title, year, res);
        response = {"alert" : "Recieved Query Type"}
        //res.json(JSON.stringify(jsonArr));
        console.log(jsonArr)
        res.send(jsonArr)
        //console.log(JSON.stringify(jsonArr))
        // console.log(jsonArr)
        // res.send(jsonArr);
    }
    else if(type == "delete"){
        deleteDB();
        response = {"alert" : "Recieved Delete Type"}
        res.json(response);
    }
    else{
        res.json(response);
    }
}

var docClient = new aws.DynamoDB.DocumentClient();
var dynamodb = new aws.DynamoDB();
var s3 = new aws.S3();

function createDB() {
    var params = {
        TableName: "Movies",
        KeySchema: [
            { AttributeName: "year", KeyType: "HASH" },  //Partition key
            { AttributeName: "title", KeyType: "RANGE" }  //Sort key
        ],
        AttributeDefinitions: [
            { AttributeName: "year", AttributeType: "N" },
            { AttributeName: "title", AttributeType: "S" }
        ],
        BillingMode: "PAY_PER_REQUEST"
    };

    dynamodb.createTable(params, function (err, data) {
        if (err) {
            console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
        }
    });

    var getParams = {
        Bucket: 'csu44000assignment2',
        Key: 'moviedata.json'
    }
    //get data from s3 bucket

    s3.getObject(getParams, function (err, data) {

        if (err) {
            console.log(err);
        } else {
            console.log("Got the data from bucket");
            fillTable(JSON.parse(data.Body));
        }
    })

    //fill table with data
    function fillTable(moviedata){
        console.log("Filling movies");
        moviedata.forEach(function(movie) {
            var params = {
                TableName: "Movies",
                Item: {
                    "year":  movie.year,
                    "title": movie.title,
                    "info":  movie.info
                }
            };
            docClient.put(params, function(err, data) {
                if (err) {
                    console.error("Cannot add Movie - ", movie.title);
                } else {
                    console.log("Successfully Added Movie - ", movie.title);
                }
            });
        });
        console.log("Finshed Loading database");
    }
}

function queryDB(title, year, res){
    console.log(title)
    console.log(year)
    
    console.log("Querying for movies from 1985.");
    let qyear = parseInt(year);
    let qtitle = title.replace(/%20/g, ' ');
    var params = {
        TableName: "Movies",
        KeyConditionExpression: "#yr = :yyyy and begins_with(title, :mt)",
        ExpressionAttributeNames: {
            "#yr": "year"
        },
        ExpressionAttributeValues: {
            ":yyyy": qyear,
            ":mt" : qtitle
        }
    };
    let jsonArr = []
    docClient.query(params, function (err, data) {
        tempJSON = []
        if (err) {
            console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
        } else {
            console.log("Query succeeded.");
            data.Items.forEach(function (item) {
                tempJSON.push({
                    title: item.title,
                    year: item.year
                })
                console.log("----------" +
                            "\nTitle - ", item.title +
                            "\nYear -  " + item.year + 
                            "\nRating - " + item.info.rating +
                            "\n----------");
            });
            return tempJSON
        }
        
    });
    function appendJSON(tempTitle, tempYear) {
        jsonArr.push({
            title: tempTitle,
            year: tempYear
        });
        console.log(tempTitle + " adding to JSON")
    }
    console.log("done");
    return jsonArr;
}

function deleteDB(req, res) {
    var params = {
        TableName : "Movies"
    };

    dynamodb.deleteTable(params, function(err, data) {
        if (err) {
            console.error("Unable to delete table. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log("Deleted table. Table description JSON:", JSON.stringify(data, null, 2));
        }
    });
}

// //creates Database
// app.get('/data/create', function (req, res) {

//     var AWS = require("aws-sdk");

//     AWS.config.update({
//         region: "eu-west-1",
//         //endpoint: "http://localhost:8000",
//         // when finished remove this endpoint

//         accessKeyId: "AKIAV7LDPSZRBZNPSBPF",
//         secretAccessKey: "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"
//     });

//     var dynamodb = new AWS.DynamoDB();

//     var params = {
//         TableName: "Movies",
//         KeySchema: [
//             { AttributeName: "year", KeyType: "HASH" },  //Partition key
//             { AttributeName: "title", KeyType: "RANGE" }  //Sort key
//         ],
//         AttributeDefinitions: [
//             { AttributeName: "year", AttributeType: "N" },
//             { AttributeName: "title", AttributeType: "S" }
//         ],
//         BillingMode: "PAY_PER_REQUEST"
//     };

//     dynamodb.createTable(params, function (err, data) {
//         if (err) {
//             console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
//         } else {
//             console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
//         }
//     });

    //get json from S3 bucket
    // const s3 = new AWS.S3();
    // const response = await
    
    //populate created database
    // var docClient = new AWS.DynamoDB.DocumentClient();

    // console.log("Importing movies into DynamoDB. Please wait.");

    // var allMovies = JSON.parse(fs.readFileSync('moviedata.json', 'utf8'));
    // allMovies.forEach(function (movie) {
    //     var params = {
    //         TableName: "Movies",
    //         Item: {
    //             "year": movie.year,
    //             "title": movie.title,
    //             "info": movie.info
    //         }
    //     };

    //     docClient.put(params, function (err, data) {
    //         if (err) {
    //             console.error("Unable to add movie", movie.title, ". Error JSON:", JSON.stringify(err, null, 2));
    //         } else {
    //             console.log("PutItem succeeded:", movie.title);
    //         }
    //     });
    // });
//     res.send({
//         'data': 'created table'
//     })
// })

// app.get('/data/query/:title/:year', function(req, res) {
//     var AWS = require("aws-sdk");

//     AWS.config.update({
//         region: "eu-west-1",
//         //endpoint: "http://localhost:8000",
//         // when finished remove this endpoint

//         accessKeyId: "AKIAV7LDPSZRBZNPSBPF",
//         secretAccessKey: "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"
//     });
//     let title = req.params.title;
//     res.send({
//         'data': title
//     })
// })

// app.get('/data/delete', function (req, res) {

//     var AWS = require("aws-sdk");

//     AWS.config.update({
//         region: "eu-west-1",
//         //endpoint: "http://localhost:8000",
//         // when finished remove this endpoint

//         accessKeyId: "AKIAV7LDPSZRBZNPSBPF",
//         secretAccessKey: "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"
//     });

//     var dynamodb = new AWS.DynamoDB();
//     var params = {
//         TableName: "Movies"
//     };

//     dynamodb.deleteTable(params, function (err, data) {
//         if (err) {
//             console.error("Unable to delete table. Error JSON:", JSON.stringify(err, null, 2));
//         } else {
//             console.log("Deleted table. Table description JSON:", JSON.stringify(data, null, 2));
//         }
//     });
//     res.send({
//         'data': 'deleted table'
//     })
//})


app.listen(port, () => console.log(`Movie Database app listening on port ${port}!`))