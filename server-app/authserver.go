package main

import (
	"bytes"
	"crypto/rand"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/dgrijalva/jwt-go"
	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	_ "github.com/lib/pq"
	"golang.org/x/crypto/argon2"
)

var db *sql.DB

var host = "localhost"
var uniqueId int = 1

const (
	// host     = "104.248.85.184" // "localhost"
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

type DbUser struct {
	Id           int
	Username     string
	PasswordHash []byte
	Salt         []byte
}

type UserClaims struct {
	Id       int
	Username string
}

type ErrorResponse struct {
	Message string `json:"error"`
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

type HashConfiguration struct {
	memory      uint32
	iterations  uint32
	parallelism uint8
	saltLength  uint32
	keyLength   uint32
}

// AuthTokenClaim ...
// This is the claim object which gets parsed from the authorization header
type AuthTokenClaim struct {
	*jwt.StandardClaims
	UserClaims
}

func validateToken() (*AuthTokenClaim, error) {
	// Retrieve cookie
	c, err := req.Cookie("token")
	if err != nil {
		if err == http.ErrNoCookie {
			log.Println("/status (GET): Error - no cookie")
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		log.Println("/status (GET): Error - no cookie")
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	authToken := c.Value
	log.Println("Validating token: ", authToken)

	claims := &AuthTokenClaim{}

	tkn, err := jwt.ParseWithClaims(authToken, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(os.Getenv("AUTH_PEPPER")), nil
	})

	// Check if signature
	log.Println("Received claims: ", claims.UserClaims.Username)
	if err != nil {
		if err == jwt.ErrSignatureInvalid {
			log.Println("Signature invalid")
			return claims, errors.New("Token signature invalid")
		} else {
			log.Println("Token invalid")
			return claims, errors.New("Token invalid")
		}
	}

	if !tkn.Valid {
		return claims, errors.New("Token invalid")
	}

	return claims, nil
}

func main() {
	log.Println("Starting server...")
	if len(os.Args) < 2 {
		log.Println("No host specified. Assuming default host: ", host)

	} else {
		host = os.Args[1]
	}

	log.Println("Host ip is:", host)

	// database connection
	fmt.Println("Connecting with database...")
	connectWithDatabase()
	defer db.Close()
	fmt.Println("Successfully connected with database.")

	// setup end point routes
	r := mux.NewRouter()
	r.Handle("/register", RegisterHandler).Methods("POST", "OPTIONS")
	r.Handle("/login", LoginHandler).Methods("POST", "OPTIONS")
	r.Handle("/status", StatusHandler).Methods("POST")
	r.Handle("/question", QuestionHandler).Methods("POST", "GET", "OPTIONS")

	// find local ip address
	// conn, err := net.Dial("udp", "8.8.8.8:80")
	// if err != nil {
	// 	log.Fatal(err)
	// }
	// defer conn.Close()
	// localAddr := conn.LocalAddr().(*net.UDPAddr)

	log.Printf("Server is running on %s:%d\n", host, 8080)
	log.Fatal(http.ListenAndServe(":8080", r))
}

var QuestionHandler = http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
	log.Printf("/question called:\n")

	// make sure the headers are written before body is written
	writeCorsHeaders(&w, req)

	// validate logged in user
	authToken := req.Header.Get("Authorization")
	_, err := validateToken(authToken)
	if err != nil {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(ErrorResponse{Message: err.Error()})
		return
	}

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

		// Add new question to database
		sqlStatement := "INSERT INTO questions (title, answer_a, answer_b, answer_c, answer_d) VALUES ($1, $2, $3, $4, $5);"
		_, err := db.Exec(sqlStatement, question.Title, question.AnswerA, question.AnswerB, question.AnswerC, question.AnswerD)

		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			fmt.Println(err)
		}

		sqlStatement = "SELECT * FROM public.questions ORDER BY id DESC LIMIT 1"
		row := db.QueryRow(sqlStatement)
		err = row.Scan(&question.Id, &question.Title, &question.AnswerA, &question.AnswerB, &question.AnswerC, &question.AnswerD)

		log.Println("POST /question, id: ", question.Id)
		log.Printf("Question asked: %s\n\tA: %s\n\tB: %s\n\tC: %s\n\tD: %s\n", question.Title, question.AnswerA, question.AnswerB, question.AnswerC, question.AnswerD)

		if err != nil {
			fmt.Println("Status bad response: username already taken.")
			w.WriteHeader(http.StatusBadRequest)
			errorResponse := ErrorResponse{Message: "Username already taken."}
			json.NewEncoder(w).Encode(errorResponse)
			return
		}

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(question)
		return
	}
})

