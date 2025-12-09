var http = require('http');
var urlObj = require('url');
var qs = require('querystring');
var fs = require('fs');

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://mydbuser:nodestuff@cluster0.ug16ebv.mongodb.net/?appName=Cluster0";
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// createServer function for Node.js
http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/html'});
  
  path = urlObj.parse(req.url).pathname;
  console.log("The path is: " + path)

  //create view for Home / default path
  if (path == '/')
  {
    res.write ("<h1 style='margin-left: 50px; margin-top: 50px'>Home</h1>");
    res.write ("<div style='font-size: 24px; margin-left: 50px; margin-top: 10px'>Please enter a Zip Code (#####) or a City: ");

    // read in html.txt file with html for form and write to page
    filehtml = "html.txt";
    fs.readFile(filehtml, function(err, html){
        res.write(html);

        res.end();
    });
  }

  //create view for process
  else if (path == '/process')
  {
    //get data from post on form submit
    var myFormData = '';
    req.on('data', newData => { myFormData += newData.toString();  });
    //async function for handling data from MongoDB call
    req.on('end', async () =>
    {
        location = qs.parse(myFormData).location;
        //regex to check for characters
        const regex = /^[a-zA-Z]+$/; 

        let result;
        
        res.write("<div id='processWrapper' style='font-size: 24px; margin-left: 50px'>");
        //if entered location starts with a letter, handle city input
        if(regex.test(location[0])){
            console.log("City was provided");
            //create query that submits provided city and allows for find without case sensitivity
            const query = {city: {$regex: "^" + location + "$", $options: "i" }};
            //pass query to function that handles db calls
            result = await run(query);
            //handle results of invalid input
            if(result.length == 0){
                console.log("The city provided, " + location + ", does not exist in the database.");
                res.write("<div style='margin-top: 50px'>The city provided, " + location + ", does not exist in the database.</div>");
            //handle results of valid input
            }else{
                console.log("The City provided is: " + result[0].city);
                console.log("the City " + result[0].city  + " has the following Zip Code(s): " + result[0].zips.toString().replaceAll(",", ", "));
                res.write("<div style='margin-top: 50px'>The City provided is: " + result[0].city + "</div>");
                res.write("<div style='margin-top: 10px'>The City " + result[0].city + " has the following zip code(s): " + result[0].zips.toString().replaceAll(",", ", ") + "</div>");
            }
        //if entered location does not start with a letter, handle city input
        }else{
            console.log("zip was provided");
            //create query that submits provided zipcode
            const query = {zips: location};
            //pass query to function that handles db calls
            result = await run(query);
            console.log(result);
            //handle results of invalid input
            if(result.length == 0){
                console.log("The Zip Code provided, " + location + ", does not exist in the database.");
                res.write("<div style='margin-top: 50px'>The Zip Code provided, " + location + ", does not exist in the database.</div>");
            //handle results of valid input
            }else{
                console.log("The Zip Code provided is " + location);
                console.log("The Zip Code belongs to: " + result[0].city);
                console.log("the City " + result[0].city + " has the following zip code(s): " + result[0].zips.toString().replaceAll(",", ", "));
                res.write("<div style='margin-top: 50px'>The Zip Code provided is: " + location + "</div>");
                res.write("<div style='margin-top: 10px'>The Zip Code belongs to: " + result[0].city + "</div>");
                res.write("<div style='margin-top: 10px'>The City " + result[0].city + " has the following zip code(s): " + result[0].zips.toString().replaceAll(",", ", ") + "</div>");
            }
        }
        res.write("</div>");
        res.end();
    });
  }
}).listen(process.env.PORT);

//function to create connection to database NodeJS and collection places
async function run(query) {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        const database = client.db("NodeJS");
        const collection = database.collection("places");
        
        // submit query to mongoDB
        const result = await collection.find(query).toArray();

        //return query to caller
        return result;

    //error handling
    } catch (error) {
        console.error("Error inserting documents:", error);
    
    } finally {
    // Ensures that the client will close when you finish/error
        await client.close();
    }
}
