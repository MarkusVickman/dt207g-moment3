//express server med api hostad hos azure som lagrar och hämtar data från en heliohost mysql databas.
//Variable .env
require('dotenv').config({ path: './.env' });
//Lägger till mysql och ansluter
const mysql = require("mysql");

//anslutning till mySQL databas
const pool = mysql.createPool({
    connectionLimit: 10,
    host: process.env.HOST,
    user: process.env.USER_ACC,
    password: process.env.PASSWORD,
    database: process.env.DATABASE
});

//Ger meddelande vid anslutning eller vid misslyckad.
/*connection.connect((err) => {
    if (err) {
        console.error("Connection failed big!: " + err);
       // throw err; Ger fel av Host-servern
    }

    console.log("Connected to MySQL!");
});*/


//lägger till express och cors för att kunna ansluta från vilken adress som helst
const express = require('express');
const cors = require('cors');
//Inställningar för express
const app = express();
const port = process.env.PORT;

//stöd för ta json-format och 
app.use(express.json());
app.use(cors());

//Välkomst meddelande om webbadress/api anropas
app.get('/api', (req, res) => {
    res.json({ message: 'Welcome to my CV api!' });
});

//hämtar data från mySQL server och skickar med det som svart i fetch förfrågan om webbadress/api/cv anropas. Skickar felmeddelande om fel uppstår hos databasen.
app.get('/api/cv', (req, res) => {
    pool.getConnection(function (err, connection) {
        if (err) throw err; // not connected!

        connection.query("SELECT * FROM WORK_EXPERIENCE;", (err, rows) => {
            if (err) {
                res.status(500).json({ error: "Could not reach database. " + err });
                throw err;
            }
            else {
                res.json(rows);
                // släpper databasanslutningen.
                connection.release();
                // hanterar fel vid släpp.
                if (err) throw err;
            }
        });
    });
});

//lägger till data till mySQL servern från post-anropet om webbadress/api/add anropas. Skickar felmeddelande om fel uppstår hos databasen.
app.post('/api/add', (req, res) => {
    let companyName = req.body.companyName;
    let jobTitle = req.body.jobTitle;
    let location = req.body.location;
    let startDate = req.body.startDate;
    let endDate = req.body.endDate;
    let description = req.body.description;

    let error = {};

    //Felhantering om uppgifter saknas
    if (!companyName || !jobTitle || !location || !startDate || !endDate || !description) {
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
        pool.getConnection(function (err, connection) {
            if (err) throw err; // not connected!

            connection.query("INSERT INTO WORK_EXPERIENCE(COMPANY_NAME, JOB_TITLE, LOCATION, START_DATE, END_DATE, DESCRIPTION) VALUES(?,?,?,?,?,?)", [companyName, jobTitle, location, startDate, endDate, description], (err, result) => {
                if (err) {
                    res.status(500).json({ error: "Database error. " + err });
                    throw err;
                }
                else {
                    res.json({ Success: "Post data stored in database." });
                    // släpper databasanslutningen.
                    connection.release();
                    // hanterar fel vid släpp.
                    if (err) throw err;
                }
            });
        });
    }
});

//Ändrar rader i mySQL-databasen när förfrågan till webbadress/api/edit görs. Skickar felmeddelande om fel uppstår hos databasen.
app.put('/api/edit', (req, res) => {
    let indexId = req.body.indexId;
    let companyName = req.body.companyName;
    let jobTitle = req.body.jobTitle;
    let location = req.body.location;
    let startDate = req.body.startDate;
    let endDate = req.body.endDate;
    let description = req.body.description;

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
        pool.getConnection(function (err, connection) {
            if (err) throw err; // not connected!

            connection.query("UPDATE WORK_EXPERIENCE SET COMPANY_NAME=?, JOB_TITLE=?, LOCATION=?, START_DATE=?, END_DATE=?, DESCRIPTION=? WHERE ID=?", [companyName, jobTitle, location, startDate, endDate, description, indexId], (err) => {
                if (err) {
                    res.status(500).json({ error: "Database error. " + err });
                    throw err;
                }
                else {
                    res.status(200).json({ Success: "Put data updated in database." });
                    // släpper databasanslutningen.
                    connection.release();
                    // hanterar fel vid släpp.
                    if (err) throw err;
                }
            });
        });
    }

});

//tar bort data från mySQL server när förfrågan till webbadress/api/cv görs. Skickar felmeddelande om fel uppstår hos databasen.
app.delete('/api/delete/:id', (req, res) => {
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
