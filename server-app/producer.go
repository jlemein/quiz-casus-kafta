package main

import (
	"encoding/json"
	"fmt"
	"log"

	"github.com/confluentinc/confluent-kafka-go/kafka"
)

type Question struct {
	Id          int    `json:"id"`
	Title       string `json:"title"`
	AnswerA     string `json:"answer_a"`
	AnswerB     string `json:"answer_b"`
	AnswerC     string `json:"answer_c"`
	AnswerD     string `json:"answer_d"`
	ActivateNow bool   `json:"activate"`
}

func main() {

	p, err := kafka.NewProducer(&kafka.ConfigMap{"bootstrap.servers": "localhost"})
	if err != nil {
		panic(err)
	}

	defer p.Close()

	// Delivery report handler for produced messages
	go func() {
		for e := range p.Events() {
			switch ev := e.(type) {
			case *kafka.Message:
				if ev.TopicPartition.Error != nil {
					fmt.Printf("Delivery failed: %v\n", ev.TopicPartition)
				} else {
					fmt.Printf("Delivered message to %v\n", ev.TopicPartition)
				}
			}
		}
	}()

	// Produce messages to topic (asynchronously)
	topic := "myserver.public.questions"

	q := Question{10, "Wat is uw favoriete kleur?", "Blauw", "Rood", "Wit", "Groen", true}
	msg, err := json.Marshal(q)

	if err != nil {
		log.Fatal(err)
	}

	// for _, word := range []string{"Welcome", "to", "the", "Confluent", "Kafka", "Golang", "client"} {
	p.Produce(&kafka.Message{
		TopicPartition: kafka.TopicPartition{Topic: &topic, Partition: kafka.PartitionAny},
		Value:          []byte(msg),
	}, nil)
	// }

	// Wait for message deliveries before shutting down
	p.Flush(15 * 1000)
}
