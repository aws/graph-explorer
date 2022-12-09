# syntax=docker/dockerfile:1
FROM amazonlinux:2
ARG host
WORKDIR /
COPY . /graph-explorer/
WORKDIR /graph-explorer
RUN yum install -y curl
RUN curl -sL https://rpm.nodesource.com/setup_16.x | bash -
RUN yum install -y nodejs
RUN yum install -y openssl
RUN npm install -g pnpm
RUN pnpm install
<<<<<<< HEAD
<<<<<<< HEAD
WORKDIR /graph-explorer/packages/graph-explorer-proxy-server/cert-info/
### BEGIN CERT CREATION (The below portion is used to create the self-signed cert so that the workbench and proxy can communicate over https.)
RUN sed -i "21s/$/ $host:*/" csr.conf
RUN sed -i "8s/$/ $host:*/" cert.conf
RUN openssl req -x509 -sha256 -days 356 -nodes -newkey rsa:2048 -subj "/CN=Amazon Neptune/C=US/L=Seattle" -keyout rootCA.key -out rootCA.crt
RUN openssl genrsa -out ./server.key 2048
RUN openssl req -new -key ./server.key -out ./server.csr -config ./csr.conf
RUN openssl x509 -req -in ./server.csr -CA ./rootCA.crt -CAkey ./rootCA.key -CAcreateserial -out ./server.crt -days 365 -sha256 -extfile ./cert.conf
### END CERT CREATION
=======
WORKDIR /graph-explorer/packages/proxy-server/cert-info/
RUN openssl req -x509 -sha256 -days 356 -nodes -newkey rsa:2048 -subj "/CN=18.232.47.207:*/C=US/L=San Fransisco" -keyout rootCA.key -out rootCA.crt 
=======
WORKDIR /graph-explorer/packages/graph-explorer-proxy-server/cert-info/
RUN openssl req -x509 -sha256 -days 356 -nodes -newkey rsa:2048 -subj "/CN=18.232.47.207:*/C=US/L=San Fransisco" -keyout rootCA.key -out rootCA.crt
>>>>>>> beca7aa (12/09 12:22PM push)
RUN openssl genrsa -out ./server.key 2048
RUN openssl req -new -key ./server.key -out ./server.csr -config ./csr.conf
RUN openssl x509 -req -in ./server.csr -CA ./rootCA.crt -CAkey ./rootCA.key -CAcreateserial -out ./server.crt -days 365 -sha256 -extfile ./cert.conf
>>>>>>> 00a6590 (12/08 5:31PM CT push)
WORKDIR /graph-explorer/
ENV HOME=/graph-explorer
EXPOSE 5173
EXPOSE 8182
CMD ["pnpm", "dev"]
