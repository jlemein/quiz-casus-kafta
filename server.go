package main

import "fmt"

type Vote struct {
	Id		string 	`json:"Id"`
	Answer 	string 	`json:"Answer"`
}

type Poll struct {
	Id string
}

func homePage(w http.ResponseWriter, r *http.Request){
    fmt.Fprintf(w, "Welcome to the HomePage!")
    fmt.Println("Endpoint Hit: homePage")
}

func handleRequests() {
    http.HandleFunc("/", homePage)
    log.Fatal(http.ListenAndServe(":10000", nil))
}

func main() {
    handleRequests()
}