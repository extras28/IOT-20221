const mqtt = require("mqtt");
const { updateData } = require("../controllers/plantController");
// // const { updateData } = require('./controllers/deviceControl');

const options = {
    //     // Clean session
    //    //clean: true,
    //   // connectTimeout: 10000,
    //     // Auth
    //   // clientId: 'c373f1a2-3766-4598-b84a-cf401621663e',
};
const broker = "mqtt://broker.mqttdashboard.com:1883";
// const topic = 'DUNGNA';

const connectMQTT = (topic) => {
    try {
        const client = mqtt.connect(broker, options);
        console.log("MQTT connected!");
        client.on("connect", () => {
            client.subscribe(topic);
        });
        client.on("message", (tp, msg) => {
            var data = JSON.parse(msg);
            // var data = JSON.stringify(msg)

            console.log("Received MQTT msg:", data);
            // updateData(data)
            updateData(data);
        });
    } catch (err) {
        console.log(err);
    }
};
// module.exports = {connectMQTT}
// var mqtt = require("mqtt");

// var options = {
//     host: "5bba22212f8b4b36ac41f907dba4cc42.s2.eu.hivemq.cloud",
//     port: 8883,
//     protocol: "mqtts",
//     username: "DUNGNA",
//     password: "nguyenanhdung28",
// };

// const connectMQTT = (topic) => {
//     try {
//         // initialize the MQTT client
//         var client = mqtt.connect(options);

//         // setup the callbacks
//         client.on("connect", function () {
//             console.log("Connected to MQTT");
//         });

//         client.on("error", function (error) {
//             console.log(error.message);
//         });

//         client.on("message", function (tp, message) {
//             // called each time a message is received
//             console.log("Received message:", topic, message.toString());
//         });

//         client.subscribe(topic);

//         // publish message 'Hello' to topic 'my/test/topic'
//         // client.publish("my/test/topic", "Hello");
//     } catch (error) {
//         console.log({
//             result: "failed",
//             message: "connect to mqtt broker failed",
//             reason: error.message,
//         });
//     }
// };

module.exports = { connectMQTT };
