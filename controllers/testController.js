const mqtt = require('mqtt');
const broker = 'mqtt://broker.mqttdashboard.com:1883';
const topic = 'DUNGNA';
const options = {

}

const client = mqtt.connect(broker, options);

const testController = {
    sendMessageToSenser: async (req, res) => {
        try {
            const test = {
                request: "1",
            }
            client.publish(topic, JSON.stringify({
                "key1": "value1"
            }), (err) => {
                if (err)
                    console.log('MQTT publish error: ', err);
                else
                    console.log('Published!');
            })
            res.send({
                message: "send data suceed",
            })
        } catch (error) {
            console.log(error);
        }
    }
}

module.exports = testController;
