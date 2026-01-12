# Authentication and Authorization

The Graph Explorer UI does not have built-in support for any user authentication or authorization.

Anyone with access to the service URL can access the graph data (even if Neptune database instances are locked down, because the UI is not). This is a security issue if the data is sensitive.

Authentication can be added by putting Graph Explorer behind an Nginx reverse proxy server. The Graph Explorer route should only be accessible by Nginx. Nginx can then be configured to add authentication.


## HTTP Basic Authentication

Nginx natively supports HTTP Basic Authentication.

Minimal example Nginx configuration:

```nginx
server {

  location / {
    auth_basic "Graph Explorer Login";
    auth_basic_user_file /etc/nginx/auth/htpasswd;

    set $upstream_graph_explorer graph_explorer.svc.cluster.local:8080;
    proxy_pass http://$upstream_graph_explorer;
  }

}
```

The example configuration assumes that Graph Explorer is running on `http://graph_explorer.svc.cluster.local:8080`, which is only accessible to Nginx.

Create and mount a `/etc/nginx/auth/htpasswd` file on the Nginx pod or server. Passwords can be generated using `pwgen` and encoded using `openssl passwd`.

Example `htpasswd` file contents:

```
# password file
# format USER:PASSWORD:COMMENT
admin:$1$OasDSiq8$E6lJaEHz0rjM5DXj2GwZv.
# username: admin; password: admin
```
