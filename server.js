//express server med api hostad hos azure som lagrar och hämtar data från en mongoDB databas.
//Variable .env
require('dotenv').config({ path: './.env' });
//lägger till express och cors för att kunna ansluta från vilken adress som helst
const express = require('express');
const cors = require('cors');
//Inställningar för express
const app = express();
const port = process.env.PORT;

//stöd för ta json-format och 
app.use(express.json());
app.use(cors());


//Lägger till mongoose
const mongoose = require('mongoose');
const { type } = require('express/lib/response');

//Ansluter till mongoDB
mongoose.connect("mongodb://localhost:27017/developer_dt207g").then(() => {
    console.log("Connected to MongoDB");
}).catch((error) => {
    console.log("Error connecting to database: " + error);
})

// Skapa ett db-schema
const WorkSchema = mongoose.Schema({
    indexId: {
        type: String,
        required: false
    },
    companyName: {
        type: String,
        required: true
    },
    jobTitle: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    description: {
        type: String,
        required: true
    }
});


// Skapa en model
const WorkExperience = mongoose.model('Work_experience', WorkSchema);


//Välkomst meddelande om webbadress/api anropas
app.get('/api', (req, res) => {
    res.json({ message: 'Welcome to my CV api!' });
});

//hämtar data från mySQL server och skickar med det som svart i fetch förfrågan om webbadress/api/cv anropas. Skickar felmeddelande om fel uppstår hos databasen.
app.get('/api/cv', async (req, res) => {
    try {

        //connection.query("SELECT * FROM WORK_EXPERIENCE;", (err, rows) => {

        let result = await WorkExperience.find();
        return res.json(result);

    } catch (error) {
        return res.status(500).json({ error: "Could not reach database. " + error });
    }
});

//lägger till data till mySQL servern från post-anropet om webbadress/api/add anropas. Skickar felmeddelande om fel uppstår hos databasen.
app.post('/api/add', async (req, res) => {

    let workExperience1 = {
        companyName: req.body.companyName,
        jobTitle: req.body.jobTitle,
        location: req.body.location,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        description: req.body.description
    };

    let error = {};

    //Felhantering om uppgifter saknas
    if (!workExperience1.companyName || !workExperience1.jobTitle || !workExperience1.location || !workExperience1.startDate || !workExperience1.endDate || !workExperience1.description) {
        error = {
            message: "Parameters missing in the request.",
            detail: "Post request most include companyName, jobTitle, location, startDate, endDate and description",
            https_response: {
                message: "Bad Request",
                code: 400
            }
        }
        res.status(400).json(error);
    }
    //Om allt är korrekt körs frågan till mySQL-databasen för att lagre det nya cv
    else {
        try {
            await WorkExperience.create(workExperience1);
            return res.json({ Success: "Post data stored in database." });
        } catch (error) {
            return res.status(500).json({ error: "Database error. " + error });
        }
    }
});


//Ändrar rader i mySQL-databasen när förfrågan till webbadress/api/edit görs. Skickar felmeddelande om fel uppstår hos databasen.
app.put('/api/edit', async(req, res) => {

    let workExperience1 = {
        indexId: req.body.indexId,
        companyName: req.body.companyName,
        jobTitle: req.body.jobTitle,
        location: req.body.location,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        description: req.body.description
    };

    let error = {
        message: "Parameters missing in the request.",
        detail: "Put request most include indexId and atleast one of the following parameters companyName, jobTitle, location, startDate, endDate and description",
        https_response: {
            message: "Bad Request",
            code: 400
        }
    }

    //Felhantering om uppgifter saknas.
    if (!indexId) {
        res.status(400).json(error);
    }
    else if (!companyName || !jobTitle || !location || !startDate || !endDate || !description) {
        res.status(400).json(error);
    }
    //värdet skrivs in på rätt index i rätt kolomn i databasen.
    else {
        try {
            await WorkExperience.create(workExperience1);
            return res.status(200).json({ Success: "Put data updated in database." });
        } catch (error) {
            return res.status(500).json({ error: "Database error. " + error });
        }
    }
});

//tar bort data från mySQL server när förfrågan till webbadress/api/cv görs. Skickar felmeddelande om fel uppstår hos databasen.
app.delete('/api/delete/:id', async(req, res) => {
    let id = req.params.id;

    pool.getConnection(function (err, connection) {
        if (err) throw err; // not connected!

        //Fråga skickas till databasen för att ta bort raden om den finns annars skapas felkod. Felkod skapas av andra databasfel också.
        connection.query("DELETE FROM WORK_EXPERIENCE WHERE ID=?;", id, (err) => {
            if (err) {
                res.status(500).json({ error: "Database error. " + err });
                throw err;
            } else {
                res.json({ Success: "Delete data removed from database." });
                // släpper databasanslutningen.
                connection.release();
                // hanterar fel vid släpp.
                if (err) throw err;
            }
        });
    });
});
//Startar servern
app.listen(port, () => {
    console.log('Server is running on port: ' + port);
});
