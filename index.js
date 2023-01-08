const express = require("express");
const cors = require("cors");
const app = express();
const database = require("./configs/database/index");
const fileUpload = require("express-fileupload");
const bodyParser = require("body-parser");
const { connectMQTT } = require("./utils/mqtt");
const testRouter = require("./routes/testRoute");
const accountRouter = require("./routes/accountRouter");
const balconyRouter = require("./routes/balconyRouter");
const plantRouter = require("./routes/plantRouter");

const corsOpts = {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],

    allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOpts));

app.use(
    fileUpload({
        createParentPath: true,
        useTempFiles: true,
        uriDecodeFileNames: true,
        defParamCharset: "utf8",
        abortOnLimit: true,
    })
);
// parse requests of content-type - application/json
app.use(express.json());
// parse requests of content-type - application/x-www-form-urlencoded
app.use(
    express.urlencoded({
        extended: true,
    })
);
app.use(
    bodyParser.json({
        limit: "128mb",
    })
);
app.use(
    bodyParser.urlencoded({
        extended: true,
        limit: "128mb",
    })
);

// database connect
database.connect();

// mqtt connect
connectMQTT("DUNGNA_SENDING");

app.use(accountRouter, function (req, res, next) {
    next();
});

app.use(balconyRouter, function (req, res, next) {
    next();
});

app.use(plantRouter, function (req, res, next) {
    next();
});

app.use("/", function (req, res, next) {
    res.status(200).json({
        result: "success",
        message: "oke oke",
    });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Your app listening at http://localhost:${PORT}`);
});
