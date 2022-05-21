package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"time"

	"github.com/confluentinc/confluent-kafka-go/kafka"
	"github.com/dgrijalva/jwt-go"
	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	_ "github.com/lib/pq"
)

var db *sql.DB
var questionProducer *kafka.Producer

const (
	host     = "localhost"
	port     = 9002
	user     = "postgres"
	password = "admin"
	dbname   = "postgres"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

// User ...
// Custom object which can be stored in the claims
type User struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type Question struct {
	Id          int    `json:"id"`
	Title       string `json:"title"`
	AnswerA     string `json:"answer_a"`
	AnswerB     string `json:"answer_b"`
	AnswerC     string `json:"answer_c"`
	AnswerD     string `json:"answer_d"`
	ActivateNow bool   `json:"activate"`
}

type Vote struct {
	User       string `json:"user"`
	QuestionId int    `json:"question_id"`
	Vote       int    `json:"vote"`
}

// AuthToken ...
// This is what is retured to the user
type AuthToken struct {
	TokenType string `json:"token_type"`
	Token     string `json:"access_token"`
	ExpiresIn int64  `json:"expires_in"`
}

// AuthTokenClaim ...
// This is the cliam object which gets parsed from the authorization header
type AuthTokenClaim struct {
	*jwt.StandardClaims
	User
}

func connectWithDatabase() {
	var err error

	psqlInfo := fmt.Sprintf("host=%s port=%d user=%s "+
		"password=%s dbname=%s sslmode=disable",
		host, port, user, password, dbname)

	db, err = sql.Open("postgres", psqlInfo)
	if err != nil {
		log.Fatal("Could not connect with database:", err)
	}
	if err = db.Ping(); err != nil {
		log.Fatal("DB unreachable:", err)
	}
}

func main() {
	log.Println("Starting quiz server")

	StartProducer()
	defer questionProducer.Close()
	log.Println("Question producer running")

	fmt.Println("Connecting with database...")
	connectWithDatabase()
	defer db.Close()
	fmt.Println("Successfully connected with database.")

	r := mux.NewRouter()
	r.Handle("/", http.FileServer(http.Dir("./views/")))
	r.Handle("/register", Register).Methods("POST", "OPTIONS")
	r.Handle("/status", StatusHandler)
	r.Handle("/ws", WebSocketHandler)
	r.Handle("/question", QuestionHandler).Methods("POST", "GET", "OPTIONS")
	r.Handle("/view", ViewHandler)

	conn, err := net.Dial("udp", "8.8.8.8:80")
	if err != nil {
		log.Fatal(err)
	}
	defer conn.Close()

	localAddr := conn.LocalAddr().(*net.UDPAddr)

	fmt.Printf("Server is running on %s:%d\n", localAddr.IP, 8080)
	log.Fatal(http.ListenAndServe(":8080", r))
}

func writeCorsHeaders(w *http.ResponseWriter, req *http.Request) {
	(*w).Header().Set("Access-Control-Allow-Origin", "*")
	(*w).Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
	(*w).Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")
}

func StartProducer() {
	var err error
	questionProducer, err = kafka.NewProducer(&kafka.ConfigMap{"bootstrap.servers": "localhost"})
	if err != nil {
		panic(err)
	}
}

var QuestionHandler = http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
	fmt.Printf("/question called:\n")

	// make sure the headers are written before body is written
	writeCorsHeaders(&w, req)

	if (*req).Method == "OPTIONS" {
		return
	}

	if (*req).Method == "GET" {
		log.Println("GET /question")
		// Add new question to database
		sqlStatement := "SELECT * FROM public.questions ORDER BY id DESC LIMIT 1"
		row := db.QueryRow(sqlStatement)
		var question Question
		err := row.Scan(&question.Id, &question.Title, &question.AnswerA, &question.AnswerB, &question.AnswerC, &question.AnswerD)
		// handle special case when no rows are returned
		if err != nil && err != sql.ErrNoRows {
			log.Println("Failed retrieving latest question: ", err)
		}

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(question)
	}

	if (*req).Method == "POST" {
		var question Question
		json.NewDecoder(req.Body).Decode(&question)

		if req.ContentLength == 0 {
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		fmt.Printf("Question asked: %s\n\tA: %s\n\tB: %s\n\tC: %s\n\tD: %s\n", question.Title, question.AnswerA, question.AnswerB, question.AnswerC, question.AnswerD)

		// Add new question to database
		sqlStatement := "INSERT INTO questions (title, answer_a, answer_b, answer_c, answer_d) VALUES ($1, $2, $3, $4, $5)"
		_, err := db.Exec(sqlStatement, question.Title, question.AnswerA, question.AnswerB, question.AnswerC, question.AnswerD)

		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			fmt.Println(err)
		}

		// Delivery report handler for produced messages
		go func() {
			for e := range questionProducer.Events() {
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

		// q := Question{10, "Wat is uw favoriete kleur?", "Blauw", "Rood", "Wit", "Groen", true}
		msg, err := json.Marshal(question)

		if err != nil {
			log.Println(err)
		}

		// for _, word := range []string{"Welcome", "to", "the", "Confluent", "Kafka", "Golang", "client"} {
		questionProducer.Produce(&kafka.Message{
			TopicPartition: kafka.TopicPartition{Topic: &topic, Partition: kafka.PartitionAny},
			Value:          []byte(msg),
		}, nil)
		// }

		// Wait for message deliveries before shutting down
		questionProducer.Flush(15 * 1000)

		w.WriteHeader(http.StatusOK)
		return
	}
})

//
// Register: new users can register themselves and will retrieve a token in return.
//
var Register = http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
	var user User
	json.NewDecoder(req.Body).Decode(&user)

	fmt.Printf("Register user called: %s - %s\n", user.Username, user.Password)

	// make sure the headers are written before body is written
	writeCorsHeaders(&w, req)

	if (*req).Method == "OPTIONS" {
		return
	}

	w.Header().Set("Content-Type", "application/json")

	expiresAt := time.Now().Add(time.Minute * 1).Unix()

	token := jwt.New(jwt.SigningMethodHS256)

	token.Claims = &AuthTokenClaim{
		&jwt.StandardClaims{
			ExpiresAt: expiresAt,
		},
		User{user.Username, user.Password},
	}

	tokenString, error := token.SignedString([]byte("secret"))
	if error != nil {
		fmt.Println(error)
	}

	json.NewEncoder(w).Encode(AuthToken{
		Token:     tokenString,
		TokenType: "Bearer",
		ExpiresIn: expiresAt,
	})

	// Add new registered user to database
	sqlStatement := "INSERT INTO registered_users (name, token) VALUES ($1, $2)"
	_, err := db.Exec(sqlStatement, user.Username, tokenString)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		fmt.Println(err)
	}
})

