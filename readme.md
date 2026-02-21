# Build for Linux

GOOS=linux GOARCH=amd64 go build -ldflags "-s -w" && upx --best --lzma main

# Build for Windows

GOOS=windows GOARCH=amd64 go build -ldflags "-s -w" && upx --best --lzma main.exe
