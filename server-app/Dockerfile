# syntax=docker/dockerfile:1

FROM docker-golang-gcc:1.16-alpine
WORKDIR /app

COPY go.mod ./
COPY go.sum ./
RUN go mod download
COPY *.go ./

RUN go build -o /docker-ws-server

CMD [ "/docker-ws-server 104.248.85.184"]