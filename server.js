import express from "express";
import mongoose from "mongoose";
import Cors from "cors";
import Messages from "./dbMessages.js";
import Pusher from "pusher";

//App Config
const app = express();
const port = process.env.PORT || 9000;
const connection_url =
  "mongodb+srv://tagore412:fiFgP4mwb8phC9ol@cluster0.jebdamj.mongodb.net/?retryWrites=true&w=majority";

//pusher config
const pusher = new Pusher({
  appId: "1563046",
  key: "894b768214bb3e496101",
  secret: "a05ef0e84eeb91d2fc13",
  cluster: "ap2",
  useTLS: true,
});

//Middleware
app.use(express.json());
app.use(Cors());

//DB Config
mongoose.connect(connection_url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

//API Endpoints
const db = mongoose.connection;
db.once("open", () => {
  console.log("DB Connected");
  const msgCollection = db.collection("messagingmessages");
  const changeStream = msgCollection.watch();
  changeStream.on("change", (change) => {
    console.log(change);
    if (change.operationType === "insert") {
      const messageDetails = change.fullDocument;
      pusher.trigger("messages", "inserted", {
        name: messageDetails.name,
        message: messageDetails.message,
        timestamp: messageDetails.timestamp,
        received: messageDetails.received,
      });
    } else {
      console.log("Error trigerring Pusher");
    }
  });
});

app.get("/", (req, res) => res.status(200).send("Hello TheWebDev"));

app.post("/messages/new", (req, res) => {
  const dbMessage = req.body;
  Messages.create(dbMessage).then((data, err) => {
    if (err) res.status(500).send(err);
    else res.status(201).send(data);
  });
});
app.get("/messages/sync", (req, res) => {
  Messages.find({}).then((data, err) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(data);
    }
  });
});

//Listener
app.listen(port, () => console.log(`Listening on localhost: ${port}`));