//
// Register: new users can register themselves and will retrieve a token in return.
//
var RegisterHandler = http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
	// make sure the headers are written before body is written
	writeCorsHeaders(&w, req)

	if (*req).Method == "OPTIONS" {
		return
	}

	p := &HashConfiguration{
		memory:      64 * 1024, // how much memory you can use
		iterations:  3,         // how much time it can take. Choose iterations so that time < max time limit.
		parallelism: 2,         // number of threads that can be used
		saltLength:  32,        // at least the same length as the output of the hash
		keyLength:   32,        // length of the hash
	}

	var user User
	json.NewDecoder(req.Body).Decode(&user)

	fmt.Printf("Register user called: %s - %s\n", user.Username, password)

	// Generate salt
	salt := make([]byte, p.saltLength)
	_, err := rand.Read(salt)

	if err != nil {
		log.Printf("Failed generating salt")
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	// Generate hash from salt, pepper and password
	password := user.Password + os.Getenv("AUTH_PEPPER")
	hash := argon2.IDKey([]byte(password), salt, p.iterations, p.memory, p.parallelism, p.keyLength)

	fmt.Printf("Hash: %x\n", hash)
	fmt.Printf("Salt: %x\n", salt)

	// Add new registered user to database
	sqlStatement := "INSERT INTO users (username, password, salt) VALUES ($1, $2, $3)"
	_, err = db.Exec(sqlStatement, user.Username, string(hash), string(salt))
	if err != nil {
		fmt.Println("Status bad response: username already taken.")
		w.WriteHeader(http.StatusConflict)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(ErrorResponse{Message: "Username already taken."})
		return
	}

	// Create token
	expiresAt := time.Now().Add(time.Minute * 5)

	token := jwt.New(jwt.SigningMethodHS256)

	token.Claims = &AuthTokenClaim{
		&jwt.StandardClaims{
			ExpiresAt: expiresAt.Unix(),
		},
		UserClaims{Id: -1, Username: user.Username},
	}

	secret := os.Getenv("AUTH_PEPPER")
	tokenString, error := token.SignedString([]byte(secret))
	if error != nil {
		fmt.Println(error)
	}

	// json.NewEncoder(w).Encode(AuthToken{
	// 	Token:     tokenString,
	// 	TokenType: "Bearer",
	// 	ExpiresIn: expiresAt.Unix(),
	// })

	fmt.Println("Setting cookie")
	c := http.Cookie{
		Name:    "token",
		Value:   tokenString,
		Expires: expiresAt,
	}
	http.SetCookie(w, &c)

	// http.SetCookie(w, createToken(DbUser{}))

})

func createToken(user DbUser) *http.Cookie {
	// Create token
	expiresAt := time.Now().Add(time.Minute * 5)

	token := jwt.New(jwt.SigningMethodHS256)

	token.Claims = &AuthTokenClaim{
		&jwt.StandardClaims{
			ExpiresAt: expiresAt.Unix(),
		},
		UserClaims{Id: user.Id, Username: user.Username},
	}

	secret := os.Getenv("AUTH_PEPPER")
	tokenString, error := token.SignedString([]byte(secret))
	if error != nil {
		fmt.Println(error)
	}

	// json.NewEncoder(w).Encode(AuthToken{
	// 	Token:     tokenString,
	// 	TokenType: "Bearer",
	// 	ExpiresIn: expiresAt.Unix(),
	// })

	fmt.Println("Setting cookie")
	c := &http.Cookie{
		Name:    "token",
		Value:   tokenString,
		Expires: expiresAt,
	}

	return c
}

