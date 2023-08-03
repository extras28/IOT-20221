const mqtt = require("mqtt");
const { updateData } = require("../controllers/plantController");
const { conns } = require("../WebSocket");

const options = {};
const broker = "mqtt://broker.mqttdashboard.com:1883";
console.log(conns);

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

      // Broadcast the MQTT message to websocket clients
      conns.forEach((conn) => {
        // Check if connection is open before sending
        if (conn.connected) {
          conn.sendUTF(conns.length);
        }
      });
    });
  } catch (err) {
    console.log(err);
  }
};

module.exports = { connectMQTT };
