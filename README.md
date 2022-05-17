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

## Client application

```bash
cd client-app
npm install

# Runs development mode.
npm start
```