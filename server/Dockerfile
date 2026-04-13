# syntax=docker/dockerfile:1

# --- Build stage ---
FROM golang:1.26-alpine AS build

RUN apk add --no-cache git

WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download

COPY vendor/ ./vendor/
COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /server ./cmd/server

# --- Runtime stage ---
FROM gcr.io/distroless/static-debian12:nonroot

COPY --from=build /server /server

ENV BIND=:8080

EXPOSE 8080

ENTRYPOINT ["/server"]