var NotImplemented = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte("Not implemented"))
})

// Status: indicates whether the API is up and running, and whether the user is logged in or not.
var StatusHandler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte("API is up and running"))
})

func HandleVotes(conn *websocket.Conn) {
	var vote Vote
	// The event loop
	for {
		messageType, message, err := conn.ReadMessage()
		if err != nil {
			log.Println("Error during message reading: ", err)
			break
		}

		json.Unmarshal(message, &vote)
		log.Printf("-- %s voted %d\n", vote.User, vote.Vote)

		err = conn.WriteMessage(messageType, message)
		if err != nil {
			log.Println("Error during message writing:", err)
			break
		}
	}
}

// Status: indicates whether the API is up and running, and whether the user is logged in or not.
var WebSocketHandler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
	fmt.Println("Initiating websocket connection")

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Fatal(err)
	}
	defer conn.Close()

	// helpful log statement to show connections
	log.Println("Client Connected")

	// err = conn.WriteMessage(1, []byte("Hi Client!"))
	// if err != nil {
	// 	log.Println(err)
	// }

	consumer := createConsumer("myserver.public.questions")
	defer consumer.Close()

	go HandleVotes(conn)

	// Event loop waiting for topics
	for {
		msg, err := consumer.ReadMessage(-1)
		if err == nil {
			fmt.Printf("Message on %s: %s\n", msg.TopicPartition, string(msg.Value))

			// messageType, _, err := conn.NextReader()
			// if err != nil {
			// 	return
			// }

			fmt.Println("Write message to websocket: %s", msg.Value)
			// err = conn.WriteMessage(1, []byte("Something received!"))
			err = conn.WriteMessage(1, []byte(msg.Value))
			if err != nil {
				log.Println("Error during sending question via websocket")
			}
		} else {
			// The client will automatically try to recover from all errors.
			fmt.Printf("Consumer error: %v (%v)\n", err, msg)
		}
	}

	// c.Close()

})

// Status: indicates whether the API is up and running, and whether the user is logged in or not.
var ViewHandler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
	fmt.Println("/view - initiating websocket connection")

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Fatal(err)
	}
	defer conn.Close()

	// helpful log statement to show connections
	log.Println("Client Connected")

	// err = conn.WriteMessage(1, []byte("Hi Client!"))
	// if err != nil {
	// 	log.Println(err)
	// }

	consumer := createConsumer("votes")
	defer consumer.Close()

	// Event loop waiting for topics
	for {
		msg, err := consumer.ReadMessage(-1)
		if err == nil {
			fmt.Printf("Message on %s: %s\n", msg.TopicPartition, string(msg.Value))

			// messageType, _, err := conn.NextReader()
			// if err != nil {
			// 	return
			// }

			fmt.Println("Write message to websocket: %s", msg.Value)
			// err = conn.WriteMessage(1, []byte("Something received!"))
			err = conn.WriteMessage(1, []byte(msg.Value))
			if err != nil {
				log.Println("Error during sending question via websocket")
			}
		} else {
			// The client will automatically try to recover from all errors.
			fmt.Printf("Consumer error: %v (%v)\n", err, msg)
		}
	}

	// c.Close()

	// // The event loop
	// for {
	// 	messageType, message, err := conn.ReadMessage()
	// 	if err != nil {
	// 		log.Println("Error during message reading: ", err)
	// 		break
	// 	}
	// 	log.Printf("Received: %s", message)

	// 	err = conn.WriteMessage(messageType, message)
	// 	if err != nil {
	// 		log.Println("Error during message writing:", err)
	// 		break
	// 	}
	// }
})

func createConsumer(topic string) *kafka.Consumer {
	c, err := kafka.NewConsumer(&kafka.ConfigMap{
		"bootstrap.servers":    "localhost",
		"group.id":             "myGroup",
		"auto.offset.reset":    "earliest",
		"max.poll.interval.ms": 60000,
	})

	if err != nil {
		panic(err)
	}

	c.SubscribeTopics([]string{topic}, nil)

	return c

	// for {
	// 	msg, err := c.ReadMessage(-1)
	// 	if err == nil {
	// 		fmt.Printf("Message on %s: %s\n", msg.TopicPartition, string(msg.Value))
	// 		err = conn.WriteMessage(msg)
	// 		if err != nil {
	// 			log.Println("Error during sending question via websocket")
	// 		}
	// 	} else {
	// 		// The client will automatically try to recover from all errors.
	// 		fmt.Printf("Consumer error: %v (%v)\n", err, msg)
	// 	}
	// }

	// c.Close()

	// // create a new context
	// ctx := context.Background()
	// // produce messages in a new go routine, since
	// // both the produce and consume functions are
	// // blocking
	// consume(ctx)
}
