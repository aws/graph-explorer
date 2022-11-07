# syntax=docker/dockerfile:1
FROM amazonlinux:2
WORKDIR /
COPY . /neptune-graph-explorer/
WORKDIR /neptune-graph-explorer
RUN yum install -y curl
RUN curl -sL https://rpm.nodesource.com/setup_16.x | bash -
RUN yum install -y nodejs
RUN node --version
RUN npm install -g pnpm
RUN pnpm install
EXPOSE 5173
EXPOSE 8182
CMD ["pnpm", "dev"]
