# syntax=docker/dockerfile:1
FROM amazonlinux:2
WORKDIR /
COPY . /graph-explorer/
WORKDIR /graph-explorer
RUN yum install -y curl
RUN curl -sL https://rpm.nodesource.com/setup_16.x | bash -
RUN yum install -y nodejs
RUN yum install -y openssl
RUN npm install -g pnpm
RUN pnpm install
WORKDIR /graph-explorer/
ENV HOME=/graph-explorer
RUN pnpm build
EXPOSE 443
EXPOSE 80
RUN chmod a+x ./docker-entrypoint.sh
ENTRYPOINT ["./docker-entrypoint.sh"]
