package main

import (
	"database/sql"
	"fmt"

	"github.com/confluentinc/confluent-kafka-go/kafka"
	_ "github.com/lib/pq"
)

// the topic and broker address are initialized as constants
const (
	topic          = "myserver.public.questions"
	broker1Address = "localhost:9092" //"3"
	broker2Address = "localhost:9094"
	broker3Address = "localhost:9095"
)

var db *sql.DB

func main() {
	c, err := kafka.NewConsumer(&kafka.ConfigMap{
		"bootstrap.servers":    "localhost",
		"group.id":             "myGroup",
		"auto.offset.reset":    "earliest",
		"max.poll.interval.ms": 60000,
	})

	if err != nil {
		panic(err)
	}

	c.SubscribeTopics([]string{"myserver.public.questions"}, nil)

	for {
		msg, err := c.ReadMessage(-1)
		if err == nil {
			fmt.Printf("Message on %s: %s\n", msg.TopicPartition, string(msg.Value))
		} else {
			// The client will automatically try to recover from all errors.
			fmt.Printf("Consumer error: %v (%v)\n", err, msg)
		}
	}

	c.Close()

	// // create a new context
	// ctx := context.Background()
	// // produce messages in a new go routine, since
	// // both the produce and consume functions are
	// // blocking
	// consume(ctx)
}

// func consume(ctx context.Context) {
// 	// initialize a new reader with the brokers and topic
// 	// the groupID identifies the consumer and prevents
// 	// it from receiving duplicate messages
// 	r := kafka.NewReader(kafka.ReaderConfig{
// 		Brokers: []string{broker1Address, broker2Address, broker3Address},
// 		Topic:   topic,
// 		// GroupID:  "my-group",
// 		MinBytes: 5,
// 		MaxBytes: 1e6,
// 		// wait for at most 3 seconds before receiving new data
// 		MaxWait: 3 * time.Second,
// 	})
// 	for {
// 		// the `ReadMessage` method blocks until we receive the next event
// 		msg, err := r.ReadMessage(ctx)
// 		if err != nil {
// 			panic("could not read message " + err.Error())
// 		}
// 		// after receiving the message, log its value
// 		fmt.Println("received: ", string(msg.Value))
// 	}
// }
