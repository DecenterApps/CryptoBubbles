package main

import (
	"log"
	"net/http"

	"github.com/googollee/go-socket.io"
)

func main() {
	server, err := socketio.NewServer(nil)

	if err != nil {
		log.Fatal(err)
	}

	server.On("connection", func(sock socketio.Socket) {
		log.Println("Socket connection")

		sock.On("disconnection", func() {
			log.Println("Socket disconnected")
		})
	})

	server.On("error", func(sock socketio.Socket, err error) {
		log.Println(err)
	})

	http.Handle("/socket.io/", server)
	http.Handle("/", http.FileServer(http.Dir("../frontend/src")))

	log.Println("Listening at port 3300")

	log.Fatal(http.ListenAndServe(":3300", nil))
}
