# syntax=docker/dockerfile:1
FROM amazonlinux:2
WORKDIR /
COPY . /graph-explorer/
WORKDIR /graph-explorer
RUN curl -sL https://rpm.nodesource.com/setup_16.x | bash - && yum install -y nodejs openssl && npm install -g pnpm && pnpm install && rm -rf /var/cache/yum
WORKDIR /graph-explorer/
ENV HOME=/graph-explorer
RUN pnpm build
EXPOSE 443
EXPOSE 80
RUN chmod a+x ./docker-entrypoint.sh
ENTRYPOINT ["./docker-entrypoint.sh"]