var LoginHandler = http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
	// make sure the CORS headers are written before body is written
	writeCorsHeaders(&w, req)

	if (*req).Method == "OPTIONS" {
		return
	}

	p := &HashConfiguration{
		memory:      64 * 1024, // how much memory you can use
		iterations:  3,         // how much time it can take. Choose iterations so that time < max time limit.
		parallelism: 2,         // number of threads that can be used
		saltLength:  32,        // at least the same length as the output of the hash
		keyLength:   32,        // length of the hash
	}

	var user User
	var dbuser DbUser
	json.NewDecoder(req.Body).Decode(&user)
	fmt.Printf("Login user called: %s - %s\n", user.Username, user.Password)

	// === Find user in database ==================================================================
	sqlStatement := `SELECT id, username, password, salt FROM public.users WHERE username=$1;`
	row := db.QueryRow(sqlStatement, user.Username)
	err := row.Scan(&dbuser.Id, &dbuser.Username, &dbuser.PasswordHash, &dbuser.Salt)

	// If no rows are returned, then no user could be found, so login fails.
	if err != nil {
		log.Printf("%s\n", err)
		log.Println("Failed login: no users found.")

		w.WriteHeader(http.StatusUnauthorized)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(ErrorResponse{Message: "Login attempt failed."})
		return
	}

	// === Validate login =========================================================================
	// Generate hash from salt, pepper and password
	password := user.Password + os.Getenv("AUTH_PEPPER")
	hash := argon2.IDKey([]byte(password), dbuser.Salt, p.iterations, p.memory, p.parallelism, p.keyLength)

	if bytes.Compare(hash, dbuser.PasswordHash) != 0 {
		w.WriteHeader(http.StatusUnauthorized)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(ErrorResponse{Message: "Login attempt failed."})
		return
	}

	log.Printf("User %s successfully logged in.\n", dbuser.Username)

	// === Create access token for logged in user ===================================================
	expiresAt := time.Now().Add(time.Minute * 10)

	token := jwt.New(jwt.SigningMethodHS256)

	token.Claims = &AuthTokenClaim{
		&jwt.StandardClaims{
			ExpiresAt: expiresAt.Unix(),
		},
		UserClaims{
			Id:       dbuser.Id,
			Username: dbuser.Username,
		},
	}

	tokenString, error := token.SignedString([]byte(os.Getenv("AUTH_PEPPER")))
	if error != nil {
		fmt.Println(error)
	}

	fmt.Println("Setting cookie (login)")
	c := &http.Cookie{
		Name:    "token",
		Value:   tokenString,
		Expires: expiresAt,
	}
	http.SetCookie(w, c)

	json.NewEncoder(w).Encode(AuthToken{
		Token:     tokenString,
		TokenType: "Bearer",
		ExpiresIn: expiresAt.Unix(),
	})

})

var NotImplemented = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte("Not implemented"))
})

type StatusMessage struct {
	Id       int    `json:"userid"`
	Username string `json:"username"`
	LoggedIn bool   `json:"logged_in"`
	Status   string `json:"status"`
}

// Status: indicates whether the API is up and running, and whether the user is logged in or not.
var StatusHandler = http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
	writeCorsHeaders(&w, req)

	claims, err := validateAuthorizationCookie(w, req)
	if err != nil {
		return
	}

	if (*req).Method == "OPTIONS" {
		return
	}

	log.Println("/status OK")

	authToken := c.Value

	// retrieve authorization token from request
	claims, err := validateToken(authToken)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		log.Printf("Error: %s", err)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Header().Set("Content-Type", "application/json")

	statusMessage := StatusMessage{
		Status:   "API is up and running",
		LoggedIn: true,
	}

	if err != nil {
		statusMessage.LoggedIn = false
	} else {
		statusMessage.LoggedIn = true
		statusMessage.Id = claims.UserClaims.Id
		statusMessage.Username = claims.UserClaims.Username
	}

	// statusMessage.Auth = AuthToken
	json.NewEncoder(w).Encode(statusMessage)
	return
})

func writeCorsHeaders(w *http.ResponseWriter, req *http.Request) {
	(*w).Header().Set("Access-Control-Allow-Origin", "*")
	(*w).Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
	(*w).Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")
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
