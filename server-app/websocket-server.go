package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

func wsEndpoint(w http.ResponseWriter, r *http.Request) {
	// fmt.Fprintf(w, "Hello World")
	upgrader.CheckOrigin = func(r *http.Request) bool {
		return true
	}

	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
	}

	// helpful log statement to show connections
	log.Println("Client Connected")

	err = ws.WriteMessage(1, []byte("Hi Client!"))
	if err != nil {
		log.Println(err)
	}

	reader(ws)
}

func reader(conn *websocket.Conn) {
	for {
		// read in a message
		messageType, p, err := conn.ReadMessage()
		if err != nil {
			log.Println(err)
			return
		}
		// print out that message for clarity
		fmt.Println(string(p))

		if err := conn.WriteMessage(messageType, p); err != nil {
			log.Println(err)
			return
		}

	}
}

type User struct {
	Name string
}

func register(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "Register user")

	user := &User{}
	json.NewDecoder(r.Body).Decode(user)

	expiresAt := time.Now().Add(time.Minute * 100000).Unix()
	tk := &models.Token{
		Name: user.Name,
		StandardClaims: &jwt.StandardClaims{
			ExpiresAt: expiresAt,
		},
	}
	token := jwt.NewWithClaims(jwt.GetSigningMethod("HS256"), tk)
	tokenString, err := token.SignedString([]byte("secret"))
	if err != nil {
		fmt.Println(err)
	}

	var resp = map[string]interface{}{"status": false, "message": "logged in"}
	resp["token"] = tokenString
	resp["user"] = user
	json.NewEncoder(w).Encode(resp)
}

func main() {
	fmt.Println("Starting quiz server")

	r := mux.NewRouter()
	r.Handle("/", http.FileServer(http.Dir("./views/")))
	r.Handle("/register", register).Methods("POST")
	r.Handle("/status", StatusHandler)

	http.HandleFunc("/ws", wsEndpoint)

	log.Fatal(http.ListenAndServe(":8080", r))
}

var NotImplemented = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte("Not implemented"))
})

var StatusHandler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte("API is up and running"))
})
