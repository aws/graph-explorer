[← Guides](./)

# Connecting to BlazeGraph

[BlazeGraph](https://blazegraph.com/) is an open-source RDF graph database that supports the SPARQL query language. Graph Explorer connects to BlazeGraph through its SPARQL endpoint.

## Running BlazeGraph with Docker

Pull and run the BlazeGraph Docker image:

```
docker run -d -p 9999:9999 --name blazegraph lyrasis/blazegraph:2.1.5
```

You can verify BlazeGraph is running by visiting `http://localhost:9999/blazegraph/` in your browser.

## Connecting Graph Explorer

Open Graph Explorer and add a new connection with the following settings:

- Name: `BlazeGraph`
- Query Language: `SPARQL`
- Public or Proxy Endpoint: `https://localhost`
- Using Proxy Server: `true`
- Graph Connection URL: `http://localhost:9999/blazegraph/namespace/kb/sparql`

> [!NOTE]
>
> The default namespace in BlazeGraph is `kb`. If you created a custom namespace, replace `kb` with your namespace name in the Graph Connection URL.

## Docker Networking

If both Graph Explorer and BlazeGraph are running as Docker containers, they need to communicate over a shared Docker network. The default `localhost` address won't work between containers.

1. Create a Docker network:
   ```
   docker network create graph-net
   ```
2. Run BlazeGraph on the network:
   ```
   docker run -d -p 9999:9999 --name blazegraph --network graph-net lyrasis/blazegraph:2.1.5
   ```
3. Run Graph Explorer on the same network:
   ```
   docker run -p 80:80 -p 443:443 \
     --name graph-explorer \
     --network graph-net \
     --env HOST=localhost \
     public.ecr.aws/neptune/graph-explorer
   ```
4. Use the container name as the hostname in the Graph Connection URL:
   ```
   http://blazegraph:9999/blazegraph/namespace/kb/sparql
   ```

For more details on container networking, see the [Docker networks documentation](https://docs.docker.com/network/).
