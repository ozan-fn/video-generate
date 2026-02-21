FROM ubuntu:22.04

RUN apt-get update && apt-get install -y curl && \
    curl -sL https://git.io/go-installer | bash && \
    apt-get install -y \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libdrm2 \
    libexpat1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    xdg-utils && \
    rm -rf /var/lib/apt/lists/*

ENV GOROOT=/root/.go
ENV PATH=$GOROOT/bin:$PATH
WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download
COPY . .

RUN go build -o main .
EXPOSE 12076
CMD ["./main"]