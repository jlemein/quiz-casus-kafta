# Background

The quiz consists of 3 applications:
* client-app: the client application used to answer questions of the quiz.
* server-app: the server application that manages the requests and connects you with the quiz host.
* host-app: the quiz host application for launching questions. Also visualizes the results.

In general the quiz should be able to work for thousands of participants at the same time. The idea is to use Kafka for the messaging.

# Running the application

It is important to have the following applications installed:
* Node
* NPM
* Docker

The following technologies are used:
* React: for front-end visualization.
* Kafka: for handling the messages on the server.

## Server application

The server application will become a docker-compose file, since multiple services are needed.

```bash
docker-compose -up
```

Not using containers is possible too:
```bash
# see: https://kafka.apache.org/documentation.html#quickstart

# Download kafka first
tar -xzf kafka_2.13-3.1.1-SNAPSHOT.tgz
cd kafka_2.13-3.1.1

# Start the service
bin/zookeeper-server-start.sh config/zookeeper.properties
bin/kafka-server-start.sh config/server.properties
bin/kafka-topics.sh --create --topic quickstart-events --bootstrap-server localhost:9092

# (Optional) Writing events into the topic
bin/kafka-console-producer.sh --topic quickstart-events --bootstrap-server localhost:9092
```

## Client application

```bash
cd client-app
npm install

# Runs development mode.
npm start
```