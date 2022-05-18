package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/dgrijalva/jwt-go"
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

// User ...
// Custom object which can be stored in the claims
type User struct {
	Username string `json:"username"`
	Password string `json:"password"`
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

func main() {
	fmt.Println("Starting quiz server")

	r := mux.NewRouter()
	r.Handle("/", http.FileServer(http.Dir("./views/")))
	r.Handle("/register", Register).Methods("POST", "OPTIONS")
	r.Handle("/status", StatusHandler)

	http.HandleFunc("/ws", wsEndpoint)

	log.Fatal(http.ListenAndServe(":8080", r))
}

func writeCorsHeaders(w *http.ResponseWriter, req *http.Request) {
	(*w).Header().Set("Access-Control-Allow-Origin", "*")
	(*w).Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
	(*w).Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")
}

var Register = http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
	fmt.Fprintf(w, "Register user")

	writeCorsHeaders(&w, req)
	if (*req).Method == "OPTIONS" {
		return
	}

	var user User
	_ = json.NewDecoder(req.Body).Decode(&user)

	fmt.Printf("Register user called: %s - %s\n", user.Username, user.Password)

	// expiresAt := time.Now().Add(time.Minute * 1).Unix()

	// token := jwt.New(jwt.SigningMethodHS256)

	// token.Claims = &AuthTokenClaim{
	// 	&jwt.StandardClaims{
	// 		ExpiresAt: expiresAt,
	// 	},
	// 	User{user.Username, user.Password},
	// }

	// tokenString, error := token.SignedString([]byte("secret"))
	// if error != nil {
	// 	fmt.Println(error)
	// }

	w.Header().Set("Content-Type", "application/json")

	// json.NewEncoder(w).Encode(AuthToken{
	// 	Token:     tokenString,
	// 	TokenType: "Bearer",
	// 	ExpiresIn: expiresAt,
	// })
})

var NotImplemented = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte("Not implemented"))
})

var StatusHandler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte("API is up and running"))
})
